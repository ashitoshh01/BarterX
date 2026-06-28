import re
# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User

from .models import (
    UserProfile, Category, BarterItem, BarterItemImage, BarterOffer, ChatMessage,
    UserReview, TradeTransaction, OTPVerification,
    BarterInterest, Notification, ChatRoom, DealConfirmation
)


# ============================================================
# EXISTING SERIALIZERS (preserved)
# ============================================================

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    member_since = serializers.SerializerMethodField()
    trust_level = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = ('bio', 'location', 'phone_number', 'profile_picture_url', 'is_verified', 'average_rating',
                  'account_type', 'display_name', 'business_category', 'username', 'email', 'member_since',
                  'trust_score', 'trust_level', 'reward_points', 'coin_balance')
        read_only_fields = ('is_verified', 'average_rating', 'account_type', 'trust_score', 'reward_points', 'coin_balance')

    def get_member_since(self, obj):
        return obj.user.date_joined.strftime('%B %Y') if obj.user.date_joined else ""

    def update(self, instance, validated_data):
        # Guarantee account_type remains immutable after registration
        validated_data.pop('account_type', None)
        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(read_only=True)
    
    # Extra write-only fields for registration
    account_type = serializers.CharField(write_only=True, required=False, default='individual')
    display_name = serializers.CharField(write_only=True, required=True)
    business_category = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    otp = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'profile', 
                  'account_type', 'display_name', 'business_category', 'otp')
        extra_kwargs = {
            'username': {'required': False}
        }

    def validate(self, attrs):
        account_type = attrs.get('account_type', 'individual')
        email = attrs.get('email', '').strip()
        password = attrs.get('password')
        otp = attrs.get('otp', '').strip()
        
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            raise serializers.ValidationError({"email": "Please enter a valid email address."})

        # Validate Password complexity
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least 1 uppercase letter."})
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least 1 lowercase letter."})
        if not re.search(r'\d', password):
            raise serializers.ValidationError({"password": "Password must contain at least 1 numeric digit."})

        # Validate OTP
        if not otp:
            raise serializers.ValidationError({"otp": "Verification code is required."})

        from django.contrib.auth.hashers import check_password
        try:
            # Get latest OTP verification record
            otp_record = OTPVerification.objects.filter(email=email).latest('created_at')
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError({"otp": "No verification code requested for this email."})

        if otp_record.is_expired():
            raise serializers.ValidationError({"otp": "Verification code has expired. Please request a new one."})

        if otp_record.attempts >= 3:
            raise serializers.ValidationError({"otp": "Maximum verification attempts exceeded. Please request a new code."})

        # Verify the password hash
        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save()
            
            remaining = 3 - otp_record.attempts
            if remaining <= 0:
                raise serializers.ValidationError({"otp": "Maximum verification attempts exceeded. Please request a new code."})
            else:
                raise serializers.ValidationError({"otp": f"Invalid verification code. {remaining} attempts remaining."})

        # Check existing user email conflict
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})

        # Check existing username conflict (for individuals)
        if account_type == 'individual':
            display_name = attrs.get('display_name', '')
            if not display_name:
                raise serializers.ValidationError({"display_name": "Full name is required."})
                
            username = attrs.get('username')
            if not username:
                raise serializers.ValidationError({"username": "Username is required."})
                
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({"username": "This username is already taken."})
        else:
            display_name = attrs.get('display_name', '')
            if not display_name:
                raise serializers.ValidationError({"display_name": "Business name is required."})
                
            business_category = attrs.get('business_category', '')
            if not business_category:
                raise serializers.ValidationError({"business_category": "Business category is required."})
                
            # Automatically generate a unique username from business name (display_name)
            base_username = re.sub(r'-+', '-', re.sub(r'[^a-zA-Z0-9]', '-', display_name).lower()).strip('-')
            if not base_username:
                base_username = "business"
            
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}-{counter}"
                counter += 1
            
            attrs['username'] = username
            
        return attrs

    def create(self, validated_data):
        account_type = validated_data.pop('account_type', 'individual')
        display_name = validated_data.pop('display_name', '')
        business_category = validated_data.pop('business_category', None)
        email = validated_data.get('email')
        
        # Pop write-only otp field so User.objects.create_user doesn't receive it
        validated_data.pop('otp', None)
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=email,
            password=validated_data['password']
        )
        
        # Explicitly create corresponding profile with the extra fields
        UserProfile.objects.create(
            user=user,
            account_type=account_type,
            display_name=display_name,
            business_category=business_category
        )
        
        # Clean up OTP records after successful registration
        OTPVerification.objects.filter(email=email).delete()
        
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BarterItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarterItemImage
        fields = ('id', 'image')

class BarterItemSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    category_name = serializers.ReadOnlyField(source='category.name')
    additional_images = BarterItemImageSerializer(many=True, read_only=True)

    class Meta:
        model = BarterItem
        fields = '__all__'
        read_only_fields = ('owner', 'item_score')

class BarterOfferSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    receiver_username = serializers.ReadOnlyField(source='receiver.username')
    offered_item_title = serializers.ReadOnlyField(source='offered_item.title')
    requested_item_title = serializers.ReadOnlyField(source='requested_item.title')

    class Meta:
        model = BarterOffer
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    # For backward compat, keep receiver_username
    receiver_username = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = '__all__'

    def get_receiver_username(self, obj):
        if obj.receiver:
            return obj.receiver.username
        return None

    def get_media_url(self, obj):
        if obj.media:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.media.url)
            return obj.media.url
        return None

class UserReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.ReadOnlyField(source='reviewer.username')
    reviewed_user_username = serializers.ReadOnlyField(source='reviewed_user.username')

    class Meta:
        model = UserReview
        fields = '__all__'

class TradeTransactionSerializer(serializers.ModelSerializer):
    user_1_username = serializers.ReadOnlyField(source='user_1.username')
    user_2_username = serializers.ReadOnlyField(source='user_2.username')
    item_1_title = serializers.ReadOnlyField(source='item_1.title')
    item_2_title = serializers.ReadOnlyField(source='item_2.title')

    class Meta:
        model = TradeTransaction
        fields = '__all__'


# ============================================================
# NEW SERIALIZERS FOR BARTER INTEREST → CHAT → DEAL FLOW
# ============================================================

class BarterItemCompactSerializer(serializers.ModelSerializer):
    """Compact item serializer for embedding in interest/chat views."""
    owner_username = serializers.ReadOnlyField(source='owner.username')
    category_name = serializers.ReadOnlyField(source='category.name')
    owner_display_name = serializers.SerializerMethodField()
    owner_trust_score = serializers.SerializerMethodField()
    owner_trust_level = serializers.SerializerMethodField()

    class Meta:
        model = BarterItem
        fields = ('id', 'title', 'description', 'offering', 'wanting', 'category_name',
                  'image_url', 'image', 'condition', 'location', 'status',
                  'owner', 'owner_username', 'owner_display_name',
                  'owner_trust_score', 'owner_trust_level', 'created_at')

    def get_owner_display_name(self, obj):
        try:
            return obj.owner.profile.display_name or obj.owner.username
        except UserProfile.DoesNotExist:
            return obj.owner.username

    def get_owner_trust_score(self, obj):
        try:
            return obj.owner.profile.trust_score
        except UserProfile.DoesNotExist:
            return 50

    def get_owner_trust_level(self, obj):
        try:
            return obj.owner.profile.trust_level
        except UserProfile.DoesNotExist:
            return 'medium'


