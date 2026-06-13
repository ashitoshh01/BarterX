# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User

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

    # Trust Score System (Step 7)
    # New users start at 50, range 0-100
    trust_score = models.IntegerField(default=50)

    # Reward Points System (Step 8)
    reward_points = models.IntegerField(default=0)

    def adjust_trust(self, delta):
        """Safely adjust trust score within 0-100 bounds."""
        self.trust_score = max(0, min(100, self.trust_score + delta))
        self.save(update_fields=['trust_score'])

    def add_points(self, amount):
        """Add reward points (never subtract below 0)."""
        self.reward_points = max(0, self.reward_points + amount)
        self.save(update_fields=['reward_points'])

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
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_interests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_interests')
    requested_item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='interest_requests')
    offered_item = models.ForeignKey(BarterItem, on_delete=models.CASCADE, related_name='interest_offers', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
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


# 7. Chat Room Model (Step 4 — room-based chat)
class ChatRoom(models.Model):
    barter_interest = models.OneToOneField(BarterInterest, on_delete=models.CASCADE, related_name='chat_room')
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms_as_user2')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ChatRoom: {self.user1.username} & {self.user2.username}"

    def is_participant(self, user):
        return user == self.user1 or user == self.user2


# 8. Chat Message Model (Refactored for room-based architecture)
class ChatMessage(models.Model):
    # New room-based FK (required for new flow)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    # Legacy fields kept for backward compatibility with old chat messages
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    offer = models.ForeignKey(BarterOffer, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    message = models.TextField(blank=True, default='')
    media = models.ImageField(upload_to='chat_media/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.username} at {self.created_at}"


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
