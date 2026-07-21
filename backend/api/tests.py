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
