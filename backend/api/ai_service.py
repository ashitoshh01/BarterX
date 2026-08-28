import os
import json
import math
import warnings
from django.utils import timezone
from .models import BarterItem
from .distance_service import haversine_distance_km, format_distance

warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
import google.generativeai as genai

# Try to configure the Gemini API key from the environment
gemini_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_GENAI_API_KEY")
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
    except Exception:
        pass


def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula to compute distance in km between two coordinate points."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    return haversine_distance_km(lat1, lon1, lat2, lon2)


def is_interested_in(item_from, item_to):
    """Simple semantic check to see if owner of item_from would want item_to."""
    if item_from.owner == item_to.owner:
        return False
    wants = (item_from.wanting or '').lower()
    offering = ((item_to.title or '') + ' ' + (item_to.description or '')).lower()

    if not wants or wants == 'anything':
        return True

    keywords = [kw.strip() for kw in wants.split(',') if kw.strip()]
    for kw in keywords:
        if kw in offering:
            return True
    return False


def get_ai_matches(user):
    """
    Finds barter matches using Gemini AI / NLP keyword fallback, then enhances
    each match with Location Proximity Scoring and User Trust Scoring.

    Final Recommendation Score Weighting:
    - With Location: AI Score (60%) + Location Proximity Score (25%) + Trust Score (15%)
    - Without Location: AI Score (80%) + Trust Score (20%)
    """
    user_items = BarterItem.objects.filter(owner=user, status='active')
    other_items = BarterItem.objects.exclude(owner=user).filter(status='active')

    if not user_items.exists() or not other_items.exists():
        return []

    if gemini_api_key:
        raw_matches = _get_gemini_matches(user_items, other_items)
    else:
        raw_matches = _get_fallback_matches(user_items, other_items)

    # Get user profile coordinates
    user_profile = getattr(user, 'profile', None)
    user_lat = float(user_profile.latitude) if (user_profile and user_profile.latitude is not None) else None
    user_lng = float(user_profile.longitude) if (user_profile and user_profile.longitude is not None) else None
    has_user_coords = user_lat is not None and user_lng is not None

    enhanced_matches = []

    for m in raw_matches:
        match_item_id = m.get('match_item_id') or m.get('item_id')
        match_item = other_items.filter(id=match_item_id).first() if match_item_id else None

        if not match_item:
            continue

        owner_profile = getattr(match_item.owner, 'profile', None)
        ai_score = float(m.get('confidence', 85.0))
        trust_score = float(owner_profile.trust_score if owner_profile else 50.0)

        dist_km = None
        prox_score = None
        dist_formatted = None
        has_location_match = False

        if has_user_coords and match_item.latitude is not None and match_item.longitude is not None:
            try:
                item_lat = float(match_item.latitude)
                item_lng = float(match_item.longitude)
                dist_km = haversine_distance_km(user_lat, user_lng, item_lat, item_lng)
                # Proximity score decay: 100 at 0km, ~67 at 10km, ~36.8 at 25km, ~13.5 at 50km
                prox_score = max(0.0, min(100.0, 100.0 * math.exp(-dist_km / 25.0)))
                dist_formatted = format_distance(dist_km)
                has_location_match = True
            except Exception:
                pass

        if has_location_match and prox_score is not None:
            final_score = int(round((ai_score * 0.60) + (prox_score * 0.25) + (trust_score * 0.15)))
        else:
            final_score = int(round((ai_score * 0.80) + (trust_score * 0.20)))

        final_score = max(1, min(99, final_score))

        # Generate clear, natural reason for match
        if has_location_match and dist_formatted:
            if ai_score >= 85 and dist_km <= 5.0:
                reason = f"Excellent match ({int(ai_score)}% compatibility) and only {dist_formatted} from your location."
            elif ai_score >= 85:
                reason = f"Strong match ({int(ai_score)}% compatibility) located {dist_formatted}."
            elif dist_km <= 5.0:
                reason = f"Good match with a swapper only {dist_formatted}."
            else:
                reason = f"Barter match located {dist_formatted}."
        else:
            reason = m.get("reason") or f"Good barter compatibility ({int(ai_score)}% match) with a trusted swapper."

        m_copy = dict(m)
        m_copy["confidence"] = final_score
        m_copy["score"] = final_score
        m_copy["final_score"] = final_score
        m_copy["recommendation_score"] = final_score
        m_copy["ai_score"] = int(round(ai_score))
        m_copy["proximity_score"] = round(prox_score, 1) if prox_score is not None else None
        m_copy["trust_score"] = int(round(trust_score))
        m_copy["distance_km"] = dist_km
        m_copy["distance_formatted"] = dist_formatted
        m_copy["reason"] = reason

        enhanced_matches.append(m_copy)

    enhanced_matches.sort(key=lambda x: x["final_score"], reverse=True)
    return enhanced_matches


