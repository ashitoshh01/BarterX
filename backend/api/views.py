from rest_framework import viewsets, generics, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db.models import Q
import random
import re

from .models import (
    BarterItem, BarterItemImage, Category, BarterOffer, ChatMessage, UserReview,
    UserProfile, OTPVerification, TradeTransaction,
    BarterInterest, Notification, ChatRoom, DealConfirmation
)
from .serializers import (
    BarterItemSerializer, CategorySerializer, BarterOfferSerializer,
    ChatMessageSerializer, UserReviewSerializer, UserSerializer, UserProfileSerializer,
    TradeTransactionSerializer, BarterInterestSerializer, NotificationSerializer,
    ChatRoomSerializer, RoomChatMessageSerializer, DealConfirmationSerializer,
    BarterItemCompactSerializer
)
from .email_services import send_otp_email


# ============================================================
# EXISTING VIEWS (preserved)
# ============================================================

class SendOTPView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip()
        username = request.data.get('username', '').strip()
        account_type = request.data.get('account_type', 'individual')

        if not email:
            return Response({"email": ["Email is required."]}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            return Response({"email": ["Please enter a valid email address."]}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"email": ["This email is already registered."]}, status=status.HTTP_400_BAD_REQUEST)

        if account_type == 'individual':
            if not username:
                return Response({"username": ["Username is required."]}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(username=username).exists():
                return Response({"username": ["This username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        otp_hash = make_password(otp)

        OTPVerification.objects.update_or_create(
            email=email,
            defaults={'otp_hash': otp_hash, 'attempts': 0, 'created_at': timezone.now()}
        )

        try:
            send_otp_email(email, otp)
        except Exception:
            return Response({"detail": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Verification code sent successfully."}, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)


class BarterItemViewSet(viewsets.ModelViewSet):
    queryset = BarterItem.objects.all().order_by('-created_at')
    serializer_class = BarterItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'offering', 'wanting', 'location']
    ordering_fields = ['created_at', 'title']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        # We need minimum 3 images. They can be passed as a list under 'images' or individually as files.
        images = request.FILES.getlist('images')
        
        # If frontend sends them as individual inputs like image1, image2, image3, collect them:
        if len(images) < 3:
            collected_images = []
            for key in sorted(request.FILES.keys()):
                if key.startswith('image'):
                    collected_images.extend(request.FILES.getlist(key))
            if len(collected_images) >= 3:
                images = collected_images

        if len(images) < 3:
            return Response(
                {"detail": "You must upload a minimum of 3 images of the product."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate the item score from 1 to 10
        try:
            age_months = int(request.data.get('age_months', 0))
        except ValueError:
            age_months = 0
            
        try:
            purchase_price = float(request.data.get('purchase_price', 0.0))
        except ValueError:
            purchase_price = 0.0
        
        # Base score starts at 7.0
        # Age deduction: 0.1 per month (max 4.0 deduction)
        age_deduction = min(4.0, age_months * 0.1)
        # Price addition: purchase_price / 10000 (max 3.0 addition)
        price_addition = min(3.0, purchase_price / 10000.0)
        
        category_id = request.data.get('category')
        category_bonus = 0.0
        if category_id:
            try:
                cat = Category.objects.get(id=category_id)
                if cat.is_service:
                    category_bonus = 0.5
                elif 'electronic' in cat.name.lower() or 'gadget' in cat.name.lower() or 'tech' in cat.name.lower():
                    category_bonus = 1.0
            except Exception:
                pass
                
        item_score = round(max(1.0, min(10.0, 7.0 - age_deduction + price_addition + category_bonus)), 1)
        
        # Build and validate serializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save the item with computed values and the first image as main image
        item = serializer.save(
            owner=request.user,
            item_score=item_score,
            image=images[0]
        )
        
        # Save all uploaded images to BarterItemImage model
        for img in images:
            BarterItemImage.objects.create(item=item, image=img)
            
        return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_items(self, request):
        items = BarterItem.objects.filter(owner=request.user).order_by('-created_at')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to modify this listing."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to delete this listing."}, status=status.HTTP_403_FORBIDDEN)
        # Delete related images from disk / database first
        instance.additional_images.all().delete()
        return super().destroy(request, *args, **kwargs)


class BarterOfferViewSet(viewsets.ModelViewSet):
    serializer_class = BarterOfferSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return BarterOffer.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def perform_update(self, serializer):
        offer = serializer.save()
        if offer.status == 'accepted':
            TradeTransaction.objects.get_or_create(
                offer=offer,
                defaults={
                    'item_1': offer.offered_item, 'item_2': offer.requested_item,
                    'user_1': offer.sender, 'user_2': offer.receiver,
                }
            )
            offer.offered_item.status = 'traded'
            offer.offered_item.save()
            offer.requested_item.status = 'traded'
            offer.requested_item.save()


class TradeTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TradeTransaction.objects.all().order_by('-completed_at')
    serializer_class = TradeTransactionSerializer
    permission_classes = (permissions.IsAuthenticated,)


class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return ChatMessage.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class UserReviewViewSet(viewsets.ModelViewSet):
    serializer_class = UserReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserReview.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        display_name = request.data.get('display_name', profile.display_name)
        bio = request.data.get('bio', profile.bio)
        location = request.data.get('location', profile.location)
        phone_number = request.data.get('phone_number', profile.phone_number)
        
        is_verified = request.data.get('is_verified', profile.is_verified)
        if isinstance(is_verified, str):
            is_verified = is_verified.lower() == 'true'
            
        profile.display_name = display_name
        profile.bio = bio
        profile.location = location
        profile.phone_number = phone_number
        profile.is_verified = is_verified
        
        # Calculate updated trust score dynamically
        completed_interests = BarterInterest.objects.filter(
            Q(requester=request.user) | Q(receiver=request.user),
            status='completed'
        ).count()
        
        profile_complete = bool(display_name and bio and location)
        email_verified = bool(request.user.email)
        phone_verified = bool(phone_number)
        
        score = 30
        if profile_complete: score += 10
        if email_verified: score += 5
        if phone_verified: score += 10
        if is_verified: score += 20
        score += min(25, completed_interests * 5)
        score += min(20, int(profile.average_rating * 4))
        
        profile.trust_score = score
        profile.save()
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        """Centralized dashboard statistics endpoint.
        Ensures all metrics are calculated server-side for consistency."""
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Successful swaps (completed interests)
        completed_interests = BarterInterest.objects.filter(
            Q(requester=user) | Q(receiver=user),
            status='completed'
        )
        successful_swaps = completed_interests.count()

        # Recent swaps this month
        from datetime import datetime
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        recent_swaps = completed_interests.filter(updated_at__gte=month_start).count()

        # Value saved (₹3,500 avg per swap)
        value_saved = successful_swaps * 3500

        # Member months
        date_joined = user.date_joined
        member_months = max(1, (now.year - date_joined.year) * 12 + (now.month - date_joined.month))

        # Verification status
        verification = {
            'profile_complete': bool(profile.display_name and profile.bio and profile.location),
            'phone_verified': bool(profile.phone_number),
            'email_verified': bool(user.email),
            'id_verified': profile.is_verified,
            'successful_trades': successful_swaps,
        }

        # Pending offers
        pending_offers = BarterInterest.objects.filter(
            Q(requester=user) | Q(receiver=user),
            status__in=['pending', 'accepted']
        ).count()

        # Unread messages
        unread_messages = ChatMessage.objects.filter(
            room__in=ChatRoom.objects.filter(Q(user1=user) | Q(user2=user)),
            is_read=False
        ).exclude(sender=user).count()

        return Response({
            'trust_score': profile.trust_score,
            'trust_level': profile.trust_level,
            'successful_swaps': successful_swaps,
            'recent_swaps': recent_swaps,
            'value_saved': value_saved,
            'member_since': profile.user.date_joined.strftime('%B %Y'),
            'member_months': member_months,
            'verification': verification,
            'pending_offers': pending_offers,
            'unread_messages': unread_messages,
            'reward_points': profile.reward_points,
            'average_rating': profile.average_rating,
        })


# ============================================================
# NEW VIEWS: BARTER INTEREST → CHAT → DEAL FLOW
# ============================================================

def _create_notification(user, ntype, title, message, interest=None):
    """Helper to create notifications."""
    Notification.objects.create(
        user=user, notification_type=ntype,
        title=title, message=message, barter_interest=interest
    )


class BarterInterestViewSet(viewsets.ModelViewSet):
    """Step 1: Raise, accept, reject barter interests."""
    serializer_class = BarterInterestSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return BarterInterest.objects.filter(Q(requester=user) | Q(receiver=user))

    def create(self, request, *args, **kwargs):
        """Raise a new barter interest (swap proposal)."""
        requested_item_id = request.data.get('requested_item')
        offered_item_id = request.data.get('offered_item')

        if not requested_item_id:
            return Response({"detail": "requested_item is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            requested_item = BarterItem.objects.get(id=requested_item_id)
        except BarterItem.DoesNotExist:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if requested_item.owner == request.user:
            return Response({"detail": "Cannot request your own item."}, status=status.HTTP_400_BAD_REQUEST)
        if requested_item.status != 'active':
            return Response({"detail": "Requested item is not available."}, status=status.HTTP_400_BAD_REQUEST)

        offered_item = None
        if offered_item_id:
            try:
                offered_item = BarterItem.objects.get(id=offered_item_id)
            except BarterItem.DoesNotExist:
                return Response({"detail": "Offered item not found."}, status=status.HTTP_404_NOT_FOUND)

            if str(requested_item_id) == str(offered_item_id):
                return Response({"detail": "Cannot offer the same product."}, status=status.HTTP_400_BAD_REQUEST)
            if offered_item.owner != request.user:
                return Response({"detail": "You can only offer your own items."}, status=status.HTTP_400_BAD_REQUEST)
            if offered_item.status != 'active':
                return Response({"detail": "Offered item is not available."}, status=status.HTTP_400_BAD_REQUEST)
            if BarterInterest.objects.filter(offered_item=offered_item, status='completed').exists():
                return Response({"detail": "This item is already involved in a finalized barter."},
                                status=status.HTTP_400_BAD_REQUEST)

        # Check duplicate pending/accepted interest
        duplicate_query = BarterInterest.objects.filter(
            requester=request.user, requested_item=requested_item,
            status__in=['pending', 'accepted']
        )
        if offered_item:
            duplicate_query = duplicate_query.filter(offered_item=offered_item)
        else:
            duplicate_query = duplicate_query.filter(offered_item__isnull=True)

        if duplicate_query.exists():
            return Response({"detail": "You already have a pending or active interest for this swap."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Auto-accept and create chat room immediately
        interest = BarterInterest.objects.create(
            requester=request.user, receiver=requested_item.owner,
            requested_item=requested_item, offered_item=offered_item,
            status='accepted'
        )

        # Reserve requested item
        requested_item.status = 'reserved'
        requested_item.save()
        if offered_item:
            offered_item.status = 'reserved'
            offered_item.save()

        # Create chat room
        room, _ = ChatRoom.objects.get_or_create(
            barter_interest=interest,
            defaults={'user1': interest.requester, 'user2': interest.receiver}
        )

        # Create DealConfirmation record
        DealConfirmation.objects.get_or_create(barter_interest=interest)

        # Create notification for the item owner
        requester_name = request.user.profile.display_name if (hasattr(request.user, 'profile') and request.user.profile.display_name) else request.user.username
        notification_message = f"{requester_name} is interested in your product: {requested_item.title}. Chat with him"
        
        _create_notification(
            user=requested_item.owner, ntype='interest_received',
            title='New Swap Interest',
            message=notification_message,
            interest=interest
        )

        serializer = self.get_serializer(interest)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a barter interest → creates chat room."""
        interest = self.get_object()
        if interest.receiver != request.user:
            return Response({"detail": "Only the receiver can accept."}, status=status.HTTP_403_FORBIDDEN)
        
        if interest.status != 'pending':
            if interest.status in ['accepted', 'completed']:
                room = ChatRoom.objects.filter(barter_interest=interest).first()
                if room:
                    return Response({"detail": "Already accepted.", "chat_room_id": room.id})
            return Response({"detail": f"Cannot accept an interest with status '{interest.status}'."},
                            status=status.HTTP_400_BAD_REQUEST)

        interest.status = 'accepted'
        interest.save()

        # Reserve requested item
        interest.requested_item.status = 'reserved'
        interest.requested_item.save()
        if interest.offered_item:
            interest.offered_item.status = 'reserved'
            interest.offered_item.save()

        # Create chat room
        room, _ = ChatRoom.objects.get_or_create(
            barter_interest=interest,
            defaults={'user1': interest.requester, 'user2': interest.receiver}
        )

        # Create DealConfirmation record
        DealConfirmation.objects.get_or_create(barter_interest=interest)

        # Notify requester
        receiver_name = request.user.profile.display_name if (hasattr(request.user, 'profile') and request.user.profile.display_name) else request.user.username
        _create_notification(
            user=interest.requester, ntype='interest_accepted',
            title='Interest Accepted!',
            message=f"{receiver_name} accepted your swap interest for {interest.requested_item.title}. Chat is now open!",
            interest=interest
        )

        return Response({"detail": "Interest accepted. Chat room created.", "chat_room_id": room.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a barter interest."""
        interest = self.get_object()
        if interest.receiver != request.user:
            return Response({"detail": "Only the receiver can reject."}, status=status.HTTP_403_FORBIDDEN)
        if interest.status != 'pending':
            return Response({"detail": f"Cannot reject an interest with status '{interest.status}'."},
                            status=status.HTTP_400_BAD_REQUEST)

        interest.status = 'rejected'
        interest.save()

        receiver_name = request.user.profile.display_name if hasattr(request.user, 'profile') else request.user.username
        _create_notification(
            user=interest.requester, ntype='interest_rejected',
            title='Interest Declined',
            message=f"{receiver_name} declined your swap interest for {interest.requested_item.title}.",
            interest=interest
        )

        return Response({"detail": "Interest rejected."})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Step 2: In-app notifications."""
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"detail": "Marked as read."})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})


class ChatRoomViewSet(viewsets.ReadOnlyModelViewSet):
    """Step 4: Chat rooms list."""
    serializer_class = ChatRoomSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(Q(user1=user) | Q(user2=user)).order_by('-created_at')

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a chat room (polling endpoint)."""
        room = self.get_object()
        if not room.is_participant(request.user):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        # Mark messages from other user as read
        room.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)

        msgs = room.messages.all().order_by('created_at')
        serializer = RoomChatMessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a chat room (supports text + image)."""
        room = self.get_object()
        if not room.is_participant(request.user):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        message_text = request.data.get('message', '').strip()
        media_file = request.FILES.get('media', None)

        if not message_text and not media_file:
            return Response({"detail": "Message or media is required."}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(
            room=room, sender=request.user,
            message=message_text, media=media_file
        )

        serializer = RoomChatMessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def confirmation_status(self, request, pk=None):
        """Get deal confirmation status for a chat room."""
        room = self.get_object()
        if not room.is_participant(request.user):
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
        if not room.is_participant(request.user):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        interest = room.barter_interest
        if interest.status != 'accepted':
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
        _create_notification(
            user=other_user, ntype='deal_requested',
            title='Deal Confirmation Requested',
            message=f"{requester_name} has requested to finalize the barter deal.",
            interest=interest
        )

        return Response({"detail": "Confirmation request sent.", "request_count": current_count + 1})

    @action(detail=True, methods=['post'])
    def respond_confirmation(self, request, pk=None):
        """Step 5: Respond to deal confirmation (accept/decline)."""
        room = self.get_object()
        if not room.is_participant(request.user):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        action_type = request.data.get('action')  # 'accept' or 'decline'
        if action_type not in ('accept', 'decline'):
            return Response({"detail": "Action must be 'accept' or 'decline'."}, status=status.HTTP_400_BAD_REQUEST)

        interest = room.barter_interest
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

                # Award trust & points to both users (Steps 7 & 8)
                for u in [interest.requester, interest.receiver]:
                    profile, _ = UserProfile.objects.get_or_create(user=u)
                    profile.adjust_trust(5)   # +5 trust for completed barter
                    profile.add_points(50)    # +50 reward points

                # Notify both users
                for u in [interest.requester, interest.receiver]:
                    _create_notification(
                        user=u, ntype='deal_completed',
                        title='Barter Completed! 🎉',
                        message=f"Your barter deal has been finalized. +5 Trust, +50 Points awarded!",
                        interest=interest
                    )

                return Response({"detail": "Deal completed! Both parties confirmed.", "status": "completed"})

            return Response({"detail": "Your confirmation recorded. Waiting for the other party."})

        else:  # decline
            # Penalize trust for spam rejection
            requester_profile, _ = UserProfile.objects.get_or_create(user=request.user)
            # Don't penalize the decliner, just reset the request
            other_user = interest.requester if not is_user1 else interest.receiver
            other_profile, _ = UserProfile.objects.get_or_create(user=other_user)
            other_profile.adjust_trust(-1)  # -1 trust for rejected confirmation spam

            # Reset confirmation for the requester
            if is_user1:
                dc.user2_confirmed = False  # Reset other's state if they re-request
            else:
                dc.user1_confirmed = False
            dc.save()

            return Response({"detail": "Confirmation declined."})
