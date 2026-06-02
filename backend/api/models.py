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
    ]

    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    offering = models.CharField(max_length=200)
    wanting = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='items')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    location = models.CharField(max_length=150, default="Remote")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (Owner: {self.owner.username})"

# 4. Barter Offer Model
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

# 5. Chat Message Model
class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    offer = models.ForeignKey(BarterOffer, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg from {self.sender.username} to {self.receiver.username} at {self.created_at}"

# 6. User Review Model
class UserReview(models.Model):
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    offer = models.ForeignKey(BarterOffer, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField()  # 1 to 5 scale
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.reviewer.username} for {self.reviewed_user.username} ({self.rating} stars)"

# 7. OTP Verification Model
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
