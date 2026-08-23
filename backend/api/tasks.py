from celery import shared_task
from django.utils import timezone
from .models import BarterItem

@shared_task
def deactivate_expired_boosts():
    """Periodic task to deactivate items whose boost time has expired."""
    expired_items = BarterItem.objects.filter(is_boosted=True, boost_expires_at__lt=timezone.now())
    count = expired_items.update(is_boosted=False)
    return f"Deactivated {count} expired boosts."

@shared_task
def refresh_user_recommendations(user_id):
    """
    Precomputes and caches recommendations for a single user.
    """
    from django.contrib.auth.models import User
    from django.core.cache import cache
    from api.recommendations import generate_candidates, score_item_for_user, diversify
    
    try:
        user = User.objects.get(id=user_id)
        candidates = generate_candidates(user)
        scored = [(item, score_item_for_user(user, item)) for item in candidates]
        scored.sort(key=lambda x: -x[1])
        diversified = diversify(scored)
        
        # Cache the resulting top 100 item IDs for 30 minutes
        cache.set(f"recs:{user_id}", [i.id for i in diversified[:100]], timeout=1800)
        return f"Refreshed recommendations for user {user_id}"
    except User.DoesNotExist:
        return f"User {user_id} not found."

@shared_task
def refresh_all_active_users_recommendations():
    """
    Periodic task to refresh recommendations for all users active in the last 24h.
    """
    from datetime import timedelta
    from django.contrib.auth.models import User
    from api.models import UserItemInteraction
    
    time_threshold = timezone.now() - timedelta(hours=24)
    
    # Users who logged in recently
    recent_logins = User.objects.filter(last_login__gte=time_threshold).values_list('id', flat=True)
    
    # Users who interacted with items recently
    recent_interactors = UserItemInteraction.objects.filter(
        created_at__gte=time_threshold
    ).values_list('user_id', flat=True)
    
    # Combine uniquely (set union) and trigger the sub-task for each
    active_user_ids = set(recent_logins) | set(recent_interactors)
    
    for user_id in active_user_ids:
        if user_id is not None:
            refresh_user_recommendations.delay(user_id)
            
    return f"Triggered recommendation refresh for {len(active_user_ids)} active users."

