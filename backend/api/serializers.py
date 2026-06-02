import re
# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from .models import UserProfile, Category, BarterItem, BarterOffer, ChatMessage, UserReview, OTPVerification

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    member_since = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('bio', 'location', 'phone_number', 'profile_picture_url', 'is_verified', 'average_rating',
                  'account_type', 'display_name', 'business_category', 'username', 'email', 'member_since')
        read_only_fields = ('is_verified', 'average_rating', 'account_type')

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

class BarterItemSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = BarterItem
        fields = '__all__'

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
    receiver_username = serializers.ReadOnlyField(source='receiver.username')

    class Meta:
        model = ChatMessage
        fields = '__all__'

class UserReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.ReadOnlyField(source='reviewer.username')
    reviewed_user_username = serializers.ReadOnlyField(source='reviewed_user.username')

    class Meta:
        model = UserReview
        fields = '__all__'
