from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .permissions import IsConversationParticipant
from .services import create_message, mark_messages_as_read, broadcast_to_group
from .utils import validate_chat_attachment
from api.models import BarterItem, BarterInterest, DealConfirmation
from api.serializers import DealConfirmationSerializer
import os

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = (permissions.IsAuthenticated, IsConversationParticipant)

    def get_queryset(self):
        # Only return conversations where current user is a participant
        user = self.request.user
        return Conversation.objects.filter(participants=user).order_by('-last_activity')

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get paginated messages for a conversation (supports infinite scrolling)."""
        conversation = self.get_object()
        
        # Mark messages in this conversation as read on load
        mark_messages_as_read(conversation, request.user)

        messages = conversation.messages.all().order_by('created_at')
        
        # Basic pagination support
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """HTTP fallback send message and file/image upload action."""
        conversation = self.get_object()
        text = request.data.get('message', '').strip()
        media_file = request.FILES.get('media', None)
        reply_to_id = request.data.get('reply_to', None)

        if not text and not media_file:
            return Response({"detail": "Message text or attachment is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Determine message type and validate attachments
        message_type = 'TEXT'
        if media_file:
            try:
                validate_chat_attachment(media_file)
            except ValidationError as e:
                return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)
                
            # Classify image vs file
            ext = os.path.splitext(media_file.name)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']:
                message_type = 'IMAGE'
            else:
                message_type = 'FILE'

        reply_to_msg = None
        if reply_to_id:
            try:
                reply_to_msg = Message.objects.get(id=reply_to_id, conversation=conversation)
            except Message.DoesNotExist:
                pass

        # Create message (broadcast is triggered inside create_message service)
        msg = create_message(
            conversation=conversation,
            sender=request.user,
            message_type=message_type,
            text=text,
            attachment=media_file,
            reply_to=reply_to_msg
        )

        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def search(self, request, pk=None):
        """Search inside a conversation's messages."""
        conversation = self.get_object()
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        # Filter messages in this conversation containing the query text
        matches = conversation.messages.filter(text__icontains=query, deleted=False).order_by('created_at')
        serializer = MessageSerializer(matches, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def get_or_create_for_listing(self, request):
        """Start a listing-based chat or return existing conversation."""
        listing_id = request.data.get('listing_id')
        if not listing_id:
            return Response({"detail": "listing_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            listing = BarterItem.objects.get(id=listing_id)
        except BarterItem.DoesNotExist:
            return Response({"detail": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)

        if listing.owner == request.user:
            return Response({"detail": "Cannot start a chat with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create BarterInterest for this listing between the users
        interest, created = BarterInterest.objects.get_or_create(
            requester=request.user,
            receiver=listing.owner,
            requested_item=listing,
            defaults={'status': 'accepted'}
        )

        if created:
            # Reserve requested item
            listing.status = 'reserved'
            listing.save()
            DealConfirmation.objects.get_or_create(barter_interest=interest)

        # Get or create Conversation
        conversation, conv_created = Conversation.objects.get_or_create(
            barter_interest=interest,
            defaults={'listing': listing}
        )

        if conv_created:
            # Set up participants
            conversation.participants.add(request.user, listing.owner)
            
            # Send conversation started system message
            create_message(
                conversation=conversation,
                sender=request.user, # System message is generated on behalf of the creator or system user
                message_type='SYSTEM',
                text="Conversation started."
            )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def confirmation_status(self, request, pk=None):
        """Get deal confirmation status for a chat room."""
        room = self.get_object()
        if not room.participants.filter(id=request.user.id).exists():
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        try:
            dc = room.barter_interest.deal_confirmation
            serializer = DealConfirmationSerializer(dc)
            return Response(serializer.data)
        except DealConfirmation.DoesNotExist:
            return Response({"detail": "No deal confirmation exists."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def request_confirmation(self, request, pk=None):
        """Step 5: Request deal confirmation (rate-limited per user)."""
        room = self.get_object()
        if not room.participants.filter(id=request.user.id).exists():
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        interest = room.barter_interest
        if not interest or interest.status != 'accepted':
            return Response({"detail": "Interest must be accepted first."}, status=status.HTTP_400_BAD_REQUEST)

        dc, _ = DealConfirmation.objects.get_or_create(barter_interest=interest)

        # Determine which user field to use
        is_user1 = (request.user == interest.requester)
        count_field = 'user1_request_count' if is_user1 else 'user2_request_count'
        cooldown_field = 'user1_cooldown_until' if is_user1 else 'user2_cooldown_until'

        # Check cooldown
        cooldown_until = getattr(dc, cooldown_field)
        if cooldown_until and timezone.now() < cooldown_until:
            remaining = (cooldown_until - timezone.now()).seconds
            return Response({"detail": f"Cooldown active. Wait {remaining}s.", "cooldown_remaining": remaining},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Reset count if cooldown has expired
        if cooldown_until and timezone.now() >= cooldown_until:
            setattr(dc, count_field, 0)
            setattr(dc, cooldown_field, None)

        current_count = getattr(dc, count_field)
        if current_count >= 3:
            # Set 60 second cooldown
            from datetime import timedelta
            setattr(dc, cooldown_field, timezone.now() + timedelta(seconds=60))
            dc.save()
            return Response({"detail": "Rate limit reached. 60s cooldown activated.", "cooldown_remaining": 60},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Increment count
        setattr(dc, count_field, current_count + 1)
        dc.save()

        # Notify the other participant
        other_user = interest.receiver if is_user1 else interest.requester
        requester_name = request.user.profile.display_name if hasattr(request.user, 'profile') else request.user.username
        
        from api.models import Notification
        Notification.objects.create(
            user=other_user,
            notification_type='deal_requested',
            title='Deal Confirmation Requested',
            message=f"{requester_name} has requested to finalize the barter deal.",
            barter_interest=interest
        )
        
        broadcast_to_group(f"user_{other_user.id}", "notification.created", {
            "id": f"deal_requested_{interest.id}_{timezone.now().timestamp()}",
            "type": "match",
            "title": "Deal Confirmation Requested",
            "body": f"{requester_name} has requested to finalize the barter deal.",
            "time": timezone.now().isoformat(),
            "read": False
        })
        broadcast_to_group(f"user_{other_user.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status
        })

        return Response({"detail": "Confirmation request sent.", "request_count": current_count + 1})

    @action(detail=True, methods=['post'])
    def respond_confirmation(self, request, pk=None):
        """Step 5: Respond to deal confirmation (accept/decline)."""
        room = self.get_object()
        if not room.participants.filter(id=request.user.id).exists():
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        action_type = request.data.get('action')  # 'accept' or 'decline'
        if action_type not in ('accept', 'decline'):
            return Response({"detail": "Action must be 'accept' or 'decline'."}, status=status.HTTP_400_BAD_REQUEST)

        interest = room.barter_interest
        if not interest:
            return Response({"detail": "No associated interest found."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            dc = interest.deal_confirmation
        except DealConfirmation.DoesNotExist:
            return Response({"detail": "No deal confirmation exists."}, status=status.HTTP_404_NOT_FOUND)

        is_user1 = (request.user == interest.requester)

        if action_type == 'accept':
            if is_user1:
                dc.user1_confirmed = True
            else:
                dc.user2_confirmed = True
            dc.save()

            # Check if both confirmed → complete the deal
            if dc.user1_confirmed and dc.user2_confirmed:
                dc.completed_at = timezone.now()
                dc.save()

                interest.status = 'completed'
                interest.save()

                # Mark items as traded
                interest.requested_item.status = 'traded'
                interest.requested_item.save()
                if interest.offered_item:
                    interest.offered_item.status = 'traded'
                    interest.offered_item.save()

                # Coin System Logic (1 coin = 100 rupees)
                price1 = interest.requested_item.purchase_price
                price2 = interest.offered_item.purchase_price if interest.offered_item else 0
                
                diff = abs(price1 - price2)
                coins_to_credit = int(diff / 100)
                
                if coins_to_credit > 0:
                    # User receiving the lower value item gets the coins
                    if price1 < price2:
                        recipient = interest.requester
                    else:
                        recipient = interest.receiver
                        
                    from api.models import UserProfile, CoinTransaction
                    profile, _ = UserProfile.objects.get_or_create(user=recipient)
                    profile.add_coins(coins_to_credit)
                    CoinTransaction.objects.create(
                        user=recipient,
                        amount=coins_to_credit,
                        transaction_type='earned',
                        description=f"Coin credit for barter value gap (Items: {interest.requested_item.title} vs {interest.offered_item.title if interest.offered_item else 'N/A'})"
                    )
                    broadcast_to_group(f"user_{recipient.id}", "wallet.updated", {
                        "balance": profile.coin_balance
                    })

                # Award trust & points to both users (Steps 7 & 8)
                from api.models import UserProfile, Notification
                for u in [interest.requester, interest.receiver]:
                    profile, _ = UserProfile.objects.get_or_create(user=u)
                    profile.adjust_trust(5)   # +5 trust for completed barter
                    profile.add_points(50)    # +50 reward points

                    # Notify both users
                    Notification.objects.create(
                        user=u,
                        notification_type='deal_completed',
                        title='Barter Completed! 🎉',
                        message=f"Your barter deal has been finalized. +5 Trust, +50 Points awarded!",
                        barter_interest=interest
                    )
                    
                    user_group = f"user_{u.id}"
                    broadcast_to_group(user_group, "notification.created", {
                        "id": f"deal_completed_{interest.id}_{timezone.now().timestamp()}",
                        "type": "coins",
                        "title": "Barter Completed! 🎉",
                        "body": "Your barter deal has been finalized. +5 Trust, +50 Points awarded!",
                        "time": timezone.now().isoformat(),
                        "read": False
                    })
                    broadcast_to_group(user_group, "proposal.updated", {
                        "id": interest.id,
                        "status": "completed"
                    })

                # Generate system message in the chat
                create_message(
                    conversation=room,
                    sender=request.user,
                    message_type='SYSTEM',
                    text="Trade completed successfully."
                )

                return Response({"detail": "Deal completed! Both parties confirmed.", "status": "completed"})

            return Response({"detail": "Your confirmation recorded. Waiting for the other party."})

        else:  # decline
            from api.models import UserProfile, Notification
            # Reset confirmation for the requester
            if is_user1:
                dc.user2_confirmed = False  # Reset other's state if they re-request
            else:
                dc.user1_confirmed = False
            dc.save()

            # Generate system message in the chat
            create_message(
                conversation=room,
                sender=request.user,
                message_type='SYSTEM',
                text="Deal confirmation declined."
            )

            # Notify the other party
            other_user = interest.receiver if is_user1 else interest.requester
            Notification.objects.create(
                user=other_user,
                notification_type='interest_rejected',
                title='Deal Confirmation Declined',
                message=f"{request.user.profile.display_name or request.user.username} declined the deal confirmation.",
                barter_interest=interest
            )
            broadcast_to_group(f"user_{other_user.id}", "notification.created", {
                "id": f"deal_declined_{interest.id}_{timezone.now().timestamp()}",
                "type": "match",
                "title": "Deal Confirmation Declined",
                "body": f"{request.user.profile.display_name or request.user.username} declined the deal confirmation.",
                "time": timezone.now().isoformat(),
                "read": False
            })

            return Response({"detail": "Confirmation declined."})
