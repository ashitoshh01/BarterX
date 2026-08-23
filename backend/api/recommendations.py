import math
from collections import defaultdict
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from api.models import BarterItem, UserItemInteraction, BarterInterest
from api.services import TYPE_WEIGHTS
from api.distance_service import haversine_distance_km

RECENCY_HALF_LIFE_DAYS = 7.0

def generate_candidates(user):
    """
    Phase 2: Candidate Generation
    Pulls candidate items from various sources (affinity, location, trending, fresh)
    and merges them, deduplicating by item ID.
    """
    
    # 1. Base Query & Exclusions
    # Start with items that are active and available, and prefetch relationships for serialization
    base_qs = BarterItem.objects.select_related('owner__profile', 'category')\
        .prefetch_related('additional_images')\
        .exclude(status__in=['archived', 'draft', 'traded'])
    
    if user.is_authenticated:
        # Exclude user's own items
        base_qs = base_qs.exclude(owner=user)
        
        # Exclude items the user has 'hidden'
        hidden_item_ids = UserItemInteraction.objects.filter(
            user=user, 
            interaction_type='hidden'
        ).values_list('item_id', flat=True)
        base_qs = base_qs.exclude(id__in=hidden_item_ids)
        
        # Exclude items the user already has an active offer on
        active_offer_item_ids = BarterInterest.objects.filter(
            requester=user,
            status__in=['pending', 'negotiating', 'countered', 'accepted']
        ).values_list('requested_item_id', flat=True)
        base_qs = base_qs.exclude(id__in=active_offer_item_ids)

    # 2. Source: Category Affinity (Limit ~100)
    category_affinity_items = []
    if user.is_authenticated:
        # Find top 5 categories the user interacts with most based on interaction weights
        top_categories = UserItemInteraction.objects.filter(user=user)\
            .values('item__category')\
            .annotate(score=Sum('weight'))\
            .order_by('-score')[:5]
        
        top_category_ids = [cat['item__category'] for cat in top_categories if cat['item__category']]
        if top_category_ids:
            category_affinity_items = list(
                base_qs.filter(category_id__in=top_category_ids).order_by('-created_at')[:100]
            )

    # 3. Source: Location Proximity (Limit ~100)
    location_items = []
    if user.is_authenticated and hasattr(user, 'profile') and user.profile.latitude and user.profile.longitude:
        lat = user.profile.latitude
        lng = user.profile.longitude
        radius_km = 50.0  # Default preferred radius
        
        # Existing nearby-items bounding-box calculation
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
        
        location_items = list(
            base_qs.filter(
                latitude__gte=lat - lat_delta, 
                latitude__lte=lat + lat_delta,
                longitude__gte=lng - lng_delta, 
                longitude__lte=lng + lng_delta
            ).order_by('-created_at')[:100]
        )

    # 4. Source: Trending - high views in last 48h (Limit ~30)
    forty_eight_hours_ago = timezone.now() - timedelta(hours=48)
    trending_items = list(
        base_qs.filter(created_at__gte=forty_eight_hours_ago).order_by('-views_count')[:30]
    )

    # 5. Source: Fresh Listings - newest overall (Limit ~20)
    fresh_items = list(base_qs.order_by('-created_at')[:20])

    # 6. Merge & Deduplicate
    all_candidates = category_affinity_items + location_items + trending_items + fresh_items
    
    unique_candidates = []
    seen_ids = set()
    for item in all_candidates:
        if item.id not in seen_ids:
            unique_candidates.append(item)
            seen_ids.add(item.id)
            
    return unique_candidates

def _get_user_category_affinities(user):
    """Helper to compute and cache the normalized category affinities for a user."""
    if not user.is_authenticated:
        return {}
        
    if hasattr(user, '_category_affinities_cache'):
        return user._category_affinities_cache

    now = timezone.now()
    cutoff = now - timedelta(days=180)
    
    interactions = UserItemInteraction.objects.filter(
        user=user,
        created_at__gte=cutoff
    ).select_related('item')

    category_scores = {}
    for interaction in interactions:
        cat_id = interaction.item.category_id
        if not cat_id:
            continue
            
        days_old = (now - interaction.created_at).total_seconds() / 86400.0
        decay = math.exp(-days_old / RECENCY_HALF_LIFE_DAYS)
        
        # Use TYPE_WEIGHTS explicitly as requested, falling back to interaction.weight
        weight = TYPE_WEIGHTS.get(interaction.interaction_type, interaction.weight)
        weighted_score = weight * decay
        
        category_scores[cat_id] = category_scores.get(cat_id, 0.0) + weighted_score

    if not category_scores:
        user._category_affinities_cache = {}
        return {}

    max_score = max(category_scores.values())
    if max_score <= 0:
        user._category_affinities_cache = {k: 0.0 for k in category_scores}
        return user._category_affinities_cache
        
    normalized_scores = {k: max(0.0, v / max_score) for k, v in category_scores.items()}
    user._category_affinities_cache = normalized_scores
    return normalized_scores

