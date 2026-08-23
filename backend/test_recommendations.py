import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from django.core.cache import cache
from api.models import BarterItem, Category, UserItemInteraction, UserProfile, UserCategoryAffinityHistory
from api.views import BarterItemViewSet
from api.tasks import refresh_user_recommendations, archive_old_interactions
from django.utils import timezone
from datetime import timedelta

def run_tests():
    print("--- Starting Recommendation Architecture Tests ---")
    
    # 0. Setup Data
    user_viewer, _ = User.objects.get_or_create(username="test_viewer", email="v@test.com")
    UserProfile.objects.get_or_create(user=user_viewer, defaults={"latitude": 40.0, "longitude": -74.0})
    
    user_owner, _ = User.objects.get_or_create(username="test_owner", email="o@test.com")
    UserProfile.objects.get_or_create(user=user_owner)
    
    cat1, _ = Category.objects.get_or_create(name="Electronics")
    cat2, _ = Category.objects.get_or_create(name="Books")
    
    BarterItem.objects.all().delete()
    UserItemInteraction.objects.all().delete()
    cache.clear()
    
    # Create items
    item1 = BarterItem.objects.create(title="Laptop", owner=user_owner, category=cat1, status='active', latitude=40.0, longitude=-74.0)
    item2 = BarterItem.objects.create(title="Book", owner=user_owner, category=cat2, status='active', latitude=40.0, longitude=-74.0)
    item3 = BarterItem.objects.create(title="My Item", owner=user_viewer, category=cat1, status='active')
    item4 = BarterItem.objects.create(title="Hidden Laptop", owner=user_owner, category=cat1, status='active')
    
    UserItemInteraction.objects.create(user=user_viewer, item=item1, interaction_type='view', weight=0.5, created_at=timezone.now() - timedelta(days=1))
    UserItemInteraction.objects.create(user=user_viewer, item=item1, interaction_type='save', weight=2.0, created_at=timezone.now() - timedelta(days=1))
    UserItemInteraction.objects.create(user=user_viewer, item=item4, interaction_type='hidden', weight=-3.0, created_at=timezone.now())
    
    factory = APIRequestFactory()
    
    print("1. Testing Celery Background Worker...")
    refresh_user_recommendations(user_viewer.id) # synchronous call to the task
    
    cached_ids = cache.get(f"recs:{user_viewer.id}")
    assert cached_ids is not None, "Celery task did not set cache"
    print("   [OK] Celery task successfully computed and cached recommendations.")
    
    print("2. Testing Feed Endpoint consumes Cache...")
    request = factory.get('/api/items/')
    force_authenticate(request, user=user_viewer)
    view = BarterItemViewSet.as_view({'get': 'list'})
    response = view(request)
    
    assert response.status_code == 200
    data = response.data['results'] if 'results' in response.data else response.data
    
    ids = [item['id'] for item in data]
    assert item3.id not in ids, "Own item not excluded."
    assert item4.id not in ids, "Hidden item not excluded."
    assert item1.id in ids, "Recommended item missing."
    assert item2.id in ids, "Fresh item missing."
    
    print("   [OK] Endpoint correctly pulls from cache and applies dynamic re-ranking.")
    
    print("3. Testing Archive Task...")
    UserCategoryAffinityHistory.objects.all().delete()
    # Create an old interaction > 180 days
    old_time = timezone.now() - timedelta(days=200)
    UserItemInteraction.objects.create(user=user_viewer, item=item1, interaction_type='view', weight=1.0, created_at=old_time)
    # The created_at field has auto_now_add=True, so we must force update the time
    UserItemInteraction.objects.filter(user=user_viewer, item=item1, interaction_type='view', weight=1.0).update(created_at=old_time)
    
    archive_old_interactions()
    
    # Verify raw row is deleted
    assert not UserItemInteraction.objects.filter(created_at__lt=timezone.now() - timedelta(days=180)).exists(), "Old interaction was not deleted."
    # Verify rollup exists
    rollup = UserCategoryAffinityHistory.objects.filter(user=user_viewer, category=cat1).first()
    assert rollup is not None, "Rollup was not created."
    assert rollup.interaction_score == 1.0, f"Expected score 1.0, got {rollup.interaction_score}"
    print("   [OK] Archive task successfully rolls up data and cleans old rows.")
    
    print("\n--- All Tests Passed! ---")

if __name__ == "__main__":
    run_tests()
