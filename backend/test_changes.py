import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from api.models import BarterItem, UserProfile, Category, WalletTransaction, TradeCoinReservation, BarterInterest
from api.views import BarterItemViewSet, CategoryViewSet, UserProfileViewSet
from django.core.cache import cache
from api.tasks import deactivate_expired_boosts
import json

def run_tests():
    print("--- Starting Detailed Tests ---")
    
    # 0. Setup Data
    user, _ = User.objects.get_or_create(username="testuser123", email="test@test.com")
    if not user.password:
        user.set_password("password")
        user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"coin_balance": 100})
    
    category, _ = Category.objects.get_or_create(name="Electronics")
    
    item, _ = BarterItem.objects.get_or_create(
        title="Test Item", 
        owner=user, 
        category=category, 
        defaults={
            "latitude": 40.0, 
            "longitude": -74.0, 
            "is_boosted": True, 
            "boost_expires_at": timezone.now() - timedelta(days=1)
        }
    )
    # Ensure it's expired
    item.is_boosted = True
    item.boost_expires_at = timezone.now() - timedelta(days=1)
    item.save()
    
    # 1. Test Celery Task (Expired Boosts)
    print("1. Testing Celery Task for Expired Boosts...")
    result = deactivate_expired_boosts()
    print(f"   Result: {result}")
    item.refresh_from_db()
    assert item.is_boosted == False, "Boost should be deactivated by the celery task."
    print("   [OK] Celery Task successful.")
    
    # 2. Test Category Caching & Signals
    print("2. Testing Category Caching and Invalidation Signals...")
    cache.delete('categories')
    factory = APIRequestFactory()
    request = factory.get('/')
    view = CategoryViewSet.as_view({'get': 'list'})
    response = view(request)
    assert response.status_code == 200
    
    cached_categories = cache.get('categories')
    assert cached_categories is not None, "Categories should be cached after view is called."
    
    category.description = "Updated"
    category.save()
    assert cache.get('categories') is None, "Cache should be invalidated after Category save."
    print("   [OK] Category cache & signals successful.")
    
    # 3. Test BarterItemViewSet History endpoint
    print("3. Testing BarterItem history endpoint...")
    request = factory.get('/')
    view = BarterItemViewSet.as_view({'get': 'history'})
    response = view(request, pk=item.id)
    assert response.status_code == 200
    print("   [OK] History endpoint returns 200.")
    
    # 4. Test Dashboard Stats Caching and Aggregation
    print("4. Testing Dashboard Stats endpoint...")
    request = factory.get('/')
    force_authenticate(request, user=user)
    BarterInterest.objects.get_or_create(requester=user, receiver=user, requested_item=item, offered_item=item, status='completed')
    view = UserProfileViewSet.as_view({'get': 'dashboard_stats'})
    response = view(request)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"
    assert response.data['successful_swaps'] >= 1
    
    cache_key = f"dashboard_stats:{user.id}"
    cached_stats = cache.get(cache_key)
    assert cached_stats is not None, "Dashboard stats should be cached."
    print("   [OK] Dashboard stats cache and aggregation successful.")
    
    # 5. Test WalletTransaction price_inr aggregation
    print("5. Testing WalletTransaction Admin Aggregation...")
    WalletTransaction.objects.create(
        user=user, amount=100, transaction_type='PURCHASE', status='SUCCESS', price_inr=50.00
    )
    from django.db.models import Sum
    purchase_txs = WalletTransaction.objects.filter(transaction_type='PURCHASE', status='SUCCESS')
    revenue = purchase_txs.aggregate(total=Sum('price_inr'))['total'] or 0.00
    assert revenue >= 50.00, "Revenue aggregation should capture the price_inr column."
    print("   [OK] WalletTransaction aggregation successful.")

    # 6. Check Indexes on DB
    print("6. Verifying Database Schema for Indexes...")
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = [row[0] for row in cursor.fetchall()]
        
        assert any('lat' in i and 'lon' in i for i in indexes), "Missing composite index on BarterItem"
        assert any('wallet' in i and 'user' in i for i in indexes), "Missing composite index on WalletTransaction"
    print("   [OK] Database indexes verified.")
    
    print("\n--- All integration tests passed successfully! ---")

if __name__ == "__main__":
    run_tests()