def category_affinity(user, category):
    """
    1. category_affinity(user, category) — weighted sum of the user's UserItemInteraction
    records for that category, decayed by recency (7-day half-life), normalized 0-1.
    """
    if not category or not user.is_authenticated:
        return 0.0
    
    cat_id = category.id if hasattr(category, 'id') else category
    affinities = _get_user_category_affinities(user)
    return affinities.get(cat_id, 0.0)

def recency_decay(created_at):
    """
    2. recency_decay(created_at) — exponential decay: math.exp(-days_old / RECENCY_HALF_LIFE_DAYS)
    """
    if not created_at:
        return 0.0
    now = timezone.now()
    days_old = (now - created_at).total_seconds() / 86400.0
    if days_old < 0:
        days_old = 0.0
    return math.exp(-days_old / RECENCY_HALF_LIFE_DAYS)

def proximity_score(user, item):
    """
    3. proximity_score(user, item) — reuse haversine distance. 
    Returns 0.5 if unknown, else max(0, 1 - distance_km / user_preferred_radius).
    """
    if not user.is_authenticated or not hasattr(user, 'profile'):
        return 0.5
        
    user_lat = user.profile.latitude
    user_lon = user.profile.longitude
    item_lat = item.latitude
    item_lon = item.longitude
    
    if user_lat is None or user_lon is None or item_lat is None or item_lon is None:
        return 0.5
        
    try:
        distance_km = haversine_distance_km(user_lat, user_lon, item_lat, item_lon)
    except ValueError:
        return 0.5
        
    user_preferred_radius = 50.0  # Hardcoded default for now
    
    return max(0.0, 1.0 - (distance_km / user_preferred_radius))

def score_item_for_user(user, item):
    """
    4. score_item_for_user(user, item) — combine all scores into a final ranking score.
    """
    affinity = category_affinity(user, item.category)
    recency = recency_decay(item.created_at)
    proximity = proximity_score(user, item)
    
    # Use views_count_last_7d if annotated, else fallback to total views
    views_count_7d = getattr(item, 'views_count_last_7d', item.views_count)
    
    score = (
        3.0 * affinity +
        1.5 * recency +
        2.0 * proximity +
        1.0 * min(views_count_7d / 100.0, 1.0) +
        (1.0 if item.is_boosted else 0.0)
    )
    
    return score

def diversify(scored_items, max_per_category=3, max_per_owner=2):
    """
    Phase 4: Diversification
    Limits consecutive items from the same category or owner to prevent near-duplicate clusters.
    """
    result = []
    category_counts = defaultdict(int)
    owner_counts = defaultdict(int)
    
    for item, score in scored_items:
        cat_id = item.category_id if hasattr(item, 'category_id') else getattr(item.category, 'id', None)
        owner_id = item.owner_id if hasattr(item, 'owner_id') else getattr(item.owner, 'id', None)
        
        if cat_id is not None and category_counts[cat_id] >= max_per_category:
            continue
        if owner_id is not None and owner_counts[owner_id] >= max_per_owner:
            continue
            
        result.append(item)
        if cat_id is not None:
            category_counts[cat_id] += 1
        if owner_id is not None:
            owner_counts[owner_id] += 1
            
    return result

def get_recommendations(user):
    """
    Main entry point for generating personalized recommendations.
    Combines Phase 2 (Candidates), Phase 3 (Scoring), and Phase 4 (Diversification).
    """
    # 1. Candidate Generation
    candidates = generate_candidates(user)
    
    # 2. Scoring
    scored_items = [(item, score_item_for_user(user, item)) for item in candidates]
    
    # 3. Ranking (Sort descending by score)
    scored_items.sort(key=lambda x: x[1], reverse=True)
    
    # 4. Diversification
    return diversify(scored_items)

