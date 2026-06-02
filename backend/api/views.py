from rest_framework import viewsets, generics, permissions, filters, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone
import random
import re
from .models import BarterItem, Category, BarterOffer, ChatMessage, UserReview, UserProfile, OTPVerification
from .serializers import (
    BarterItemSerializer, CategorySerializer, BarterOfferSerializer,
    ChatMessageSerializer, UserReviewSerializer, UserSerializer, UserProfileSerializer
)
from .email_services import send_otp_email


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

        # Check existing user email conflict
        if User.objects.filter(email=email).exists():
            return Response({"email": ["This email is already registered."]}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing username conflict (for individuals)
        if account_type == 'individual':
            if not username:
                return Response({"username": ["Username is required."]}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(username=username).exists():
                return Response({"username": ["This username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)

        # Generate 6-digit numeric OTP
        otp = str(random.randint(100000, 999999))
        otp_hash = make_password(otp)

        # Update or create the verification record, resetting attempts and created_at
        OTPVerification.objects.update_or_create(
            email=email,
            defaults={
                'otp_hash': otp_hash,
                'attempts': 0,
                'created_at': timezone.now()
            }
        )

        # Send the OTP email
        try:
            send_otp_email(email, otp)
        except Exception as e:
            return Response({"detail": "Failed to send email. Please check configuration."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Verification code sent successfully."}, status=status.HTTP_200_OK)


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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get the current user's profile."""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