def find_3_party_loops(user):
    """
    Detect circular 3-party swap loops (A -> B -> C -> A).
    Returns: list of loops.
    """
    user_items = BarterItem.objects.filter(owner=user, status='active')
    all_active_items = BarterItem.objects.filter(status='active')

    loops = []
    seen_loops = set()

    for item_a in user_items:
        for item_b in all_active_items:
            if item_b.owner == user:
                continue
            if is_interested_in(item_a, item_b):  # You give A, want B
                for item_c in all_active_items:
                    if item_c.owner == user or item_c.owner == item_b.owner:
                        continue
                    if is_interested_in(item_b, item_c):  # B wants C
                        if is_interested_in(item_c, item_a):  # C wants A
                            loop_key = tuple(sorted([item_a.id, item_b.id, item_c.id]))
                            if loop_key not in seen_loops:
                                seen_loops.add(loop_key)
                                loops.append({
                                    "id": f"loop_{item_a.id}_{item_b.id}_{item_c.id}",
                                    "user_item": {
                                        "id": item_a.id,
                                        "title": item_a.title,
                                        "owner": item_a.owner.username
                                    },
                                    "party_b_item": {
                                        "id": item_b.id,
                                        "title": item_b.title,
                                        "owner": item_b.owner.username
                                    },
                                    "party_c_item": {
                                        "id": item_c.id,
                                        "title": item_c.title,
                                        "owner": item_c.owner.username
                                    },
                                    "visual_path": [
                                        {"from": "You", "gives": item_a.title, "to": item_b.owner.username},
                                        {"from": item_b.owner.username, "gives": item_b.title, "to": item_c.owner.username},
                                        {"from": item_c.owner.username, "gives": item_c.title, "to": "You"}
                                    ]
                                })
    return loops


def _get_gemini_matches(user_items, other_items):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        user_catalog = [{"id": item.id, "title": item.title, "wants": item.wanting} for item in user_items]
        market_catalog = [{"id": item.id, "title": item.title, "wants": item.wanting} for item in other_items]

        prompt = f"""
        You are an AI matching engine for a barter marketplace.
        Given the current user's items and their wants, find the best matches from the market catalog.

        User's items:
        {json.dumps(user_catalog, indent=2)}

        Market items:
        {json.dumps(market_catalog, indent=2)}

        A match is good if the user wants what the market item offers, AND the market item owner wants what the user offers.
        Return a JSON array of objects with the following structure. Do NOT include markdown code blocks, just raw JSON:
        [
          {{
            "user_item_id": 1,
            "match_item_id": 2,
            "reason": "Explain why this is a great match based on their mutual wants."
          }}
        ]
        """

        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]

        matches_data = json.loads(text)

        results = []
        for match in matches_data:
            user_item = user_items.filter(id=match.get('user_item_id')).first()
            match_item = other_items.filter(id=match.get('match_item_id')).first()

            if user_item and match_item:
                results.append({
                    "id": f"ai_match_{user_item.id}_{match_item.id}",
                    "user_item_id": user_item.id,
                    "match_item_id": match_item.id,
                    "item_id": match_item.id,
                    "title": match_item.title,
                    "reason": match.get("reason"),
                    "confidence": 95
                })
        return results
    except Exception as e:
        print("Gemini API Error:", e)
        return _get_fallback_matches(user_items, other_items)


STOP_WORDS = {'a', 'an', 'the', 'and', 'or', 'for', 'to', 'in', 'on', 'with', 'of', 'at', 'by', 'from', 'similar', 'anything', 'any', 'preferred', 'combo', 'like'}


def _extract_keywords(text):
    if not text:
        return set()
    words = text.lower().replace('/', ' ').replace('-', ' ').replace('(', ' ').replace(')', ' ').replace('"', ' ').split()
    return {w.strip() for w in words if len(w.strip()) > 2 and w.strip() not in STOP_WORDS}


def _get_fallback_matches(user_items, other_items):
    matches = []

    for u_item in user_items:
        u_wants = _extract_keywords(u_item.wanting)
        u_offers = _extract_keywords(f"{u_item.title} {u_item.offering} {u_item.description or ''}")

        for m_item in other_items:
            m_wants = _extract_keywords(m_item.wanting)
            m_offers = _extract_keywords(f"{m_item.title} {m_item.offering} {m_item.description or ''}")

            user_likes = bool(u_wants & m_offers)
            market_likes = bool(m_wants & u_offers)

            confidence = 0
            if user_likes and market_likes:
                confidence = 90
                reason = f"Mutual match! You are looking for '{m_item.title}' and they offer what you want."
            elif user_likes:
                confidence = 82
                reason = f"Strong match! '{m_item.title}' matches your desired items."
            elif market_likes:
                confidence = 78
                reason = f"Good match! They are looking for items like your '{u_item.title}'."
            elif not u_wants or not m_wants:
                confidence = 70
                reason = f"Barter match candidate with an active marketplace item."

            if confidence > 0:
                matches.append({
                    "id": f"ai_match_{u_item.id}_{m_item.id}",
                    "user_item_id": u_item.id,
                    "match_item_id": m_item.id,
                    "item_id": m_item.id,
                    "title": m_item.title,
                    "reason": reason,
                    "confidence": confidence
                })

    return matches
