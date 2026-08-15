import json
from django.utils import timezone
from django.contrib.auth.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Conversation, Message
from .serializers import MessageSerializer

def get_room_group_name(conversation_id):
    return f"room_{conversation_id}"

def get_user_group_name(user_id):
    return f"user_{user_id}"

def broadcast_to_group(group_name, event_type, data):
    """Broadcast an event to a specific channel layer group."""
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "channel_event",
                "payload": {
                    "type": event_type,
                    "data": data
                }
            }
        )

def create_message(conversation, sender, message_type='TEXT', text='', attachment=None, reply_to=None):
    """Create a new message and broadcast it to all participants."""
    # Create the message
    msg = Message.objects.create(
        conversation=conversation,
        sender=sender,
        message_type=message_type,
        text=text,
        attachment=attachment,
        reply_to=reply_to
    )
    
    # Update conversation last activity and last message
    conversation.last_message = msg
    conversation.last_activity = timezone.now()
    conversation.save(update_fields=['last_message', 'last_activity'])
    
    # Serialize the message
    serializer = MessageSerializer(msg)
    message_data = serializer.data
    
    # Broadcast to room
    room_group = get_room_group_name(conversation.id)
    broadcast_to_group(room_group, "chat.message", message_data)
    
    # Also broadcast to user personal channels for list preview/unread count updates
    for participant in conversation.participants.all():
        if participant != sender:
            user_group = get_user_group_name(participant.id)
            broadcast_to_group(user_group, "chat.message_preview", {
                "conversation_id": conversation.id,
                "last_message": {
                    "id": msg.id,
                    "sender_username": sender.username,
                    "text": text[:80] if text else ('📷 Image' if message_type == 'IMAGE' else '📁 Attachment'),
                    "message_type": message_type,
                    "created_at": msg.created_at.isoformat(),
                },
                "unread_count": conversation.messages.filter(read_at__isnull=True).exclude(sender=participant).count()
            })
            
            # Send dynamic notifications
            broadcast_to_group(user_group, "notification.created", {
                "id": f"msg_notif_{msg.id}",
                "type": "chat",
                "title": f"New message from {sender.profile.display_name or sender.username}",
                "body": text[:80] if text else "Sent an attachment.",
                "conversation_id": conversation.id,
                "time": msg.created_at.isoformat(),
                "read": False
            })

    return msg

def mark_messages_as_read(conversation, reader):
    """Mark all unread messages in the conversation from other senders as read."""
    unread_messages = conversation.messages.filter(read_at__isnull=True).exclude(sender=reader)
    count = unread_messages.count()
    if count > 0:
        now = timezone.now()
        unread_messages.update(read_at=now)
        
        # Broadcast read receipt to room
        room_group = get_room_group_name(conversation.id)
        broadcast_to_group(room_group, "chat.read_receipt", {
            "conversation_id": conversation.id,
            "reader_username": reader.username,
            "read_at": now.isoformat()
        })
        
        # Also notify reader user group to clear unread indicator
        reader_group = get_user_group_name(reader.id)
        broadcast_to_group(reader_group, "chat.read_receipt_self", {
            "conversation_id": conversation.id,
            "unread_count": 0
        })

def mark_messages_as_delivered(conversation, receiver):
    """Mark messages in the conversation from other senders as delivered."""
    undelivered_messages = conversation.messages.filter(delivered_at__isnull=True).exclude(sender=receiver)
    if undelivered_messages.exists():
        now = timezone.now()
        undelivered_messages.update(delivered_at=now)
        
        room_group = get_room_group_name(conversation.id)
        broadcast_to_group(room_group, "chat.delivery_receipt", {
            "conversation_id": conversation.id,
            "delivered_at": now.isoformat()
        })


def check_and_update_chat_limit(user):
    """
    Checks if a user is within their chat message limit.
    Returns: (is_allowed, warning_triggered, details_dict)
    """
    from api.models import ChatUsage
    now = timezone.now()
    try:
        profile = user.profile
    except Exception:
        return True, False, {"messages_remaining": 20, "resets_in_seconds": 60, "tier": "FREE"}

    # Determine limits
    if profile.is_premium:
        max_per_minute = 100
        max_per_day = 1000
        tier = "PREMIUM"
    elif profile.is_verified:
        max_per_minute = 40
        max_per_day = 500
        tier = "VERIFIED"
    else:
        max_per_minute = 20
        max_per_day = 200
        tier = "FREE"

    usage, created = ChatUsage.objects.get_or_create(user=user)

    # Check reset periods
    if now - usage.minute_reset_at > timezone.timedelta(minutes=1):
        usage.messages_sent_this_minute = 0
        usage.minute_reset_at = now

    if now - usage.day_reset_at > timezone.timedelta(days=1):
        usage.messages_sent_today = 0
        usage.day_reset_at = now

    minute_cooldown = max(0, int((usage.minute_reset_at + timezone.timedelta(minutes=1) - now).total_seconds()))
    day_cooldown = max(0, int((usage.day_reset_at + timezone.timedelta(days=1) - now).total_seconds()))

    # Check daily limit
    if usage.messages_sent_today >= max_per_day:
        return False, True, {
            "error": f"You have reached your daily limit of {max_per_day} messages.",
            "limit_type": "day",
            "retry_after": day_cooldown,
            "messages_remaining": 0,
            "resets_in_seconds": day_cooldown,
            "tier": tier
        }

    # Check minute limit
    if usage.messages_sent_this_minute >= max_per_minute:
        return False, True, {
            "error": f"You have reached your limit of {max_per_minute} messages per minute.",
            "limit_type": "minute",
            "retry_after": minute_cooldown,
            "messages_remaining": 0,
            "resets_in_seconds": minute_cooldown,
            "tier": tier
        }

    # Increment usage
    usage.messages_sent_today += 1
    usage.messages_sent_this_minute += 1
    usage.last_message_sent_at = now
    usage.save()

    remaining_today = max(0, max_per_day - usage.messages_sent_today)
    warning_triggered = (remaining_today <= (max_per_day * 0.1)) or (usage.messages_sent_this_minute >= (max_per_minute * 0.8))

    return True, warning_triggered, {
        "messages_remaining": remaining_today,
        "resets_in_seconds": day_cooldown,
        "tier": tier,
        "messages_sent_today": usage.messages_sent_today,
        "max_messages_today": max_per_day
    }
