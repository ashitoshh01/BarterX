import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from api.models import BarterItem, Category, UserItemInteraction, BarterInterest, Trade, UserProfile, SavedItem
from api.views import SavedItemViewSet, BarterItemViewSet, BarterInterestViewSet, TradeViewSet
from django.utils import timezone

def run_tests():
    print("--- Starting Recommendation Logging Tests ---")
    
    # 0. Setup Data
    user1, _ = User.objects.get_or_create(username="testuser_a", email="a@test.com")
    user2, _ = User.objects.get_or_create(username="testuser_b", email="b@test.com")
    
    UserProfile.objects.get_or_create(user=user1, defaults={"coin_balance": 100})
    UserProfile.objects.get_or_create(user=user2, defaults={"coin_balance": 100})
    
    category, _ = Category.objects.get_or_create(name="Electronics")
    
    item1, _ = BarterItem.objects.get_or_create(
        title="User 1 Item", 
        owner=user1, 
        category=category, 
        status='active'
    )
    
    item2, _ = BarterItem.objects.get_or_create(
        title="User 2 Item", 
        owner=user2, 
        category=category, 
        status='active'
    )
    
    factory = APIRequestFactory()
    
    # Clear previous interactions
    UserItemInteraction.objects.all().delete()
    SavedItem.objects.all().delete()
    BarterInterest.objects.all().delete()
    Trade.objects.all().delete()
    
    # 1. Test 'view' interaction
    print("1. Testing 'view' interaction logging...")
    request = factory.post(f'/api/items/{item1.id}/log_view/')
    force_authenticate(request, user=user2)
    view = BarterItemViewSet.as_view({'post': 'log_view'})
    response = view(request, pk=item1.id)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    assert UserItemInteraction.objects.filter(user=user2, item=item1, interaction_type='view').exists(), "View interaction not logged"
    print("   [OK] View interaction logged successfully.")
    
    # 2. Test 'save' interaction
    print("2. Testing 'save' interaction logging...")
    request = factory.post('/api/saved_items/toggle/', {'item_id': item1.id}, format='json')
    force_authenticate(request, user=user2)
    view = SavedItemViewSet.as_view({'post': 'toggle'})
    response = view(request)
    assert response.status_code == 200
    
    assert UserItemInteraction.objects.filter(user=user2, item=item1, interaction_type='save').exists(), "Save interaction not logged"
    print("   [OK] Save interaction logged successfully.")
    
    # 3. Test 'offer_sent' interaction
    print("3. Testing 'offer_sent' interaction logging...")
    request = factory.post('/api/barter_interests/', {
        'requested_item': item1.id,
        'offered_item': item2.id,
        'proposal_message': 'Trade?',
        'coins_offered': 0
    }, format='json')
    force_authenticate(request, user=user2)
    view = BarterInterestViewSet.as_view({'post': 'create'})
    response = view(request)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
    
    assert UserItemInteraction.objects.filter(user=user2, item=item1, interaction_type='offer_sent').exists(), "Offer sent interaction not logged"
    print("   [OK] Offer sent interaction logged successfully.")
    
    # 4. Test 'traded' interaction
    print("4. Testing 'traded' interaction logging...")
    # Retrieve the interest and ensure trade exists
    interest = BarterInterest.objects.get(id=response.data['id'])
    
    # Manually transition to accepted so the trade is created
    interest.status = 'accepted'
    interest.save()
    trade = interest._ensure_trade_exists()
    
    # Set handshake PIN manually to test delivery validation
    trade.handshake_pin = "1234"
    trade.save()
    
    request = factory.post(f'/api/trades/{trade.id}/update_logistics/', {
        'logistics_status': 'delivered',
        'handshake_pin': '1234'
    }, format='json')
    force_authenticate(request, user=user1)
    view = TradeViewSet.as_view({'post': 'update_logistics'})
    
    response = view(request, pk=trade.id)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"
    
    assert UserItemInteraction.objects.filter(user=trade.requester, item=trade.requested_listing, interaction_type='traded').exists(), "Traded interaction for requester not logged"
    assert UserItemInteraction.objects.filter(user=trade.receiver, item=trade.offered_listing, interaction_type='traded').exists(), "Traded interaction for receiver not logged"
    print("   [OK] Traded interaction logged successfully.")
    
    print("\n--- All Recommendation Logging Tests Passed! ---")

if __name__ == "__main__":
    run_tests()
