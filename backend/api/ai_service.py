import os
import json
from .models import BarterItem
import google.generativeai as genai

# Try to configure the Gemini API key from the environment
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

def get_ai_matches(user):
    """
    Uses Gemini API to find matches between a user's items/wants and the available items in the marketplace.
    If the API key is not configured, it falls back to a simple NLP keyword matching algorithm.
    """
    user_items = BarterItem.objects.filter(owner=user, status='active')
    other_items = BarterItem.objects.exclude(owner=user).filter(status='active')
    
    if not user_items.exists() or not other_items.exists():
        return []
        
    if gemini_api_key:
        return _get_gemini_matches(user_items, other_items)
    else:
        return _get_fallback_matches(user_items, other_items)
        
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
    
    # Simple keyword matching fallback
    for u_item in user_items:
        u_wants = u_item.wanting.lower().split(',') if u_item.wanting else []
        u_wants = [w.strip() for w in u_wants if w.strip() and w.strip() != 'anything']
        
        for m_item in other_items:
            m_wants = m_item.wanting.lower().split(',') if m_item.wanting else []
            m_wants = [w.strip() for w in m_wants if w.strip() and w.strip() != 'anything']
            
            # Check if market item matches what user wants
            user_likes = False
            if not u_wants:
                user_likes = True
            else:
                for w in u_wants:
                    if w in m_item.title.lower() or w in m_item.description.lower():
                        user_likes = True
                        break
                        
            # Check if user item matches what market item wants
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
                    "item_id": m_item.id,
                    "title": m_item.title,
                    "reason": f"Perfect match! You both have what the other wants. They are looking for '{m_item.wanting}' and you want '{u_item.wanting}'.",
                    "confidence": 85
                })
                
    return matches
