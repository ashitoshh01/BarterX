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

