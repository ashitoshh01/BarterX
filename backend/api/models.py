# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone

# 1. User Profile Model
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=150, default="Remote")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture_url = models.URLField(max_length=500, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    average_rating = models.FloatField(default=0.0)
    
    account_type = models.CharField(
        max_length=20,
        choices=[
            ('individual', 'Individual'),
            ('business', 'Business')
        ],
        default='individual'
    )
    display_name = models.CharField(max_length=255, default="")
    business_category = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    cover_picture_url = models.URLField(max_length=500, blank=True, null=True)
    college_organization = models.CharField(max_length=255, blank=True, null=True)
    department_branch = models.CharField(max_length=255, blank=True, null=True)
    year_of_study = models.CharField(max_length=50, blank=True, null=True)
    github_profile = models.URLField(max_length=500, blank=True, null=True)
    linkedin_profile = models.URLField(max_length=500, blank=True, null=True)
    portfolio_website = models.URLField(max_length=500, blank=True, null=True)
    resume_url = models.URLField(max_length=500, blank=True, null=True)
    proof_of_work = models.JSONField(default=list, blank=True)

    # Trust Score System (Step 7)
    # New users start at 50, range 0-100
    trust_score = models.IntegerField(default=50)

    # Reward Points System (Step 8)
    reward_points = models.IntegerField(default=0)
    
    # BarterX Coin System
    coin_balance = models.IntegerField(default=10)

    # Real-Time Chat Presence fields
    online_status = models.CharField(
        max_length=20,
        choices=[
            ('online', 'Online'),
            ('away', 'Away'),
            ('offline', 'Offline')
        ],
        default='offline'
    )
    last_seen = models.DateTimeField(null=True, blank=True)

    def adjust_trust(self, delta):
        """Safely adjust trust score within 0-100 bounds."""
        self.trust_score = max(0, min(100, self.trust_score + delta))
        self.save(update_fields=['trust_score'])

    def add_points(self, amount):
        """Add reward points (never subtract below 0)."""
        self.reward_points = max(0, self.reward_points + amount)
        self.save(update_fields=['reward_points'])
        
    def add_coins(self, amount):
        """Add coins to the user's wallet."""
        self.coin_balance += amount
        self.save(update_fields=['coin_balance'])

    @property
    def trust_level(self):
        if self.trust_score >= 80:
            return 'high'
        elif self.trust_score >= 50:
            return 'medium'
        return 'low'

    def __str__(self):
        return f"{self.user.username}'s Profile"

# 2. Category Model
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_service = models.BooleanField(default=False)  # True = Service category, False = Product category

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        category_type = "Service" if self.is_service else "Product"
        return f"{self.name} ({category_type})"

# 3. Barter Item Model (Refactored)
class BarterItem(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('draft', 'Draft'),
        ('archived', 'Archived'),
        ('traded', 'Traded'),
        ('reserved', 'Reserved'),
    ]

    CONDITION_CHOICES = [
        ('brand_new', 'Brand New'),
        ('like_new', 'Like New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
        ('not_applicable', 'Not Applicable (Service)'),
    ]

    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    offering = models.CharField(max_length=200)
    wanting = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='items')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to='item_images/', blank=True, null=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='not_applicable')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    location = models.CharField(max_length=150, default="Remote")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # New listing calculator & detail fields
    age_months = models.IntegerField(default=0)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    item_score = models.FloatField(default=5.0)

    # Boost system & views analytics
    is_boosted = models.BooleanField(default=False)
    boosted_at = models.DateTimeField(null=True, blank=True)
    boost_expires_at = models.DateTimeField(null=True, blank=True)
    views_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (Owner: {self.owner.username})"

class BarterItemImage(models.Model):
    item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='additional_images')
    image = models.ImageField(upload_to='item_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.item.title}"

# Listing History model
class ListingHistory(models.Model):
    listing = models.ForeignKey(BarterItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='history_logs')
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listing_actions')
    action = models.CharField(max_length=50) # CREATED, UPDATED, BOOSTED, ARCHIVED, RESTORED, COMPLETED, RESERVED, etc.
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        listing_title = self.listing.title if self.listing else "Deleted Listing"
        return f"{self.action} on {listing_title} by {self.performed_by.username}"

# 4. Barter Offer Model (Legacy — kept for backward compatibility)
class BarterOffer(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('countered', 'Countered'),
        ('cancelled', 'Cancelled'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_offers')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_offers')
    offered_item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='as_offered_trade')
    requested_item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='as_requested_trade')
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Offer from {self.sender.username} to {self.receiver.username} ({self.status})"


# ============================================================
# NEW MODELS FOR BARTER INTEREST → CHAT → DEAL FLOW
# ============================================================

