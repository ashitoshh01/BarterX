# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from .models import UserProfile, Category, BarterItem, BarterOffer, ChatMessage, UserReview, TradeTransaction

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('bio', 'location', 'phone_number', 'profile_picture_url', 'is_verified', 'average_rating')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'profile')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        # Create corresponding profile
        UserProfile.objects.get_or_create(user=user)
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

class TradeTransactionSerializer(serializers.ModelSerializer):
    user_1_username = serializers.ReadOnlyField(source='user_1.username')
    user_2_username = serializers.ReadOnlyField(source='user_2.username')
    item_1_title = serializers.ReadOnlyField(source='item_1.title')
    item_2_title = serializers.ReadOnlyField(source='item_2.title')

    class Meta:
        model = TradeTransaction
        fields = '__all__'
