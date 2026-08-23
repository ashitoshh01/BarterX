# Personalized Listing Recommendation Algorithm — Design Doc

> Goal: instead of showing every user the same global feed of items, rank/filter listings so each user sees items relevant to *their* behavior — like the Instagram/YouTube/Spotify "for you" feed, adapted for a barter marketplace.

---

## 1. The Shape of the Problem

Every recommendation system, regardless of company, does the same 4 steps:

```
1. COLLECT SIGNALS   → what do we know about this user?
2. GENERATE CANDIDATES → which items are even plausible to show them? (narrow from "all items" to a few hundred)
3. SCORE & RANK       → order those candidates by predicted relevance
4. DIVERSIFY & SERVE  → don't show 10 near-identical items back to back
```

You do **not** need Instagram's infrastructure to do this well. You need steps 1–4 done honestly. Start with a weighted-scoring version (below) — it's a real recommendation algorithm, just not a neural one. You can swap in ML later without changing the shape.

---

## 2. Step 1 — Signals to Collect

You likely already have most of these in your models. What you need to *start recording* if you aren't already:

### Explicit signals (user says it directly)
| Signal | Where it comes from | Weight direction |
|---|---|---|
| Item saved/favorited | existing "interest" or wishlist action | strong positive |
| Item reported/hidden | user hides an item | strong negative |
| Category selected in filters | search/filter UI | positive for that category |
| Completed trade | `Trade` model | very strong positive for that category/owner |

### Implicit signals (inferred from behavior)
| Signal | Where it comes from | Weight direction |
|---|---|---|
| Item viewed | `views_count` logic, but **per-user**, not just global | mild positive |
| Time spent on item detail page | frontend event → log | positive, scaled by duration |
| Item clicked from feed but not opened | scroll-past | neutral/mild negative |
| Search query text | search endpoint | positive for matching category/keywords |
| Proposal/offer sent on an item | `BarterInterest`/`Trade` flow | strong positive |
| Location | user profile / device | positive for nearby items |
| Time of day / day of week active | login/activity timestamps | affects *when* to surface certain items |

**New model you'll need** (if you don't have per-user interaction logging yet):

```python
class UserItemInteraction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='item_interactions')
    item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='user_interactions')
    interaction_type = models.CharField(max_length=20, choices=[
        ('view', 'View'),
        ('detail_view', 'Detail View'),
        ('save', 'Save/Favorite'),
        ('offer_sent', 'Offer Sent'),
        ('traded', 'Traded'),
        ('hidden', 'Hidden/Not Interested'),
    ])
    weight = models.FloatField(default=1.0)   # lets you tune impact per event without a migration
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['item', 'interaction_type']),
        ]
```

This single table is the backbone of everything below. Log an event here every time a user views, saves, offers on, or hides an item. Cheap to write, and it's what lets you compute affinity later.

---

## 3. Step 2 — Candidate Generation

**Why this step exists:** scoring every single item in the DB for every user on every request doesn't scale. You first cut "all items" down to a manageable candidate pool (a few hundred), *then* score those precisely.

Pull candidates from several sources in parallel, then merge (dedupe by item id):

| Source | Query idea | Typical pool size |
|---|---|---|
| **Category affinity** | Items in categories the user has interacted with most, weighted by recency | 100 |
| **Location proximity** | Items within user's preferred radius (reuse your nearby bounding-box fix) | 100 |
| **Collaborative — "users like you"** | Items saved/traded by users who share ≥N interactions with this user (see §5) | 50 |
| **Trending/boosted** | Recently boosted items, or items with high view velocity in last 24h | 30 |
| **Fresh listings** | Newest items overall, small slice so new sellers aren't invisible | 20 |
| **Because-you-viewed** | Items similar (same category + overlapping tags) to items the user viewed in last 7 days | 50 |

Merge → dedupe → exclude items the user already hid, already traded for, or already owns → you now have your candidate pool (~300–400 items) to actually rank.

---

## 4. Step 3 — Scoring Formula (the core algorithm)

