from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message
from api.serializers import UserProfileSerializer
from api.models import UserProfile, BarterItem

class ChatUserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    online_status = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'display_name', 'avatar', 'online_status', 'last_seen')

    def get_display_name(self, obj):
        try:
            return obj.profile.display_name or obj.username
        except UserProfile.DoesNotExist:
            return obj.username

    def get_avatar(self, obj):
        try:
            if obj.profile.profile_picture_url:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.profile.profile_picture_url)
                return obj.profile.profile_picture_url
        except UserProfile.DoesNotExist:
            pass
        return None

    def get_online_status(self, obj):
        try:
            return obj.profile.online_status
        except UserProfile.DoesNotExist:
            return "offline"

    def get_last_seen(self, obj):
        try:
            if obj.profile.last_seen:
                return obj.profile.last_seen.isoformat()
        except UserProfile.DoesNotExist:
            pass
        return None


class ChatListingSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = BarterItem
        fields = ('id', 'title', 'image_url', 'owner_username', 'status', 'purchase_price')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            url = obj.image.url
        elif obj.image_url:
            url = obj.image_url
        else:
            first_image = obj.additional_images.order_by('id').first()
            url = first_image.image.url if first_image else ""
        if url and request:
            return request.build_absolute_uri(url)
        return url


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    sender_display_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    reply_to_detail = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'sender', 'sender_username', 'sender_display_name', 'sender_avatar',
            'message_type', 'text', 'attachment', 'attachment_url', 'reply_to', 'reply_to_detail',
            'edited', 'deleted', 'delivered_at', 'read_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('sender', 'delivered_at', 'read_at')

    def get_sender_display_name(self, obj):
        try:
            return obj.sender.profile.display_name or obj.sender.username
        except UserProfile.DoesNotExist:
            return obj.sender.username

    def get_sender_avatar(self, obj):
        try:
            if obj.sender.profile.profile_picture_url:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.sender.profile.profile_picture_url)
                return obj.sender.profile.profile_picture_url
        except UserProfile.DoesNotExist:
            pass
        return None

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

    def get_reply_to_detail(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender_username': obj.reply_to.sender.username,
                'text': obj.reply_to.text[:80] if obj.reply_to.text else ('📷 Image' if obj.reply_to.message_type == 'IMAGE' else '📁 File'),
                'message_type': obj.reply_to.message_type
            }
        return None


class ConversationSerializer(serializers.ModelSerializer):
    participants_detail = ChatUserSerializer(source='participants', many=True, read_only=True)
    listing_detail = ChatListingSerializer(source='listing', read_only=True)
    last_message_detail = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'participants', 'participants_detail', 'listing', 'listing_detail',
            'barter_interest', 'created_at', 'updated_at', 'last_message', 'last_message_detail',
            'unread_count', 'last_activity'
        )

    def get_last_message_detail(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'sender_username': last_msg.sender.username,
                'text': last_msg.text[:80] if last_msg.text else ('📷 Image' if last_msg.message_type == 'IMAGE' else '📁 Attachment'),
                'message_type': last_msg.message_type,
                'created_at': last_msg.created_at.isoformat(),
                'read_at': last_msg.read_at.isoformat() if last_msg.read_at else None,
                'delivered_at': last_msg.delivered_at.isoformat() if last_msg.delivered_at else None,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.messages.filter(read_at__isnull=True).exclude(sender=request.user).count()
        return 0
