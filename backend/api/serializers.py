import re
# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from django.contrib.auth.hashers import check_password
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.db.models import Q

from .models import (
    UserProfile, Category, BarterItem, BarterItemImage,
    UserReview, OTPVerification,
    BarterInterest, Notification, DealConfirmation, ListingHistory, CoinTransaction, Contract, Trade, Dispute, DisputeEvidence, SavedItem,
    WalletTransaction, ImageModerationResult, AdminActionLog
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
        fields = ('bio', 'city', 'state', 'country', 'profession', 'location', 'location_name', 'latitude', 'longitude',
                  'phone_number', 'profile_picture_url', 'is_verified', 'average_rating',
                  'account_type', 'display_name', 'business_category', 'username', 'email', 'member_since',
                  'trust_score', 'trust_level', 'reward_points', 'coin_balance',
                  'cover_picture_url', 'college_organization', 'department_branch', 'year_of_study',
                  'github_profile', 'linkedin_profile', 'portfolio_website', 'resume_url', 'proof_of_work')
        read_only_fields = ('is_verified', 'average_rating', 'account_type', 'trust_score', 'reward_points', 'coin_balance')

    def validate_latitude(self, value):
        if value is not None and (value < -90.0 or value > 90.0):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180.0 or value > 180.0):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

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

class ListingHistorySerializer(serializers.ModelSerializer):
    performed_by_username = serializers.ReadOnlyField(source='performed_by.username')

    class Meta:
        model = ListingHistory
        fields = ('id', 'action', 'metadata', 'created_at', 'performed_by_username')

class BarterItemListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer for feed — excludes history_logs and uses annotated counts."""
    owner = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    additional_images = BarterItemImageSerializer(many=True, read_only=True)

    class Meta:
        model = BarterItem
        fields = (
            'id', 'title', 'description', 'offering', 'wanting', 'category', 'category_name',
            'image_url', 'image', 'condition', 'owner', 'location', 'status',
            'age_months', 'purchase_price', 'item_score', 'is_boosted', 'boosted_at',
            'boost_expires_at', 'views_count', 'additional_images', 'created_at', 'updated_at'
        )
        read_only_fields = ('owner', 'item_score', 'is_boosted', 'boosted_at', 'boost_expires_at', 'views_count')

    def get_owner(self, obj):
        profile = getattr(obj.owner, 'profile', None)
        if profile:
            return {
                "id": obj.owner.id,
                "username": obj.owner.username,
                "display_name": profile.display_name or obj.owner.username,
                "avatar": profile.profile_picture_url or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
                "verified": profile.is_verified,
                "trust_score": profile.trust_score,
                "rating": profile.average_rating
            }
        return {
            "id": obj.owner.id,
            "username": obj.owner.username,
            "display_name": obj.owner.username,
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
            "verified": False,
            "trust_score": 50,
            "rating": 0.0
        }


class BarterItemSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    additional_images = BarterItemImageSerializer(many=True, read_only=True)
    proposal_count = serializers.SerializerMethodField()
    chat_count = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    distance_formatted = serializers.SerializerMethodField()

    class Meta:
        model = BarterItem
        fields = '__all__'
        read_only_fields = ('owner', 'item_score', 'is_boosted', 'boosted_at', 'boost_expires_at', 'views_count')

    def get_distance_km(self, obj):
        val = getattr(obj, 'distance_km', None)
        return float(val) if val is not None else None

    def get_distance_formatted(self, obj):
        return getattr(obj, 'distance_formatted', None)

    def validate_latitude(self, value):
        if value is not None and (value < -90.0 or value > 90.0):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180.0 or value > 180.0):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def get_owner(self, obj):
        profile = getattr(obj.owner, 'profile', None)
        if profile:
            return {
                "id": obj.owner.id,
                "username": obj.owner.username,
                "display_name": profile.display_name or obj.owner.username,
                "avatar": profile.profile_picture_url or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
                "verified": profile.is_verified,
                "trust_score": profile.trust_score,
                "rating": profile.average_rating
            }
        return {
            "id": obj.owner.id,
            "username": obj.owner.username,
            "display_name": obj.owner.username,
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
            "verified": False,
            "trust_score": 50,
            "rating": 0.0
        }

    def get_proposal_count(self, obj):
        if hasattr(obj, 'annotated_proposal_count'):
            return obj.annotated_proposal_count
        from .models import BarterInterest
        return BarterInterest.objects.filter(Q(requested_item=obj) | Q(offered_item=obj)).count()

    def get_chat_count(self, obj):
        if hasattr(obj, 'annotated_chat_count'):
            return obj.annotated_chat_count
        from chat.models import Conversation
        return Conversation.objects.filter(
            Q(listing=obj) | 
            Q(barter_interest__offered_item=obj)
        ).count()



# ChatMessageSerializer is replaced by MessageSerializer in the chat app.

class UserReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.ReadOnlyField(source='reviewer.username')
    reviewed_user_username = serializers.ReadOnlyField(source='reviewed_user.username')

    class Meta:
        model = UserReview
        fields = '__all__'
        read_only_fields = ('reviewer',)




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
    is_read_only = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    can_accept = serializers.SerializerMethodField()
    can_counter = serializers.SerializerMethodField()
    can_decline = serializers.SerializerMethodField()
    trade_id = serializers.SerializerMethodField()

    class Meta:
        model = BarterInterest
        fields = ('id', 'requester', 'receiver', 'requester_username', 'receiver_username',
                  'requester_display_name', 'receiver_display_name',
                  'requested_item', 'offered_item',
                  'requested_item_detail', 'offered_item_detail',
                  'proposal_message', 'coins_offered', 'metadata',
                  'status', 'chat_room_id', 'trade_id', 'is_read_only', 'can_cancel', 'can_accept', 'can_counter', 'can_decline',
                  'created_at', 'updated_at')
        read_only_fields = ('requester', 'receiver', 'status')

    def validate(self, attrs):
        offered_item = attrs.get('offered_item')
        coins_offered = attrs.get('coins_offered', 0) or 0
        if not offered_item and coins_offered <= 0:
            raise serializers.ValidationError(
                "A proposal must include either an offered item or a positive coin offer (or both)."
            )
        return attrs

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
        except Exception:
            return None

    def get_is_read_only(self, obj):
        return obj.status in {'accepted', 'declined', 'cancelled'}

    def get_can_cancel(self, obj):
        return obj.status not in {'declined', 'cancelled'}

    def get_can_accept(self, obj):
        return obj.status == 'pending'

    def get_can_counter(self, obj):
        return obj.status in {'pending', 'negotiating'}

    def get_can_decline(self, obj):
        return obj.status in {'pending', 'negotiating', 'countered'}

    def get_trade_id(self, obj):
        try:
            return obj.trade.id
        except Exception:
            return None


class NotificationSerializer(serializers.ModelSerializer):
    barter_interest_id = serializers.ReadOnlyField(source='barter_interest.id')

    class Meta:
        model = Notification
        fields = ('id', 'user', 'notification_type', 'title', 'message',
                  'barter_interest_id', 'is_read', 'created_at')
        read_only_fields = ('user', 'notification_type', 'title', 'message', 'barter_interest_id')


# ChatRoomSerializer and RoomChatMessageSerializer are replaced by ConversationSerializer and MessageSerializer in the chat app.


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

class CoinTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinTransaction
        fields = ('id', 'user', 'amount', 'transaction_type', 'description', 'created_at')
        read_only_fields = ('user', 'amount', 'transaction_type', 'description', 'created_at')

class ContractSerializer(serializers.ModelSerializer):
    party_a_username = serializers.ReadOnlyField(source='party_a.username')
    party_b_username = serializers.ReadOnlyField(source='party_b.username')
    party_a_display_name = serializers.SerializerMethodField()
    party_b_display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Contract
        fields = (
            'id', 'barter_interest', 'party_a', 'party_b', 
            'party_a_username', 'party_b_username', 'party_a_display_name', 'party_b_display_name',
            'status', 'terms', 'signed_a', 'signed_b', 
            'signed_a_timestamp', 'signed_b_timestamp', 'signed_a_ip', 'signed_b_ip',
            'created_at', 'updated_at'
        )
        read_only_fields = ('barter_interest', 'party_a', 'party_b', 'status', 'created_at', 'updated_at')

    def get_party_a_display_name(self, obj):
        try:
            return obj.party_a.profile.display_name or obj.party_a.username
        except:
            return obj.party_a.username

    def get_party_b_display_name(self, obj):
        try:
            return obj.party_b.profile.display_name or obj.party_b.username
        except:
            return obj.party_b.username

class TradeSerializer(serializers.ModelSerializer):
    handshake_pin = serializers.SerializerMethodField()
    pending_review = serializers.SerializerMethodField()
    contract_id = serializers.SerializerMethodField()
    requester_username = serializers.ReadOnlyField(source='requester.username')
    receiver_username = serializers.ReadOnlyField(source='receiver.username')
    requester_display_name = serializers.SerializerMethodField()
    receiver_display_name = serializers.SerializerMethodField()

    class Meta:
        model = Trade
        fields = '__all__'
        read_only_fields = ('proposal', 'requested_listing', 'offered_listing', 'requester', 'receiver', 'created_at')

    def get_handshake_pin(self, obj):
        """Only the REQUESTER (shipper) sees the PIN so they can share it with receiver on handoff."""
        request = self.context.get('request')
        if not request or not request.user:
            return None
        # Requester is the person who INITIATED the proposal (the shipper)
        if request.user == obj.requester or request.user.id == obj.requester_id:
            return obj.handshake_pin
        return None

    def get_pending_review(self, obj):
        request = self.context.get('request')
        if not request or not request.user or obj.status != 'completed':
            return False
        other_user = obj.receiver if request.user == obj.requester else obj.requester
        already_reviewed = UserReview.objects.filter(
            reviewer=request.user,
            reviewed_user=other_user,
            trade=obj
        ).exists()
        return not already_reviewed

    def get_contract_id(self, obj):
        try:
            return obj.proposal.contract.id
        except Exception:
            return None

    def get_requester_display_name(self, obj):
        try:
            return obj.requester.profile.display_name or obj.requester.username
        except Exception:
            return obj.requester.username

    def get_receiver_display_name(self, obj):
        try:
            return obj.receiver.profile.display_name or obj.receiver.username
        except Exception:
            return obj.receiver.username

class DisputeEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeEvidence
        fields = ('id', 'file', 'uploaded_at')

class DisputeSerializer(serializers.ModelSerializer):
    against_username = serializers.ReadOnlyField(source='against.username')
    against_name = serializers.SerializerMethodField()
    raised_by_username = serializers.ReadOnlyField(source='raised_by.username')
    evidence_files = DisputeEvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ('raised_by', 'status', 'created_at', 'resolution')
        
    def get_against_name(self, obj):
        try:
            return obj.against.profile.display_name or obj.against.username
        except:
            return obj.against.username


class SavedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedItem
        fields = ('id', 'user', 'item', 'created_at')
        read_only_fields = ('user', 'created_at')


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'


class ImageModerationResultSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    item_title = serializers.ReadOnlyField(source='item.title')
    class Meta:
        model = ImageModerationResult
        fields = '__all__'


class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.ReadOnlyField(source='admin.username')
    target_username = serializers.ReadOnlyField(source='target_user.username')
    target_listing_title = serializers.ReadOnlyField(source='target_listing.title')
    class Meta:
        model = AdminActionLog
        fields = '__all__'

