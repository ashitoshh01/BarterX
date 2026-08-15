import os
import json
import math
from django.utils import timezone
from .models import BarterItem
import google.generativeai as genai

# Try to configure the Gemini API key from the environment
gemini_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_GENAI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula to compute distance in km between two coordinate points."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        R = 6371.0  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception:
        return None

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
    Find matches incorporating geographic relevance, trade compatibility, and trust score.
    Returns: list of matches with calculated scores.
    """
    user_items = BarterItem.objects.filter(owner=user, status='active')
    other_items = BarterItem.objects.exclude(owner=user).filter(status='active')
    
    if not user_items.exists() or not other_items.exists():
        return []

    # Get raw matches
    if gemini_api_key:
        raw_matches = _get_gemini_matches(user_items, other_items)
    else:
        raw_matches = _get_fallback_matches(user_items, other_items)

    # Enhance with location scoring & weights
    # recommendation_score = interest_score * 0.40 + location_score * 0.40 + trust_score * 0.20
    user_profile = getattr(user, 'profile', None)
    user_lat = user_profile.latitude if user_profile else None
    user_lon = user_profile.longitude if user_profile else None

    enhanced_matches = []
    for match in raw_matches:
        match_item = other_items.filter(id=match["match_item_id"]).first()
        if not match_item:
            continue

        # 1. Location score (radius of 100km max limit)
        location_score = 0.5  # default neutral
        distance = None
        if user_lat is not None and user_lon is not None and match_item.latitude is not None and match_item.longitude is not None:
            distance = calculate_distance(user_lat, user_lon, match_item.latitude, match_item.longitude)
            if distance is not None:
                # 0km distance = 1.0 score, 100km or more = 0.0 score
                location_score = max(0.0, min(1.0, 1.0 - (distance / 100.0)))

        # 2. Trust score (0-100 normalized to 0.0-1.0)
        match_owner_profile = getattr(match_item.owner, 'profile', None)
        trust_score = (match_owner_profile.trust_score / 100.0) if match_owner_profile else 0.2

        # 3. Base interest compatibility (represented by raw match confidence)
        interest_score = match.get("confidence", 85) / 100.0

        # Calculate weighted recommendation score
        final_score = int((interest_score * 0.40 + location_score * 0.40 + trust_score * 0.20) * 100)

        enhanced_matches.append({
            **match,
            "distance_km": round(distance, 1) if distance is not None else None,
            "recommendation_score": final_score,
            "location_relevance": "Near You" if (distance is not None and distance <= 25.0) else "Worth Traveling For",
            "trust_score": match_owner_profile.trust_score if match_owner_profile else 20
        })

    # Sort matches by recommendation score descending
    enhanced_matches.sort(key=lambda x: x["recommendation_score"], reverse=True)
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

def _get_fallback_matches(user_items, other_items):
    matches = []
    for u_item in user_items:
        u_wants = u_item.wanting.lower().split(',') if u_item.wanting else []
        u_wants = [w.strip() for w in u_wants if w.strip() and w.strip() != 'anything']
        
        for m_item in other_items:
            m_wants = m_item.wanting.lower().split(',') if m_item.wanting else []
            m_wants = [w.strip() for w in m_wants if w.strip() and w.strip() != 'anything']
            
            user_likes = False
            if not u_wants:
                user_likes = True
            else:
                for w in u_wants:
                    if w in m_item.title.lower() or w in m_item.description.lower():
                        user_likes = True
                        break
                        
            market_likes = False
            if not m_wants:
                market_likes = True
            else:
                for w in m_wants:
                    if w in u_item.title.lower() or w in u_item.description.lower():
                        market_likes = True
                        break
                        
            if user_likes and market_likes:
                matches.append({
                    "id": f"ai_match_{u_item.id}_{m_item.id}",
                    "user_item_id": u_item.id,
                    "match_item_id": m_item.id,
                    "item_id": m_item.id,
                    "title": m_item.title,
                    "reason": f"Match! You want '{m_item.title}' and they are looking for what you offer.",
                    "confidence": 85
                })
                
    return matches
