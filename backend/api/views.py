# pyrefly: ignore [missing-import]
from rest_framework import viewsets, generics, permissions, filters
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
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

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def smart_matches(self, request, pk=None):
        """
        AI-Based Smart Matching: Finds other items where:
        1. Type matches (Product for Product, Service for Service)
        2. The other user's 'offering' matches your 'wanting'
        3. The other user's 'wanting' matches your 'offering'
        """
        try:
            my_item = self.get_object()
        except BarterItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

        # Rule 1: Type Match (is_service must match)
        matches = BarterItem.objects.filter(
            category__is_service=my_item.category.is_service,
            status='active'
        ).exclude(owner=request.user)

        # Rule 2: Intent Match (Basic Text Similarity using icontains for keywords)
        # In a real heavy AI system we'd use vector embeddings, but this is a solid text-based start.
        my_wants = my_item.wanting.split()
        my_offers = my_item.offering.split()

        # Build a simple scoring list
        scored_matches = []
        for item in matches:
            score = 0
            # If their offering contains any of my want words
            if any(word.lower() in item.offering.lower() for word in my_wants):
                score += 1
            # If their wanting contains any of my offering words
            if any(word.lower() in item.wanting.lower() for word in my_offers):
                score += 1
            
            # Additional score if categories exactly match what we might want
            if score > 0:
                scored_matches.append((score, item))

        # Sort by highest score first
        scored_matches.sort(key=lambda x: x[0], reverse=True)
        
        # Return top 10 matches
        top_items = [item for score, item in scored_matches[:10]]
        serializer = self.get_serializer(top_items, many=True)
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
