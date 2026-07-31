from rest_framework import permissions

class IsConversationParticipant(permissions.BasePermission):
    """
    DRF permission: Only allow participants of a conversation to view or add items.
    """
    def has_object_permission(self, request, view, obj):
        # If checking permission on a Conversation
        if hasattr(obj, 'participants'):
            return obj.participants.filter(id=request.user.id).exists()
        # If checking permission on a Message
        if hasattr(obj, 'conversation'):
            return obj.conversation.participants.filter(id=request.user.id).exists()
        return False
