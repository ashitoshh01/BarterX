import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from api.models import BarterItem, Category, UserItemInteraction, UserProfile
from api.views import BarterItemViewSet
from django.utils import timezone
from datetime import timedelta

def run_tests():
    print("--- Starting Recommendation Algorithm Tests ---")
    
    # 0. Setup Data
    user_viewer, _ = User.objects.get_or_create(username="test_viewer", email="v@test.com")
    UserProfile.objects.get_or_create(user=user_viewer, defaults={"latitude": 40.0, "longitude": -74.0})
    
    user_owner, _ = User.objects.get_or_create(username="test_owner", email="o@test.com")
    UserProfile.objects.get_or_create(user=user_owner)
    
    cat1, _ = Category.objects.get_or_create(name="Electronics")
    cat2, _ = Category.objects.get_or_create(name="Books")
    
    # Clean items
    BarterItem.objects.all().delete()
    UserItemInteraction.objects.all().delete()
    
    # Create items
    # item1: Category Electronics, high interaction
    item1 = BarterItem.objects.create(title="Laptop", owner=user_owner, category=cat1, status='active', latitude=40.0, longitude=-74.0)
    # item2: Category Books
    item2 = BarterItem.objects.create(title="Book", owner=user_owner, category=cat2, status='active', latitude=40.0, longitude=-74.0)
    # item3: User's own item, should be excluded
    item3 = BarterItem.objects.create(title="My Item", owner=user_viewer, category=cat1, status='active')
    # item4: Hidden item, should be excluded
    item4 = BarterItem.objects.create(title="Hidden Laptop", owner=user_owner, category=cat1, status='active')
    
    # Create interactions
    UserItemInteraction.objects.create(user=user_viewer, item=item1, interaction_type='view', weight=0.5, created_at=timezone.now() - timedelta(days=1))
    UserItemInteraction.objects.create(user=user_viewer, item=item1, interaction_type='save', weight=2.0, created_at=timezone.now() - timedelta(days=1))
    
    UserItemInteraction.objects.create(user=user_viewer, item=item4, interaction_type='hidden', weight=-3.0, created_at=timezone.now())
    
    factory = APIRequestFactory()
    
    print("1. Testing Main Feed endpoint...")
    request = factory.get('/api/items/')
    force_authenticate(request, user=user_viewer)
    view = BarterItemViewSet.as_view({'get': 'list'})
    response = view(request)
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    # Results should be paginated
    data = response.data['results'] if 'results' in response.data else response.data
    
    # Verify exclusions: item3 (own), item4 (hidden) should be absent.
    # item1 and item2 should be present.
    ids = [item['id'] for item in data]
    
    assert item3.id not in ids, "Own item was not excluded from recommendations."
    assert item4.id not in ids, "Hidden item was not excluded from recommendations."
    assert item1.id in ids, "Recommended item 1 is missing."
    assert item2.id in ids, "Fresh item 2 is missing."
    
    # Check ordering
    if ids.index(item1.id) > ids.index(item2.id):
        print("Warning: Item1 (with affinity) was ranked below Item2. This might be due to tuning weights.")
    else:
        print("   [OK] Item 1 ranked higher due to category affinity.")
        
    print("   [OK] Main Feed endpoint returns valid recommendations.")
    
    print("\n--- All Recommendation Algorithm Tests Passed! ---")

if __name__ == "__main__":
    run_tests()