class BarterInterestSerializer(serializers.ModelSerializer):
    offered_item = serializers.PrimaryKeyRelatedField(
        queryset=BarterItem.objects.all(),
        required=False,
        allow_null=True
    )
    requester_username = serializers.ReadOnlyField(source='requester.username')
    receiver_username = serializers.ReadOnlyField(source='receiver.username')
    requested_item_detail = BarterItemCompactSerializer(source='requested_item', read_only=True)
    offered_item_detail = BarterItemCompactSerializer(source='offered_item', read_only=True)
    requester_display_name = serializers.SerializerMethodField()
    receiver_display_name = serializers.SerializerMethodField()
    chat_room_id = serializers.SerializerMethodField()

    class Meta:
        model = BarterInterest
        fields = ('id', 'requester', 'receiver', 'requester_username', 'receiver_username',
                  'requester_display_name', 'receiver_display_name',
                  'requested_item', 'offered_item',
                  'requested_item_detail', 'offered_item_detail',
                  'status', 'chat_room_id', 'created_at', 'updated_at')
        read_only_fields = ('requester', 'receiver', 'status')

    def get_requester_display_name(self, obj):
        try:
            return obj.requester.profile.display_name or obj.requester.username
        except UserProfile.DoesNotExist:
            return obj.requester.username

    def get_receiver_display_name(self, obj):
        try:
            return obj.receiver.profile.display_name or obj.receiver.username
        except UserProfile.DoesNotExist:
            return obj.receiver.username

    def get_chat_room_id(self, obj):
        try:
            return obj.chat_room.id
        except ChatRoom.DoesNotExist:
            return None


class NotificationSerializer(serializers.ModelSerializer):
    barter_interest_id = serializers.ReadOnlyField(source='barter_interest.id')

    class Meta:
        model = Notification
        fields = ('id', 'user', 'notification_type', 'title', 'message',
                  'barter_interest_id', 'is_read', 'created_at')
        read_only_fields = ('user', 'notification_type', 'title', 'message', 'barter_interest_id')


class ChatRoomSerializer(serializers.ModelSerializer):
    barter_interest_detail = BarterInterestSerializer(source='barter_interest', read_only=True)
    user1_username = serializers.ReadOnlyField(source='user1.username')
    user2_username = serializers.ReadOnlyField(source='user2.username')
    user1_display_name = serializers.SerializerMethodField()
    user2_display_name = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ('id', 'barter_interest', 'barter_interest_detail',
                  'user1', 'user1_username', 'user1_display_name',
                  'user2', 'user2_username', 'user2_display_name',
                  'last_message', 'unread_count', 'created_at')

    def get_user1_display_name(self, obj):
        try:
            return obj.user1.profile.display_name or obj.user1.username
        except UserProfile.DoesNotExist:
            return obj.user1.username

    def get_user2_display_name(self, obj):
        try:
            return obj.user2.profile.display_name or obj.user2.username
        except UserProfile.DoesNotExist:
            return obj.user2.username

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'message': last_msg.message[:80] if last_msg.message else '📷 Image',
                'sender_username': last_msg.sender.username,
                'created_at': last_msg.created_at.isoformat(),
                'is_read': last_msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class RoomChatMessageSerializer(serializers.ModelSerializer):
    """Serializer specifically for room-based chat messages."""
    sender_username = serializers.ReadOnlyField(source='sender.username')
    sender_display_name = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ('id', 'room', 'sender', 'sender_username', 'sender_display_name',
                  'message', 'media', 'media_url', 'is_read', 'created_at')
        read_only_fields = ('sender',)

    def get_sender_display_name(self, obj):
        try:
            return obj.sender.profile.display_name or obj.sender.username
        except UserProfile.DoesNotExist:
            return obj.sender.username

    def get_media_url(self, obj):
        if obj.media:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.media.url)
            return obj.media.url
        return None


class DealConfirmationSerializer(serializers.ModelSerializer):
    barter_interest_status = serializers.ReadOnlyField(source='barter_interest.status')

    class Meta:
        model = DealConfirmation
        fields = ('id', 'barter_interest', 'barter_interest_status',
                  'user1_confirmed', 'user2_confirmed',
                  'user1_request_count', 'user2_request_count',
                  'user1_cooldown_until', 'user2_cooldown_until',
                  'is_completed', 'completed_at', 'created_at')
        read_only_fields = '__all__'