For each candidate item, compute a single relevance score. This is your MVP algorithm — a weighted linear combination, which is exactly how most production feeds start (Instagram's early ranking was linear too, before deep learning).

```python
def score_item_for_user(user, item, user_profile_vector):
    score = 0.0

    # 1. Category affinity — how much has this user engaged with this category historically?
    score += 3.0 * category_affinity(user, item.category)

    # 2. Recency of listing — newer items get a boost, decaying over time
    score += 1.5 * recency_decay(item.created_at)

    # 3. Proximity — closer items score higher (only if user has location enabled)
    score += 2.0 * proximity_score(user, item)

    # 4. Popularity signal — but capped, so it doesn't just become "most viewed wins"
    score += 1.0 * min(item.views_count_last_7d / 100, 1.0)

    # 5. Boost — paid/promoted items get an explicit lift (business logic, not "cheating" —
    #    just make sure it's capped so boosted-but-irrelevant items don't dominate)
    score += 1.0 if item.is_boosted else 0

    # 6. Collaborative signal — did similar users engage with this item? (see §5)
    score += 2.5 * collaborative_score(user, item)

    # 7. Negative signals — actively suppress items similar to ones user hid
    score -= 5.0 * similarity_to_hidden_items(user, item)

    # 8. Diversity penalty applied LATER at serve time, not here (see §6)

    return score
```

**Where the weights (3.0, 1.5, 2.0...) come from:** start with your best guess, then tune based on actual outcomes (did the user click/save/trade the items you showed them?). This is the one part of the system worth revisiting every few weeks once you have data — don't over-think the exact numbers on day one.

### `category_affinity(user, category)` — concrete implementation
```python
def category_affinity(user, category):
    # Weighted count of user's interactions with this category, recency-decayed
    interactions = UserItemInteraction.objects.filter(
        user=user, item__category=category
    ).annotate(
        recency_weight=ExpressionWrapper(
            1.0 / (Extract(Now() - F('created_at'), 'epoch') / 86400 + 1),  # decays over days
            output_field=FloatField()
        )
    )
    type_weights = {'view': 0.5, 'detail_view': 1.0, 'save': 2.0, 'offer_sent': 3.0, 'traded': 5.0, 'hidden': -3.0}
    total = sum(type_weights.get(i.interaction_type, 0) * i.recency_weight for i in interactions)
    return normalize(total)  # squash to 0-1 range, e.g. via sigmoid or min-max against user's own max
```

### `recency_decay(created_at)`
```python
def recency_decay(created_at):
    days_old = (timezone.now() - created_at).days
    return math.exp(-days_old / 14)  # half-relevance roughly every 2 weeks; tune constant to your listing lifespan
```

### `proximity_score(user, item)`
```python
def proximity_score(user, item):
    if not user.profile.location_lat or item.latitude is None:
        return 0.5  # neutral if location unknown, don't penalize
    dist_km = haversine_distance_km(user.profile.location_lat, user.profile.location_lng,
                                     item.latitude, item.longitude)
    max_radius = user.profile.preferred_radius_km or 25
    return max(0, 1 - (dist_km / max_radius))
```

---

## 5. Collaborative Filtering (the "users like you" piece)

This is the part that makes recommendations feel *smart* rather than just "filtered by category" — it's how Spotify surfaces a song you never searched for. You don't need matrix factorization on day one; a simple item-based approach works well at your scale:

**Item-item similarity** (easier to start with than user-user): "people who saved/traded item A also saved/traded item B" → so if the current user interacted with A, boost B.

```python
def collaborative_score(user, candidate_item):
    # Items this user has positively interacted with
    user_liked_items = UserItemInteraction.objects.filter(
        user=user, interaction_type__in=['save', 'offer_sent', 'traded']
    ).values_list('item_id', flat=True)

    if not user_liked_items:
        return 0.0

    # How many OTHER users who liked those same items also liked candidate_item?
    co_occurrence = UserItemInteraction.objects.filter(
        item__in=user_liked_items,
        interaction_type__in=['save', 'offer_sent', 'traded']
    ).exclude(user=user).values_list('user_id', flat=True).distinct()

    overlap = UserItemInteraction.objects.filter(
        user_id__in=co_occurrence,
        item=candidate_item,
        interaction_type__in=['save', 'offer_sent', 'traded']
    ).count()

    return normalize(overlap)
```

**This query is expensive to run live per-request.** Precompute it — see §7 (offline job).

---

## 6. Step 4 — Diversify Before Serving

After scoring, don't just return the top N — you'll end up showing 10 near-identical items (same category, same seller). Apply a simple diversity pass:

```python
def diversify(ranked_items, max_per_category=3, max_per_owner=2):
    result = []
    category_counts = defaultdict(int)
    owner_counts = defaultdict(int)

    for item in ranked_items:  # already sorted by score, descending
        if category_counts[item.category_id] >= max_per_category:
            continue
        if owner_counts[item.owner_id] >= max_per_owner:
            continue
        result.append(item)
        category_counts[item.category_id] += 1
        owner_counts[item.owner_id] += 1

    return result
```

This is what stops your feed from feeling repetitive even when the scoring is accurate.

---

## 7. Making It Fast — Precompute, Don't Compute Live

Scoring hundreds of candidates with collaborative filtering on every single feed request will be slow. Production systems solve this by splitting work into **offline** (batch, precomputed) and **online** (fast, per-request):

| Stage | When | What |
|---|---|---|
| **Offline (Celery Beat, every 15–30 min)** | Background | Recompute each active user's category affinity vector and a cached list of ~50-100 "candidate item ids with base scores" |
| **Online (per API request)** | Live, `<200ms` | Fetch precomputed candidates from cache, apply light re-ranking (boost freshness/proximity which change fast), apply diversity, return |

```python
# Celery task — runs periodically
@shared_task
def refresh_user_recommendations(user_id):
    user = User.objects.get(id=user_id)
    candidates = generate_candidates(user)          # Step 2
    scored = [(item, score_item_for_user(user, item)) for item in candidates]
    scored.sort(key=lambda x: -x[1])
    cache.set(f"recs:{user_id}", [i.id for i, s in scored[:100]], timeout=1800)  # 30 min TTL

# API view — fast path
class FeedView(APIView):
    def get(self, request):
        cached_ids = cache.get(f"recs:{request.user.id}")
        if not cached_ids:
            refresh_user_recommendations.delay(request.user.id)  # trigger async, fall back to default feed now
            return Response(default_feed())
        items = BarterItem.objects.filter(id__in=cached_ids)
        # light re-rank here for freshness/proximity, then diversify
        return Response(serialize(diversify(items)))
```

Run `refresh_user_recommendations` for active users on a schedule (e.g. every 30 min for users active in the last 24h), and trigger it immediately after high-signal events (a trade completes, an item is saved) so the feed feels responsive.

---

## 8. Cold Start (new users / new items)

Every recommender needs a fallback for when there's no data yet:

- **New user, no interactions:** fall back to location + trending + fresh listings only (skip category affinity and collaborative scoring — they'll just return 0/neutral anyway). Ask 2-3 onboarding questions ("what are you looking to trade for?") to seed category affinity immediately instead of waiting for organic signal.
- **New item, no views yet:** give it a temporary "freshness" boost in candidate generation (already covered in §3's recency term) so it gets initial exposure to prove itself before collaborative signals exist.

---

## 9. Suggested Build Order

1. **Add `UserItemInteraction` model** and start logging view/save/offer/trade/hide events immediately, even before you use them. You can't retroactively recover this data — the sooner you start logging, the sooner collaborative filtering has something to work with.
2. **Ship category affinity + recency + proximity scoring only** (skip collaborative filtering at first — it needs interaction volume to be meaningful anyway). This alone will already feel much better than an unranked feed.
3. **Add the diversity pass** (§6) — cheap, high perceived-quality improvement.
4. **Move to precomputed/cached scoring** (§7) once you notice feed requests getting slow, or once you have enough users that live scoring becomes expensive.
5. **Add collaborative filtering** (§5) once `UserItemInteraction` has real volume (a few weeks of data, roughly).
6. **Tune weights** based on actual outcomes — track whether items you rank highly actually get saved/offered-on more than random placement would predict. This is your feedback loop.
7. **(Much later, only if needed)** — replace the linear scoring formula with a learned model (logistic regression on the same features is a natural first ML step; full embeddings/deep learning only worth it at real scale). You will not need this for a long time — don't build it prematurely.

---

## 10. What NOT to Do

- Don't build embeddings/ML models before you have basic interaction logging in place — there's nothing to learn from yet.
- Don't let `is_boosted` dominate the score — paid promotion should nudge ranking, not override relevance, or the feed stops feeling personalized and users learn to ignore it.
- Don't recompute collaborative filtering live per-request — it will not scale past a small number of concurrent users.
- Don't skip the diversity pass — a "technically correct" ranking that shows 8 shirts from the same seller in a row still feels broken to the user.

---

## 11. Addendum — Gotchas & Refinements

### 11.1 `UserItemInteraction` table growth

Logging every scroll-past view means the table grows roughly proportional to `active users × session length × items per session` — this compounds fast and will slow down affinity queries long before 6 months of data piles up. Mitigate at three levels, not just one:

**a) Reduce what you log in the first place.** Don't fire a `view` event on every item that scrolls past — debounce on the client so `view` only logs if the item stayed in viewport for ~1-2 seconds. This alone removes most of the noise before it ever reaches the DB.

```javascript
// Client-side: only fire view event after item has been visible for 1.5s
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      viewTimers[entry.target.dataset.itemId] = setTimeout(() => {
        logInteraction(entry.target.dataset.itemId, 'view');
      }, 1500);
    } else {
      clearTimeout(viewTimers[entry.target.dataset.itemId]);
    }
  });
}, { threshold: 0.5 });
```

**b) Aggregate before you archive.** Don't just delete old rows — collapse them into a rollup first, so you keep the *signal* (category affinity strength) without keeping every raw row:

```python
class UserCategoryAffinityHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    month = models.DateField()  # first-of-month bucket
    interaction_score = models.FloatField()  # sum of weighted interactions for that month

    class Meta:
        unique_together = ('user', 'category', 'month')
```

```python
@shared_task
def archive_old_interactions():
    cutoff = timezone.now() - timedelta(days=180)
    old = UserItemInteraction.objects.filter(created_at__lt=cutoff)

    # roll up into monthly per-user-per-category aggregates before deleting
    rollups = old.annotate(month=TruncMonth('created_at')).values(
        'user', 'item__category', 'month'
    ).annotate(total_weight=Sum('weight'))

    for r in rollups:
        UserCategoryAffinityHistory.objects.update_or_create(
            user_id=r['user'], category_id=r['item__category'], month=r['month'],
            defaults={'interaction_score': F('interaction_score') + r['total_weight']}
        )

    old.delete()
```

Run this monthly via Celery Beat, not as a one-off — it should be routine maintenance, not a manual cleanup task you remember to run when the DB starts complaining.

**c) Keep the live table lean by design, not just by cleanup.** Since affinity queries (§4, `category_affinity()`) only need recent behavior anyway (older interactions are already down-weighted by recency decay), querying against a 180-day window instead of the full table is both correct *and* faster — add `created_at__gte=cutoff` to that query regardless of whether archiving has run yet.

