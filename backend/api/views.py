# pyrefly: ignore [missing-import]
from rest_framework import viewsets, generics, permissions, filters
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db.models import Count
from datetime import timedelta
from .models import BarterItem, Category, BarterOffer, ChatMessage, UserReview, UserProfile, TradeTransaction
from .serializers import (
    BarterItemSerializer, CategorySerializer, BarterOfferSerializer,
    ChatMessageSerializer, UserReviewSerializer, UserSerializer, UserProfileSerializer,
    TradeTransactionSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve categories (read-only for all users)."""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)


class BarterItemViewSet(viewsets.ModelViewSet):
    """Full CRUD for barter items. List/retrieve is public; create/update/delete requires auth."""
    queryset = BarterItem.objects.all().order_by('-created_at')
    serializer_class = BarterItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'offering', 'wanting', 'location']
    ordering_fields = ['created_at', 'title']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_items(self, request):
        """Return items belonging to the currently authenticated user."""
        items = BarterItem.objects.filter(owner=request.user).order_by('-created_at')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)




class BarterOfferViewSet(viewsets.ModelViewSet):
    """Manage barter offers. Requires authentication."""
    serializer_class = BarterOfferSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return BarterOffer.objects.filter(
            sender=user
        ) | BarterOffer.objects.filter(receiver=user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def perform_update(self, serializer):
        offer = serializer.save()
        # Automatically generate TradeTransaction if offer is accepted
        if offer.status == 'accepted':
            TradeTransaction.objects.get_or_create(
                offer=offer,
                defaults={
                    'item_1': offer.offered_item,
                    'item_2': offer.requested_item,
                    'user_1': offer.sender,
                    'user_2': offer.receiver,
                }
            )
            # Update the status of both items to 'traded'
            offer.offered_item.status = 'traded'
            offer.offered_item.save()
            offer.requested_item.status = 'traded'
            offer.requested_item.save()

class TradeTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """View completed trades history. Read only."""
    queryset = TradeTransaction.objects.all().order_by('-completed_at')
    serializer_class = TradeTransactionSerializer
    permission_classes = (permissions.IsAuthenticated,)

class ChatMessageViewSet(viewsets.ModelViewSet):
    """Manage chat messages. Requires authentication."""
    serializer_class = ChatMessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return ChatMessage.objects.filter(
            sender=user
        ) | ChatMessage.objects.filter(receiver=user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class UserReviewViewSet(viewsets.ModelViewSet):
    """Manage user reviews. Requires authentication."""
    serializer_class = UserReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserReview.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view of user profiles."""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get or update the current user's profile."""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if request.method == 'PATCH':
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)


class UserStatsView(APIView):
    """Return dashboard stats for the authenticated user."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Count successful (accepted) trades
        successful_trades = TradeTransaction.objects.filter(
            user_1=user
        ).count() + TradeTransaction.objects.filter(
            user_2=user
        ).count()

        # Pending offers count (received)
        pending_offers = BarterOffer.objects.filter(
            receiver=user, status='pending'
        ).count()

        # Unread messages count
        unread_messages = ChatMessage.objects.filter(
            receiver=user, is_read=False
        ).count()

        # Active listings count
        active_listings = BarterItem.objects.filter(
            owner=user, status='active'
        ).count()

        # Saved/wishlist count (items the user has saved — placeholder, 0 for now)
        saved_count = 0

        # Member since date
        member_since = user.date_joined

        # Estimated value saved: assume avg item value of Rs 5000 per trade
        value_saved = successful_trades * 5000

        # Trust score calculation (max 100)
        trust_score = 0
        if user.username:           trust_score += 20   # Profile exists
        if user.email:              trust_score += 20   # Email present (treated as verified)
        if profile.phone_number:    trust_score += 15   # Phone verified
        if profile.is_verified:     trust_score += 20   # ID verified
        trust_score += min(successful_trades * 5, 25)   # Up to 25 pts from trades

        # Trust label
        if trust_score >= 80:   trust_label = 'Excellent'
        elif trust_score >= 60: trust_label = 'Good'
        elif trust_score >= 40: trust_label = 'Fair'
        else:                   trust_label = 'New'

        # Checklist for trust panel
        trust_checklist = [
            {'label': 'Profile Complete', 'done': bool(user.username)},
            {'label': 'Phone Verified',   'done': bool(profile.phone_number)},
            {'label': 'Email Verified',   'done': bool(user.email)},
            {'label': 'ID Verified',      'done': profile.is_verified},
            {'label': f'{successful_trades} Successful Trades', 'done': successful_trades > 0},
        ]

        return Response({
            'trust_score': trust_score,
            'trust_label': trust_label,
            'trust_checklist': trust_checklist,
            'successful_swaps': successful_trades,
            'value_saved': value_saved,
            'member_since': member_since,
            'pending_offers': pending_offers,
            'unread_messages': unread_messages,
            'active_listings': active_listings,
            'saved_count': saved_count,
            'average_rating': profile.average_rating,
            'location': profile.location,
        })


class TrendingSwapsView(APIView):
    """Return the top trending swap pairs from the past 7 days."""
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        since = timezone.now() - timedelta(days=7)

        # Get the most common offering/wanting pair combinations from offers
        trending = (
            BarterOffer.objects
            .filter(created_at__gte=since)
            .values(
                'offered_item__category__name',
                'requested_item__category__name',
                'offered_item__image_url',
                'requested_item__image_url',
            )
            .annotate(offer_count=Count('id'))
            .order_by('-offer_count')[:6]
        )

        # Also get top categories by item count as a fallback
        top_categories = (
            BarterItem.objects
            .filter(status='active')
            .values('category__name')
            .annotate(item_count=Count('id'))
            .order_by('-item_count')[:6]
        )

        return Response({
            'trending_pairs': list(trending),
            'top_categories': list(top_categories),
        })