# 5. Barter Interest Model (Step 1 — the new proposal system)
class BarterInterest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('negotiating', 'Negotiating'),
        ('countered', 'Countered'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('cancelled', 'Cancelled'),
    ]

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_interests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_interests')
    requested_item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='interest_requests')
    offered_item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='interest_offers', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    proposal_message = models.TextField(blank=True, default='')
    coins_offered = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['requester', 'status']),
            models.Index(fields=['receiver', 'status']),
        ]

    def __str__(self):
        offered_title = self.offered_item.title if self.offered_item else "Nothing (Show Interest)"
        return f"Interest: {self.requester.username} offers {offered_title} for {self.requested_item.title}"

    def get_allowed_transitions(self):
        transitions = {
            'pending': {'negotiating', 'accepted', 'declined', 'cancelled'},
            'negotiating': {'countered', 'accepted', 'declined', 'cancelled'},
            'countered': {'accepted', 'declined', 'cancelled'},
            'accepted': {'cancelled'},
            'declined': set(),
            'cancelled': set(),
        }
        return transitions.get(self.status, set())

    def transition_to(self, new_status):
        if new_status not in self.get_allowed_transitions():
            raise ValidationError(f"Invalid transition from '{self.status}' to '{new_status}'.")

        previous_status = self.status
        self.status = new_status
        self.updated_at = timezone.now()
        self.save(update_fields=['status', 'updated_at'])

        if previous_status == 'accepted' and new_status in {'cancelled', 'declined'}:
            self._unlock_listings()
        elif new_status == 'accepted' and previous_status != 'accepted':
            self._reserve_listings()
            self._ensure_trade_exists()

        return self

    def _reserve_listings(self):
        self.requested_item.status = 'reserved'
        self.requested_item.save(update_fields=['status'])
        if self.offered_item:
            self.offered_item.status = 'reserved'
            self.offered_item.save(update_fields=['status'])

    def _unlock_listings(self):
        self.requested_item.status = 'active'
        self.requested_item.save(update_fields=['status'])
        if self.offered_item:
            self.offered_item.status = 'active'
            self.offered_item.save(update_fields=['status'])

    def _ensure_trade_exists(self):
        if hasattr(self, 'trade'):
            return self.trade
        return Trade.objects.create(
            proposal=self,
            requested_listing=self.requested_item,
            offered_listing=self.offered_item,
            requester=self.requester,
            receiver=self.receiver,
            status='pending',
        )


class Trade(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    proposal = models.OneToOneField(BarterInterest, on_delete=models.CASCADE, related_name='trade')
    requested_listing = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='trades_as_requested')
    offered_listing = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='trades_as_offered', null=True, blank=True)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trades_as_requester')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trades_as_receiver')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Trade for proposal #{self.proposal_id}"


# 6. Notification Model (Step 2)
class Notification(models.Model):
    TYPE_CHOICES = [
        ('interest_received', 'Interest Received'),
        ('interest_accepted', 'Interest Accepted'),
        ('interest_rejected', 'Interest Rejected'),
        ('deal_requested', 'Deal Confirmation Requested'),
        ('deal_completed', 'Deal Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    barter_interest = models.ForeignKey(BarterInterest, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"


# ChatRoom and ChatMessage are replaced by Conversation and Message in the chat app.

# 9. Deal Confirmation Model (Step 5 — dual-confirm system)
class DealConfirmation(models.Model):
    barter_interest = models.OneToOneField(BarterInterest, on_delete=models.CASCADE, related_name='deal_confirmation')
    user1_confirmed = models.BooleanField(default=False)
    user2_confirmed = models.BooleanField(default=False)
    # Rate limiting fields (Step 6) — independent per user
    user1_request_count = models.IntegerField(default=0)
    user2_request_count = models.IntegerField(default=0)
    user1_cooldown_until = models.DateTimeField(null=True, blank=True)
    user2_cooldown_until = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_completed(self):
        return self.user1_confirmed and self.user2_confirmed

    def __str__(self):
        return f"DealConfirmation for Interest #{self.barter_interest.id}"


# 10. User Review Model (unchanged)
class UserReview(models.Model):
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    offer = models.ForeignKey(BarterOffer, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField()  # 1 to 5 scale
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.reviewer.username} for {self.reviewed_user.username} ({self.rating} stars)"

class OTPVerification(models.Model):
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now=True)
    attempts = models.IntegerField(default=0)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=5)

    def __str__(self):
        return f"OTP for {self.email} (Attempts: {self.attempts})"


class CoinTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('earned', 'Earned'),
        ('spent', 'Spent'),
        ('purchased', 'Purchased'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_transactions')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type.capitalize()} {self.amount} coins for {self.user.username}"


class TradeTransaction(models.Model):
    offer = models.OneToOneField(
        BarterOffer,
        on_delete=models.CASCADE,
        related_name='transaction'
    )
    item_1 = models.ForeignKey(
        BarterItem,
        on_delete=models.SET_NULL,
        null=True,
        related_name='trade_as_item_1'
    )
    item_2 = models.ForeignKey(
        BarterItem,
        on_delete=models.SET_NULL,
        null=True,
        related_name='trade_as_item_2'
    )
    user_1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trades_as_user_1'
    )
    user_2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trades_as_user_2'
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trade Transaction: {self.user_1.username} & {self.user_2.username} at {self.completed_at}"
