import json
import logging
from django.conf import settings
from django.utils import timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Conversation, Message
from .serializers import MessageSerializer
from .services import (
    create_message,
    mark_messages_as_read,
    mark_messages_as_delivered,
    get_room_group_name,
    get_user_group_name,
    broadcast_to_group
)

logger = logging.getLogger(__name__)

# Redis online presence tracking
try:
    import redis
    redis_client = redis.Redis(host='127.0.0.1', port=6379, db=0, socket_timeout=0.5)
    redis_client.ping()
except Exception:
    redis_client = None

ONLINE_USERS_KEY = "chat_online_users"
LOCAL_ONLINE_USERS = set()


@database_sync_to_async
def set_user_db_offline(user):
    """Persist only last_seen to the database upon disconnect."""
    from api.models import UserProfile
    try:
        profile = UserProfile.objects.get(user=user)
        profile.last_seen = timezone.now()
        profile.save(update_fields=['last_seen'])
    except Exception as e:
        logger.error(f"Error setting user offline in DB: {e}")


def get_online_status(user_id):
    if redis_client:
        try:
            return "online" if redis_client.sismember(ONLINE_USERS_KEY, user_id) else "offline"
        except Exception:
            pass
    return "online" if user_id in LOCAL_ONLINE_USERS else "offline"


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')

        # Do NOT allow anonymous connections
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)  # Custom close code for unauthorized
            return

        self.user_group = get_user_group_name(self.user.id)
        self.active_room = None

        # Add to personal user group (to receive notifications, wallet/proposal updates, and previews)
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Mark user as online in memory
        if redis_client:
            try:
                redis_client.sadd(ONLINE_USERS_KEY, self.user.id)
            except Exception as e:
                logger.error(f"Redis sadd failed: {e}")
                LOCAL_ONLINE_USERS.add(self.user.id)
        else:
            LOCAL_ONLINE_USERS.add(self.user.id)

        await self.accept()

        # Broadcast presence change to user's partners
        await self.broadcast_presence_change("online")

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # Leave personal user group
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

            # Leave active room if in one
            if self.active_room:
                room_group = get_room_group_name(self.active_room)
                await self.channel_layer.group_discard(room_group, self.channel_name)

            # Mark user as offline in memory
            if redis_client:
                try:
                    redis_client.srem(ONLINE_USERS_KEY, self.user.id)
                except Exception:
                    LOCAL_ONLINE_USERS.discard(self.user.id)
            else:
                LOCAL_ONLINE_USERS.discard(self.user.id)

            # Persist last_seen timestamp in the DB
            await set_user_db_offline(self.user)

            # Broadcast presence change to partners
            await self.broadcast_presence_change("offline")

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except Exception:
            await self.send(text_data=json.dumps({"type": "error", "data": {"message": "Invalid JSON format."}}))
            return

        event_type = payload.get("type")
        event_data = payload.get("data", {})

        if event_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong", "data": {}}))
            return

        if event_type == "join_room":
            conversation_id = event_data.get("conversation_id")
            if conversation_id:
                await self.handle_join_room(conversation_id)

        elif event_type == "leave_room":
            await self.handle_leave_room()

        elif event_type == "send_message":
            conversation_id = event_data.get("conversation_id")
            text = event_data.get("text", "").strip()
            reply_to_id = event_data.get("reply_to")
            if conversation_id and text:
                await self.handle_send_message(conversation_id, text, reply_to_id)

        elif event_type == "edit_message":
            message_id = event_data.get("message_id")
            text = event_data.get("text", "").strip()
            if message_id and text:
                await self.handle_edit_message(message_id, text)

        elif event_type == "delete_message":
            message_id = event_data.get("message_id")
            if message_id:
                await self.handle_delete_message(message_id)

        elif event_type == "typing_start":
            conversation_id = event_data.get("conversation_id")
            if conversation_id:
                await self.handle_typing(conversation_id, True)

        elif event_type == "typing_stop":
            conversation_id = event_data.get("conversation_id")
            if conversation_id:
                await self.handle_typing(conversation_id, False)

        elif event_type == "read_receipt":
            conversation_id = event_data.get("conversation_id")
            if conversation_id:
                await self.handle_read_receipt(conversation_id)

        elif event_type == "presence_status":
            status = event_data.get("status")  # "online" or "away"
            if status in ["online", "away"]:
                await self.broadcast_presence_change(status)

    # --- Handlers for incoming WS messages ---

    async def handle_join_room(self, conversation_id):
        # Verify if user is part of the conversation
        is_member = await self.is_conversation_member(conversation_id)
        if not is_member:
            await self.send(text_data=json.dumps({"type": "error", "data": {"message": "Unauthorized room join request."}}))
            return

        # Leave previous active room
        if self.active_room and self.active_room != conversation_id:
            prev_group = get_room_group_name(self.active_room)
            await self.channel_layer.group_discard(prev_group, self.channel_name)

        self.active_room = conversation_id
        room_group = get_room_group_name(conversation_id)
        await self.channel_layer.group_add(room_group, self.channel_name)

        # Mark messages as delivered and read
        await self.mark_messages_read_db(conversation_id)
        await self.mark_messages_delivered_db(conversation_id)

    async def handle_leave_room(self):
        if self.active_room:
            room_group = get_room_group_name(self.active_room)
            await self.channel_layer.group_discard(room_group, self.channel_name)
            self.active_room = None

    async def handle_send_message(self, conversation_id, text, reply_to_id):
        is_member = await self.is_conversation_member(conversation_id)
        if not is_member:
            await self.send(text_data=json.dumps({"type": "error", "data": {"message": "Not authorized to send messages here."}}))
            return

        await self.create_and_broadcast_message(conversation_id, text, reply_to_id)

    async def handle_edit_message(self, message_id, text):
        success, message_data, conversation_id = await self.edit_message_db(message_id, text)
        if success:
            room_group = get_room_group_name(conversation_id)
            broadcast_to_group(room_group, "chat.edited", message_data)
        else:
            await self.send(text_data=json.dumps({"type": "error", "data": {"message": "Failed to edit message. Not owner or not found."}}))

    async def handle_delete_message(self, message_id):
        success, conversation_id = await self.delete_message_db(message_id)
        if success:
            room_group = get_room_group_name(conversation_id)
            broadcast_to_group(room_group, "chat.deleted", {"message_id": message_id, "conversation_id": conversation_id})
        else:
            await self.send(text_data=json.dumps({"type": "error", "data": {"message": "Failed to delete message."}}))

    async def handle_typing(self, conversation_id, is_typing):
        is_member = await self.is_conversation_member(conversation_id)
        if is_member:
            room_group = get_room_group_name(conversation_id)
            # Send typing status, excluding the sender via channel layer direct filtering (or in frontend client filtering)
            await self.channel_layer.group_send(
                room_group,
                {
                    "type": "channel_event",
                    "payload": {
                        "type": "typing.start" if is_typing else "typing.stop",
                        "data": {
                            "conversation_id": conversation_id,
                            "username": self.user.username,
                            "display_name": self.user.profile.display_name or self.user.username
                        }
                    }
                }
            )

    async def handle_read_receipt(self, conversation_id):
        is_member = await self.is_conversation_member(conversation_id)
        if is_member:
            await self.mark_messages_read_db(conversation_id)

    # --- Database Helpers ---

    @database_sync_to_async
    def is_conversation_member(self, conversation_id):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            return conv.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def create_and_broadcast_message(self, conversation_id, text, reply_to_id):
        conv = Conversation.objects.get(id=conversation_id)
        reply_to_msg = None
        if reply_to_id:
            try:
                reply_to_msg = Message.objects.get(id=reply_to_id, conversation=conv)
            except Message.DoesNotExist:
                pass
        create_message(conv, self.user, message_type='TEXT', text=text, reply_to=reply_to_msg)

    @database_sync_to_async
    def edit_message_db(self, message_id, text):
        try:
            msg = Message.objects.get(id=message_id)
            if msg.sender != self.user:
                return False, {}, None
            msg.text = text
            msg.edited = True
            msg.save()
            return True, MessageSerializer(msg).data, msg.conversation.id
        except Message.DoesNotExist:
            return False, {}, None

    @database_sync_to_async
    def delete_message_db(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            if msg.sender != self.user:
                return False, None
            # Soft delete
            msg.text = "This message was deleted."
            msg.deleted = True
            msg.attachment = None
            msg.save()
            return True, msg.conversation.id
        except Message.DoesNotExist:
            return False, None

    @database_sync_to_async
    def mark_messages_read_db(self, conversation_id):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            mark_messages_as_read(conv, self.user)
        except Exception as e:
            logger.error(f"Error marking messages read: {e}")

    @database_sync_to_async
    def mark_messages_delivered_db(self, conversation_id):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            mark_messages_as_delivered(conv, self.user)
        except Exception as e:
            logger.error(f"Error marking messages delivered: {e}")

    # --- Presence Broadcast helper ---

    async def broadcast_presence_change(self, status):
        """Broadcast user presence change to all active chats they participate in."""
        conversations = await self.get_user_conversations()
        for conv_id in conversations:
            room_group = get_room_group_name(conv_id)
            await self.channel_layer.group_send(
                room_group,
                {
                    "type": "channel_event",
                    "payload": {
                        "type": "presence.update",
                        "data": {
                            "username": self.user.username,
                            "online_status": status,
                            "last_seen": timezone.now().isoformat() if status == "offline" else None
                        }
                    }
                }
            )

    @database_sync_to_async
    def get_user_conversations(self):
        return list(self.user.conversations.values_list('id', flat=True))

    # --- Channels internal event handlers ---

    async def channel_event(self, event):
        """Called when a service broadcasts a custom event using the service layer helper."""
        await self.send(text_data=json.dumps(event["payload"]))
