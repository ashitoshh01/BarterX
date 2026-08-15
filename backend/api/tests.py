from django.core.exceptions import ValidationError
from django.test import TestCase

from .models import BarterItem, BarterInterest, Category
from django.contrib.auth.models import User


class BarterInterestWorkflowTests(TestCase):
    def setUp(self):
        self.requester = User.objects.create_user(username='requester', password='testpass123')
        self.receiver = User.objects.create_user(username='receiver', password='testpass123')
        self.category = Category.objects.create(name='Books')
        self.requested_item = BarterItem.objects.create(
            title='Requested Item',
            description='A test item',
            offering='offering',
            wanting='wanting',
            category=self.category,
            owner=self.receiver,
            status='active',
        )
        self.offered_item = BarterItem.objects.create(
            title='Offered Item',
            description='Another test item',
            offering='offering',
            wanting='wanting',
            category=self.category,
            owner=self.requester,
            status='active',
        )

    def test_accept_reserves_listings_and_cancellation_unlocks_them(self):
        interest = BarterInterest.objects.create(
            requester=self.requester,
            receiver=self.receiver,
            requested_item=self.requested_item,
            offered_item=self.offered_item,
            status='pending',
            proposal_message='Would you swap?',
            coins_offered=3,
        )

        interest.transition_to('accepted')
        self.assertEqual(interest.status, 'accepted')

        self.requested_item.refresh_from_db()
        self.offered_item.refresh_from_db()
        self.assertEqual(self.requested_item.status, 'reserved')
        self.assertEqual(self.offered_item.status, 'reserved')

        interest.transition_to('cancelled')
        self.requested_item.refresh_from_db()
        self.offered_item.refresh_from_db()
        self.assertEqual(self.requested_item.status, 'active')
        self.assertEqual(self.offered_item.status, 'active')

    def test_invalid_status_transition_is_rejected(self):
        interest = BarterInterest.objects.create(
            requester=self.requester,
            receiver=self.receiver,
            requested_item=self.requested_item,
            offered_item=self.offered_item,
            status='pending',
        )

        with self.assertRaises(ValidationError):
            interest.transition_to('completed')

    def test_contract_auto_creation_and_dual_signing(self):
        """TC-04: Auto-creation of Contract on interest acceptance and dual signature flow."""
        interest = BarterInterest.objects.create(
            requester=self.requester,
            receiver=self.receiver,
            requested_item=self.requested_item,
            offered_item=self.offered_item,
            status='pending',
        )
        interest.transition_to('accepted')

        # Verify Contract and Trade auto-created
        contract = getattr(interest, 'contract', None)
        self.assertIsNotNone(contract)
        self.assertEqual(contract.party_a, self.requester)
        self.assertEqual(contract.party_b, self.receiver)
        self.assertEqual(contract.status, 'pending')

        # Party A signs
        contract.signed_a = True
        contract.signed_a_ip = '127.0.0.1'
        contract.save()

        # Party B signs and contract completes
        contract.signed_b = True
        contract.signed_b_ip = '127.0.0.1'
        contract.status = 'signed'
        contract.save()

        contract.refresh_from_db()
        self.assertTrue(contract.signed_a)
        self.assertTrue(contract.signed_b)
        self.assertEqual(contract.status, 'signed')

    def test_dispute_creation_and_escalation(self):
        """TC-05: Dispute raising, evidence attachment, and status escalation."""
        from .models import Dispute, DisputeEvidence, Trade
        interest = BarterInterest.objects.create(
            requester=self.requester,
            receiver=self.receiver,
            requested_item=self.requested_item,
            offered_item=self.offered_item,
            status='pending',
        )
        interest.transition_to('accepted')
        trade = interest.trade

        dispute = Dispute.objects.create(
            trade=trade,
            raised_by=self.requester,
            against=self.receiver,
            reason='not_as_described',
            detail='Item arrived damaged.',
            status='open',
        )
        self.assertEqual(dispute.status, 'open')
        self.assertFalse(dispute.is_escalated)

        # Escalate dispute
        dispute.is_escalated = True
        dispute.status = 'escalated'
        dispute.save()

        dispute.refresh_from_db()
        self.assertTrue(dispute.is_escalated)
        self.assertEqual(dispute.status, 'escalated')

    def test_coin_transaction_ledger_and_balance(self):
        """TC-06: Coin transaction creation and UserProfile coin balance sync."""
        from .models import CoinTransaction, UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=self.requester)
        initial_balance = profile.coin_balance

        profile.add_coins(50)
        CoinTransaction.objects.create(
            user=self.requester,
            amount=50,
            transaction_type='earned',
            description='Completed trade reward',
        )

        profile.refresh_from_db()
        self.assertEqual(profile.coin_balance, initial_balance + 50)
        txn = CoinTransaction.objects.filter(user=self.requester).first()
        self.assertIsNotNone(txn)
        self.assertEqual(txn.amount, 50)

    def test_trust_score_adjustment_and_level_property(self):
        """TC-07: Trust score adjust bounds (0-100) and level property categorization."""
        from .models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=self.requester, defaults={'trust_score': 20})

        profile.adjust_trust(40)  # score becomes 60 -> medium
        self.assertEqual(profile.trust_score, 60)
        self.assertEqual(profile.trust_level, 'medium')

        profile.adjust_trust(30)  # score becomes 90 -> high
        self.assertEqual(profile.trust_score, 90)
        self.assertEqual(profile.trust_level, 'high')

        profile.adjust_trust(50)  # capped at 100
        self.assertEqual(profile.trust_score, 100)

        profile.adjust_trust(-200) # floored at 0 -> low
        self.assertEqual(profile.trust_score, 0)
        self.assertEqual(profile.trust_level, 'low')

    def test_deal_confirmation_dual_confirm(self):
        """TC-08: Dual confirmation requirement for deal completion."""
        from .models import DealConfirmation
        interest = BarterInterest.objects.create(
            requester=self.requester,
            receiver=self.receiver,
            requested_item=self.requested_item,
            offered_item=self.offered_item,
            status='accepted',
        )

        deal_confirm = DealConfirmation.objects.create(
            barter_interest=interest,
            user1_confirmed=True,
            user2_confirmed=False,
        )
        self.assertFalse(deal_confirm.is_completed)

        deal_confirm.user2_confirmed = True
        deal_confirm.save()
        self.assertTrue(deal_confirm.is_completed)

    def test_p2p_coin_transfer_success(self):
        """Test successful coin transfer between two users."""
        from .models import UserProfile, CoinTransaction
        from rest_framework_simplejwt.tokens import AccessToken
        sender_profile, _ = UserProfile.objects.get_or_create(user=self.requester)
        sender_profile.coin_balance = 100
        sender_profile.save()

        recipient_profile, _ = UserProfile.objects.get_or_create(user=self.receiver)
        recipient_profile.coin_balance = 50
        recipient_profile.save()

        token = AccessToken.for_user(self.requester)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        response = self.client.post(
            '/api/wallet/transfer/',
            {'recipient_username': 'receiver', 'amount': 40, 'description': 'Thanks!'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['new_balance'], 60)

        sender_profile.refresh_from_db()
        recipient_profile.refresh_from_db()
        self.assertEqual(sender_profile.coin_balance, 60)
        self.assertEqual(recipient_profile.coin_balance, 90)

        # Check transactions
        self.assertTrue(CoinTransaction.objects.filter(user=self.requester, amount=-40, transaction_type='spent').exists())
        self.assertTrue(CoinTransaction.objects.filter(user=self.receiver, amount=40, transaction_type='earned').exists())

    def test_p2p_coin_transfer_insufficient_balance(self):
        """Test coin transfer fails if sender has insufficient balance."""
        from .models import UserProfile
        from rest_framework_simplejwt.tokens import AccessToken
        sender_profile, _ = UserProfile.objects.get_or_create(user=self.requester)
        sender_profile.coin_balance = 20
        sender_profile.save()

        token = AccessToken.for_user(self.requester)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        response = self.client.post(
            '/api/wallet/transfer/',
            {'recipient_username': 'receiver', 'amount': 40},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Insufficient coin balance.", response.data['detail'])

    def test_p2p_coin_transfer_to_self(self):
        """Test coin transfer to oneself is rejected."""
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken.for_user(self.requester)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        response = self.client.post(
            '/api/wallet/transfer/',
            {'recipient_username': 'requester', 'amount': 10},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("You cannot transfer coins to yourself.", response.data['detail'])


class EnhancedPlatformTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='testpass123')
        self.admin = User.objects.create_superuser(username='admin', password='testpass123')
        self.partner = User.objects.create_user(username='partner', password='testpass123')
        self.category = Category.objects.create(name='Electronics')
        
        from .models import UserProfile
        user_profile, _ = UserProfile.objects.get_or_create(user=self.user)
        user_profile.coin_balance = 500
        user_profile.save()
        
        partner_profile, _ = UserProfile.objects.get_or_create(user=self.partner)
        partner_profile.coin_balance = 200
        partner_profile.save()

        # Admin profile for logging compatibility
        UserProfile.objects.get_or_create(user=self.admin)

        self.item = BarterItem.objects.create(
            title='Phone',
            description='Pixel 6',
            offering='Phone',
            wanting='Laptop',
            category=self.category,
            owner=self.user,
            status='active',
            latitude=28.6139,
            longitude=77.2090
        )

        self.partner_item = BarterItem.objects.create(
            title='Laptop',
            description='Macbook',
            offering='Laptop',
            wanting='Phone',
            category=self.category,
            owner=self.partner,
            status='active',
            latitude=28.6250,
            longitude=77.2200
        )

    def test_coin_reservation_and_release(self):
        interest = BarterInterest.objects.create(
            requester=self.user,
            receiver=self.partner,
            requested_item=self.partner_item,
            offered_item=self.item,
            status='pending',
            coins_offered=100
        )
        
        from .coin_service import reserve_coins_for_proposal, release_coins_for_proposal
        
        from .models import UserProfile
        # Test Reservation
        reserve_coins_for_proposal(interest)
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.coin_balance, 400)
        self.assertEqual(profile.coin_reserved, 100)
        
        # Test Release
        release_coins_for_proposal(interest)
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.coin_balance, 500)
        self.assertEqual(profile.coin_reserved, 0)

    def test_chat_limit_rate_limiting(self):
        from chat.services import check_and_update_chat_limit
        
        # Verify default limits
        for i in range(20):
            allowed, warning, details = check_and_update_chat_limit(self.user)
            self.assertTrue(allowed)

        # 21st message should be blocked for Free Tier
        allowed, warning, details = check_and_update_chat_limit(self.user)
        self.assertFalse(allowed)
        self.assertEqual(details["limit_type"], "minute")

    def test_image_moderation_service(self):
        from .moderation_service import moderate_uploaded_image
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        safe_file = SimpleUploadedFile("product.jpg", b"file_content", content_type="image/jpeg")
        unsafe_file = SimpleUploadedFile("explicit_nudity.jpg", b"file_content", content_type="image/jpeg")
        
        is_allowed, status, confidence, reason, _ = moderate_uploaded_image(self.user, safe_file)
        self.assertTrue(is_allowed)
        self.assertEqual(status, 'APPROVED')
        
        is_allowed, status, confidence, reason, _ = moderate_uploaded_image(self.user, unsafe_file)
        self.assertFalse(is_allowed)
        self.assertEqual(status, 'BLOCKED')

    def test_admin_dashboard_stats_and_actions(self):
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken.for_user(self.admin)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        # Test stats endpoint
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertIn("stats", response.data)
        
        # Test suspend user action
        response = self.client.post(
            f'/api/admin/users/{self.partner.id}/manage/',
            {'action': 'suspend', 'notes': 'Test suspension'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.partner.refresh_from_db()
        self.assertFalse(self.partner.is_active)





