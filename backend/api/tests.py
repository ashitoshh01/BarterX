from django.test import TestCase
from django.contrib.auth.models import User
from api.models import UserProfile, Category, BarterItem, BarterInterest, ChatRoom, DealConfirmation, CoinTransaction
import random

class BusinessCycleTests(TestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username='user1', password='password')
        self.user2 = User.objects.create_user(username='user2', password='password')
        self.profile1 = UserProfile.objects.create(user=self.user1, display_name='User 1')
        self.profile2 = UserProfile.objects.create(user=self.user2, display_name='User 2')
        
        # Create category and items
        self.cat = Category.objects.create(name='Electronics')
        self.item1 = BarterItem.objects.create(title='Item 1', owner=self.user1, category=self.cat, status='active')
        self.item2 = BarterItem.objects.create(title='Item 2', owner=self.user2, category=self.cat, status='active')

    def test_happy_path_barter(self):
        # Cycle A: Interest -> Accepted -> Chat -> Deal -> Completion
        interest = BarterInterest.objects.create(requester=self.user2, receiver=self.user1, requested_item=self.item1, offered_item=self.item2, status='pending')
        
        # 1. Accept
        interest.status = 'accepted'
        interest.save()
        
        # 2. Chat (system behavior check)
        room = ChatRoom.objects.create(barter_interest=interest, user1=self.user2, user2=self.user1)
        self.assertIsNotNone(room)
        
        # 3. Confirm Deal
        deal = DealConfirmation.objects.create(barter_interest=interest)
        deal.user1_confirmed = True
        deal.user2_confirmed = True
        deal.save()
        
        self.assertTrue(deal.is_completed)
        
        # 4. Final status
        interest.status = 'completed'
        interest.save()
        self.assertEqual(interest.status, 'completed')

    def test_coin_transaction(self):
        # Cycle B: Coin Earned
        initial_balance = self.profile1.coin_balance
        CoinTransaction.objects.create(user=self.user1, amount=50, transaction_type='earned', description='Trade bonus')
        self.profile1.add_coins(50)
        self.assertEqual(self.profile1.coin_balance, initial_balance + 50)
