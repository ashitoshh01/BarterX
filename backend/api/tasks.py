from celery import shared_task
from django.utils import timezone
from .models import BarterItem

@shared_task
def deactivate_expired_boosts():
    """Periodic task to deactivate items whose boost time has expired."""
    expired_items = BarterItem.objects.filter(is_boosted=True, boost_expires_at__lt=timezone.now())
    count = expired_items.update(is_boosted=False)
    return f"Deactivated {count} expired boosts."