### 11.2 "Time spent" is unreliable — exclude it from v1

Don't just deprioritize this signal — leave it out of scoring entirely for v1. A tab left open while someone gets coffee produces a "5 minute dwell time" that looks like strong interest but means nothing. If you want to use it eventually, it needs real work first: pause the timer on `visibilitychange`/`blur`, only count time while the tab is focused and the page is actually in view, and even then treat it as a low-weight tiebreaker rather than a primary signal.

Ship v1 on hard actions only: `view` (with the 1.5s dwell threshold from 11.1), `save`, `offer_sent`, `traded`, `hidden`. These are unambiguous — a save or an offer means something happened, no inference required. Revisit time-on-page only if you find hard actions alone aren't giving enough signal, and treat it as an *addition* to the scoring formula, not a replacement for anything.

### 11.3 Tune recency decay to your actual trade velocity, not a guess

The 14-day half-life in §3 was a placeholder — the right number depends entirely on how fast items move on your platform, and guessing wrong in either direction hurts:

- **Too slow (half-life too long):** week-old listings still get scored as "fresh" long after the window where they'd realistically get engagement — the feed feels stale.
- **Too fast (half-life too short):** legitimately good older listings vanish from feeds prematurely, hurting sellers whose items just haven't been seen yet.

Once you have a few weeks of real data, don't guess — measure. Pull the median time from listing creation to first offer (or first save) across your item history, and set the half-life around that number:

```python
from django.db.models import F, Avg
from django.db.models.functions import Extract

median_time_to_offer = (
    BarterItem.objects
    .filter(offers__isnull=False)
    .annotate(
        days_to_first_offer=Extract(F('offers__first__created_at') - F('created_at'), 'epoch') / 86400
    )
    .aggregate(median=Avg('days_to_first_offer'))  # use a proper median in prod (Postgres percentile_cont), Avg is a rough stand-in
)
```

For a fast-moving barter marketplace, start the constant at **5–7 days** rather than 14 — you can always loosen it later if data shows items are still getting engagement well past that window. Re-check this number periodically (e.g. quarterly) since trade velocity will likely change as your user base and category mix grow.