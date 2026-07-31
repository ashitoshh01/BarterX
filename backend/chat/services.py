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
