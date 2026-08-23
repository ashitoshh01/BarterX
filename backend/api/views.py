from rest_framework import viewsets, generics, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.throttling import AnonRateThrottle
from django.conf import settings
import razorpay
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.db import models, transaction
from django.db.models import Q, Avg, Count, Sum
from django.http import HttpResponse
import random
import re
import requests as http_requests

from .models import (
    BarterItem, BarterItemImage, Category, UserReview,
    UserProfile, OTPVerification, CoinTransaction,
    BarterInterest, Notification, DealConfirmation, Trade, Contract, SavedItem,
    Dispute, DisputeEvidence, WalletTransaction, TradeCoinReservation, ChatUsage, ImageModerationResult, AdminActionLog
)
from .serializers import (
    BarterItemSerializer, BarterItemListSerializer, CategorySerializer,
    UserReviewSerializer, UserSerializer, UserProfileSerializer,
    BarterInterestSerializer, NotificationSerializer,
    DealConfirmationSerializer, BarterItemCompactSerializer, CoinTransactionSerializer,
    ContractSerializer, TradeSerializer, DisputeSerializer, SavedItemSerializer,
    WalletTransactionSerializer, ImageModerationResultSerializer, AdminActionLogSerializer
)
from .email_services import send_otp_email
from chat.services import broadcast_to_group
from .pdf_service import generate_contract_pdf
from .ai_service import get_ai_matches
from .pagination import StandardResultsSetPagination

# ============================================================
# NEW AUTH VIEWS
# ============================================================

class EmailOrUsernameTokenSerializer(TokenObtainPairSerializer):
    """
    Allows login with EITHER email OR username in the 'username' field.
    """
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, '').strip()
        # If it looks like an email, resolve to the Django username
        if '@' in identifier:
            try:
                user_obj = User.objects.get(email=identifier)
                attrs[self.username_field] = user_obj.username
            except User.DoesNotExist:
                pass  # Let the default validator raise the error
        return super().validate(attrs)

# ─── Auth rate throttles ──────────────────────────────────────────────────────

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'

class OTPRateThrottle(AnonRateThrottle):
    scope = 'otp'


class FlexLoginView(TokenObtainPairView):
    """Endpoint: POST /api/login/  — accepts username or email."""
    serializer_class = EmailOrUsernameTokenSerializer
    throttle_classes = [LoginRateThrottle]


class SimpleRegisterView(generics.CreateAPIView):
    """
    POST /api/register/simple/
    Body: { name, username, email, password }
    Creates User + UserProfile in one shot, returns JWT tokens.
    No OTP required — straightforward signup.
    """
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [RegisterRateThrottle]

    def post(self, request, *args, **kwargs):
        data = request.data
        name = data.get('name', '').strip()
        username = data.get('username', '').strip().lower()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validation
        errors = {}
        if not name:
            errors['name'] = 'Full name is required.'
        if not username:
            errors['username'] = 'Username is required.'
        elif not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
            errors['username'] = 'Username must be 3-30 characters (letters, numbers, underscores only).'
        elif User.objects.filter(username=username).exists():
            errors['username'] = 'This username is already taken.'
        if not email or not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            errors['email'] = 'A valid email address is required.'
        elif User.objects.filter(email=email).exists():
            errors['email'] = 'An account with this email already exists.'
        if len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters.'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name,
            )
            UserProfile.objects.filter(user=user).update(
                display_name=name,
                account_type='individual',
                coin_balance=100,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
        }, status=status.HTTP_201_CREATED)


class GoogleOAuthView(generics.GenericAPIView):
    """
    POST /api/auth/google/
    Body: { credential: '<Google id_token>' }
    Verifies the token with Google, creates user if new, returns JWT.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        credential = request.data.get('credential', '')
        if not credential:
            return Response({'detail': 'Google credential is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify with Google tokeninfo endpoint
        try:
            google_resp = http_requests.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={'id_token': credential},
                timeout=5
            )
            google_data = google_resp.json()
        except Exception:
            return Response({'detail': 'Failed to verify Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        if google_resp.status_code != 200 or 'email' not in google_data:
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        email = google_data['email'].lower()
        name = google_data.get('name', email.split('@')[0])
        google_id = google_data.get('sub', '')
        picture = google_data.get('picture', '')

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': self._make_username(email, name),
                    'first_name': name.split(' ')[0],
                    'last_name': ' '.join(name.split(' ')[1:]),
                }
            )
            if created:
                user.set_unusable_password()
                user.save()
                UserProfile.objects.filter(user=user).update(
                    display_name=name,
                    account_type='individual',
                    profile_picture_url=picture,
                    coin_balance=100,
                )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'created': created,
        }, status=status.HTTP_200_OK)

    def _make_username(self, email, name):
        """Generate a unique username from name or email."""
        base = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower().split(' ')[0])
        if not User.objects.filter(username=base).exists():
            return base
        # Try email prefix
        base2 = re.sub(r'[^a-zA-Z0-9_]', '_', email.split('@')[0])
        if not User.objects.filter(username=base2).exists():
            return base2
        # Add random suffix
        for _ in range(10):
            candidate = f"{base2}_{random.randint(10, 9999)}"
            if not User.objects.filter(username=candidate).exists():
                return candidate
        return f"user_{random.randint(10000, 99999)}"


# ============================================================
# EXISTING VIEWS (preserved)
# ============================================================

class SendOTPView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [OTPRateThrottle]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        username = request.data.get('username', '').strip().lower()

        if not email:
            return Response({"email": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            return Response({"email": "Please enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"email": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if username:
            if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
                return Response({"username": "Username must be 3-30 characters (letters, numbers, underscores)."}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(username=username).exists():
                return Response({"username": "This username is already taken."}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        otp_hash = make_password(otp)

        OTPVerification.objects.update_or_create(
            email=email,
            defaults={'otp_hash': otp_hash, 'attempts': 0, 'created_at': timezone.now()}
        )

        success, detail, dev_otp = send_otp_email(email, otp)
        if not success:
            return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

        resp_data = {"message": "Verification OTP sent to email successfully."}
        if dev_otp:
            resp_data["dev_otp"] = dev_otp
        return Response(resp_data, status=status.HTTP_200_OK)


class VerifyOTPAndRegisterView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        data = request.data
        name = data.get('name', '').strip()
        username = data.get('username', '').strip().lower()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        otp = str(data.get('otp', '')).strip()

        # Validation
        errors = {}
        if not name:
            errors['name'] = 'Full name is required.'
        if not username:
            errors['username'] = 'Username is required.'
        elif not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
            errors['username'] = 'Username must be 3-30 characters (letters, numbers, underscores).'
        elif User.objects.filter(username=username).exists():
            errors['username'] = 'This username is already taken.'

        if not email or not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            errors['email'] = 'A valid email address is required.'
        elif User.objects.filter(email=email).exists():
            errors['email'] = 'An account with this email already exists.'

        if len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters.'

        if not otp or len(otp) != 6 or not otp.isdigit():
            errors['otp'] = 'A valid 6-digit OTP is required.'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve OTP record
        try:
            otp_record = OTPVerification.objects.get(email=email)
        except OTPVerification.DoesNotExist:
            return Response({'otp': 'No OTP requested for this email. Please request a code first.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired():
            return Response({'otp': 'OTP code has expired (valid for 5 mins). Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.attempts >= 5:
            return Response({'otp': 'Too many failed attempts. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            return Response({'otp': 'Invalid verification code. Please check your email.'}, status=status.HTTP_400_BAD_REQUEST)

        # Complete Registration
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name,
            )
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.display_name = name
            profile.account_type = 'individual'
            profile.is_verified = False
            profile.trust_score = 20
            profile.coin_balance = 100
            profile.save()
            otp_record.delete()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'message': 'Account created and email verified successfully!',
        }, status=status.HTTP_201_CREATED)
class RequestPasswordResetView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [OTPRateThrottle]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response({"email": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Security: Do not reveal if email exists, just proceed. But we only create OTP if it exists.
        user = User.objects.filter(email=email).first()
        if user:
            otp = str(random.randint(100000, 999999))
            otp_hash = make_password(otp)

            OTPVerification.objects.update_or_create(
                email=email,
                defaults={'otp_hash': otp_hash, 'attempts': 0, 'created_at': timezone.now()}
            )

            send_otp_email(email, otp)
        
        return Response({"message": "If an account with that email exists, we have sent a password reset code."}, status=status.HTTP_200_OK)


class VerifyAndSetNewPasswordView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        otp = str(request.data.get('otp', '')).strip()
        new_password = request.data.get('new_password', '')

        errors = {}
        if not email:
            errors['email'] = 'Email is required.'
        if not otp or len(otp) != 6 or not otp.isdigit():
            errors['otp'] = 'A valid 6-digit OTP is required.'
        if len(new_password) < 8:
            errors['new_password'] = 'Password must be at least 8 characters.'
        elif not re.search(r'[A-Z]', new_password):
            errors['new_password'] = 'Password must contain at least 1 uppercase letter.'
        elif not re.search(r'[a-z]', new_password):
            errors['new_password'] = 'Password must contain at least 1 lowercase letter.'
        elif not re.search(r'\d', new_password):
            errors['new_password'] = 'Password must contain at least 1 numeric digit.'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve OTP record
        try:
            otp_record = OTPVerification.objects.get(email=email)
        except OTPVerification.DoesNotExist:
            return Response({'otp': 'No OTP requested for this email.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired():
            return Response({'otp': 'OTP code has expired (valid for 5 mins). Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.attempts >= 5:
            return Response({'otp': 'Too many failed attempts. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            return Response({'otp': 'Invalid verification code. Please check your email.'}, status=status.HTTP_400_BAD_REQUEST)

        # Valid OTP and new password, set it
        user.set_password(new_password)
        user.save(update_fields=['password'])
        otp_record.delete()

        return Response({"message": "Password has been successfully reset."}, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from django.core.cache import cache
        return cache.get_or_set('categories', lambda: list(Category.objects.all().order_by('name')), 3600)

class BarterItemViewSet(viewsets.ModelViewSet):
    serializer_class = BarterItemSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'offering', 'wanting', 'location']
    ordering_fields = ['created_at', 'title']

    def get_serializer_class(self):
        if self.action == 'list':
            return BarterItemListSerializer
        return BarterItemSerializer

    def list(self, request, *args, **kwargs):
        # We only personalize the main feed (i.e. no search/filter parameters are present)
        is_search = any(param in request.query_params for param in [
            'q', 'search', 'category', 'condition', 'location', 'item_type', 'valuation_min', 'valuation_max'
        ])
        
        if request.user.is_authenticated and not is_search:
            from django.core.cache import cache
            from .tasks import refresh_user_recommendations
            
            cached_ids = cache.get(f"recs:{request.user.id}")
            if cached_ids:
                items_qs = BarterItem.objects.select_related('owner__profile', 'category')\
                    .prefetch_related('additional_images')\
                    .filter(id__in=cached_ids)
                
                # Fetch into python list to preserve cached ranking order
                items_dict = {i.id: i for i in items_qs}
                items = [items_dict[pk] for pk in cached_ids if pk in items_dict]
                
                # Apply light re-ranking on top of the cached list for anything that 
                # changes faster than the 30-min cache TTL (e.g. re-check proximity)
                from .recommendations import proximity_score
                items.sort(key=lambda i: cached_ids.index(i.id) - 10 * proximity_score(request.user, i))
                
                page = self.paginate_queryset(items)
                if page is not None:
                    serializer = self.get_serializer(page, many=True)
                    return self.get_paginated_response(serializer.data)
                    
                serializer = self.get_serializer(items, many=True)
                return Response(serializer.data)
            else:
                # Cache miss — trigger a background refresh and fall back to default feed for now
                refresh_user_recommendations.delay(request.user.id)
                # Let it fall through to super().list() for the default feed

        # Fallback to default behavior for anonymous users or search queries
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        from django.utils import timezone
        from django.db import models
        from django.db.models import Count
        
        queryset = BarterItem.objects.select_related('owner__profile', 'category').prefetch_related('additional_images').annotate(
            annotated_proposal_count=Count('interest_requests', distinct=True) + Count('interest_offers', distinct=True),
            annotated_chat_count=Count('conversations', distinct=True)
        )
        # Exclude archived items from general public feed, but let owners see their own archived listings.
        if self.request.user.is_authenticated:
            queryset = queryset.filter(
                models.Q(owner=self.request.user) | ~models.Q(status='archived')
            )
        # Query parameter filters
        search_query = self.request.query_params.get('q') or self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(description__icontains=search_query) |
                models.Q(offering__icontains=search_query) |
                models.Q(wanting__icontains=search_query) |
                models.Q(category__name__icontains=search_query)
            )

        category = self.request.query_params.get('category')
        if category and category != 'all':
            if str(category).isdigit():
                queryset = queryset.filter(models.Q(category_id=int(category)) | models.Q(category__name__iexact=category))
            else:
                queryset = queryset.filter(models.Q(category__slug__iexact=category) | models.Q(category__name__iexact=category))

        condition = self.request.query_params.get('condition')
        if condition and condition != 'all':
            queryset = queryset.filter(condition__iexact=condition)

        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(models.Q(location__icontains=location) | models.Q(city__icontains=location) | models.Q(state__icontains=location))

        # Distance Bounding Box Search
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius')
        if lat and lng:
            try:
                lat = float(lat)
                lng = float(lng)
                radius_km = float(radius) if radius else 50.0
                import math
                lat_delta = radius_km / 111.0
                lng_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
                queryset = queryset.filter(
                    latitude__gte=lat-lat_delta, latitude__lte=lat+lat_delta,
                    longitude__gte=lng-lng_delta, longitude__lte=lng+lng_delta
                )
            except Exception:
                pass

        item_type = self.request.query_params.get('item_type')
        if item_type and item_type.lower() != 'all':
            if item_type.lower() == 'service':
                queryset = queryset.filter(category__is_service=True)
            elif item_type.lower() in ['product', 'item', 'goods']:
                queryset = queryset.filter(category__is_service=False)

        val_min = self.request.query_params.get('valuation_min')
        if val_min:
            try:
                queryset = queryset.filter(purchase_price__gte=float(val_min))
            except ValueError:
                pass

        val_max = self.request.query_params.get('valuation_max')
        if val_max:
            try:
                queryset = queryset.filter(purchase_price__lte=float(val_max))
            except ValueError:
                pass

        return queryset.order_by('-is_boosted', '-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby', 'history']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def history(self, request, pk=None):
        """Retrieve paginated history logs for a specific barter item."""
        instance = self.get_object()
        logs = instance.history_logs.all().order_by('-created_at')
        page = self.paginate_queryset(logs)
        from .serializers import ListingHistorySerializer
        
        if page is not None:
            serializer = ListingHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ListingHistorySerializer(logs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        viewed_session_key = f'viewed_item_{instance.id}'
        if not request.session.get(viewed_session_key):
            from django.db.models import F
            BarterItem.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
            # Manually increment the in-memory object so the serializer below returns the fresh value
            instance.views_count += 1
            request.session[viewed_session_key] = True
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def log_view(self, request, pk=None):
        instance = self.get_object()
        from .services import log_interaction
        log_interaction(request.user, instance, 'view')
        return Response({"detail": "View logged."})

    def create(self, request, *args, **kwargs):
        # We need minimum 1 image. They can be passed as a list under 'images' or individually as files.
        images = request.FILES.getlist('images')
        
        # If frontend sends them as individual inputs like image1, image2, image3, collect them:
        if len(images) < 1:
            collected_images = []
            for key in sorted(request.FILES.keys()):
                if key.startswith('image'):
                    collected_images.extend(request.FILES.getlist(key))
            if len(collected_images) >= 1:
                images = collected_images

        if len(images) < 1:
            return Response(
                {"detail": "You must upload at least one image of the product."},
                status=status.HTTP_400_BAD_REQUEST
            )

        max_size = 10 * 1024 * 1024 # 10MB
        for img in images:
            if not img.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return Response(
                    {"images": ["Unsupported image format. Only JPG, PNG, and WEBP are supported."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if img.size > max_size:
                return Response(
                    {"images": ["File too large. Maximum size is 10MB per image."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Run Image Content Moderation checks
        from .moderation_service import moderate_uploaded_image
        for img in images:
            is_allowed, mod_status, confidence, reason, _ = moderate_uploaded_image(request.user, img)
            if not is_allowed:
                return Response(
                    {"images": [f"This image could not be uploaded because it may violate our content guidelines: {reason}"]},
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
            
        # Log CREATED history
        from .models import ListingHistory
        ListingHistory.objects.create(
            listing=item,
            performed_by=request.user,
            action='CREATED',
            metadata={"title": item.title}
        )
            
        return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_items(self, request):
        items = BarterItem.objects.filter(owner=request.user).order_by('-created_at')
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        """
        GET /api/items/nearby/?latitude=18.5204&longitude=73.8567&radius=10
        Returns active listings within radius_km of coordinates, sorted nearest -> farthest.
        Uses authenticated user profile coordinates if latitude/longitude are omitted.
        """
        from .distance_service import haversine_distance_km, format_distance

        lat_param = request.query_params.get('latitude')
        lng_param = request.query_params.get('longitude')
        radius_param = request.query_params.get('radius', 10.0)

        user_lat = None
        user_lng = None

        # Resolve user coordinates: query params OR user profile coordinates
        if lat_param is not None and lng_param is not None and lat_param != '' and lng_param != '':
            try:
                user_lat = float(lat_param)
                user_lng = float(lng_param)
            except (ValueError, TypeError):
                return Response(
                    {"detail": "Latitude and longitude must be valid floating point numbers."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif request.user.is_authenticated:
            profile = getattr(request.user, 'profile', None)
            if profile and profile.latitude is not None and profile.longitude is not None:
                user_lat = float(profile.latitude)
                user_lng = float(profile.longitude)

        if user_lat is None or user_lng is None:
            return Response(
                {"detail": "Location is not available. Please set your location first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate coordinate ranges
        if user_lat < -90.0 or user_lat > 90.0:
            return Response(
                {"detail": "Latitude must be between -90 and 90."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if user_lng < -180.0 or user_lng > 180.0:
            return Response(
                {"detail": "Longitude must be between -180 and 180."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate radius
        try:
            radius_km = float(radius_param)
        except (ValueError, TypeError):
            return Response(
                {"detail": "Radius must be a valid number between 1 and 100 km."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if radius_km < 1.0 or radius_km > 100.0:
            return Response(
                {"detail": "Radius must be between 1 and 100 km."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Base queryset with standard filters (category, search, condition, status, etc.)
        queryset = self.get_queryset().filter(latitude__isnull=False, longitude__isnull=False)

        # SQL-level bounding-box pre-filter
        import math
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * math.cos(math.radians(user_lat))) if math.cos(math.radians(user_lat)) != 0 else 0
        queryset = queryset.filter(
            latitude__gte=user_lat - lat_delta,
            latitude__lte=user_lat + lat_delta,
            longitude__gte=user_lng - lng_delta,
            longitude__lte=user_lng + lng_delta
        )

        matching_items = []
        for item in queryset:
            if item.latitude is None or item.longitude is None:
                continue
            try:
                dist = haversine_distance_km(user_lat, user_lng, item.latitude, item.longitude)
                if dist <= radius_km:
                    item.distance_km = dist
                    item.distance_formatted = format_distance(dist)
                    matching_items.append(item)
            except Exception:
                continue

        # Sort nearest to farthest while prioritizing boosted items
        matching_items.sort(key=lambda x: (not getattr(x, 'is_boosted', False), getattr(x, 'distance_km', 999999.0)))

        serializer = self.get_serializer(matching_items, many=True)
        return Response({
            "count": len(matching_items),
            "radius_km": radius_km,
            "user_latitude": user_lat,
            "user_longitude": user_lng,
            "results": serializer.data
        }, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        import json
        from django.utils import timezone
        from .models import BarterItemImage, ListingHistory
        from django.conf import settings
        
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to modify this listing."}, status=status.HTTP_403_FORBIDDEN)
            
        old_status = instance.status
        if old_status == 'traded':
            return Response({"detail": "Completed listings are read-only and cannot be modified."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get old images set to track additions and removals
        old_images = list(instance.additional_images.all())
        old_image_urls = [request.build_absolute_uri(img.image.url) for img in old_images]
        if instance.image:
            old_image_urls.insert(0, request.build_absolute_uri(instance.image.url))
            
        # Parse image order
        image_order = request.data.get('image_order', '[]')
        if isinstance(image_order, str):
            try:
                image_order = json.loads(image_order)
            except ValueError:
                image_order = []
                
        new_files = request.FILES.getlist('new_images')
        
        # Enforce image size/format checks on new uploads
        max_size = 10 * 1024 * 1024 # 10MB
        for img in new_files:
            if not img.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return Response(
                    {"images": ["Unsupported image format. Only JPG, PNG, and WEBP are supported."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if img.size > max_size:
                return Response(
                    {"images": ["File too large. Maximum size is 10MB per image."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Run Image Content Moderation checks on new files
        from .moderation_service import moderate_uploaded_image
        for img in new_files:
            is_allowed, mod_status, confidence, reason, _ = moderate_uploaded_image(request.user, img, item=instance)
            if not is_allowed:
                return Response(
                    {"images": [f"This image could not be uploaded because it may violate our content guidelines: {reason}"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Build ordered list of new and retained images
        ordered_images = []
        for key in image_order:
            if key.startswith('retained:'):
                url = key.split('retained:', 1)[1]
                ordered_images.append({'type': 'retained', 'value': url})
            elif key.startswith('new:'):
                try:
                    idx = int(key.split('new:', 1)[1])
                    if idx < len(new_files):
                        ordered_images.append({'type': 'new', 'value': new_files[idx]})
                except ValueError:
                    pass
                    
        # Helper to convert absolute URL back to relative path for ImageField
        def get_relative_media_path(url):
            if not url:
                return ""
            media_url = settings.MEDIA_URL
            if media_url in url:
                return url.split(media_url, 1)[1]
            return url
            
        # Update listing fields
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Save primary listing details
        updated_item = serializer.save()
        
        # Handle images if image_order is provided
        if ordered_images:
            # Enforce 1-5 image limit
            if len(ordered_images) < 1 or len(ordered_images) > 5:
                return Response({"images": ["Listing must have between 1 and 5 images."]}, status=status.HTTP_400_BAD_REQUEST)
                
            # Set the cover image (the first one in ordered_images)
            cover = ordered_images[0]
            if cover['type'] == 'retained':
                updated_item.image = get_relative_media_path(cover['value'])
            elif cover['type'] == 'new':
                updated_item.image = cover['value']
            updated_item.save(update_fields=['image'])
            
            # Identify which existing additional images to retain
            retained_rel_paths = []
            for img in ordered_images[1:]:
                if img['type'] == 'retained':
                    retained_rel_paths.append(get_relative_media_path(img['value']))
                    
            # Delete any existing additional image not in the retained list
            for img_obj in instance.additional_images.all():
                if img_obj.image.name not in retained_rel_paths:
                    img_obj.delete()
                    
            # Re-create/save other additional images in order
            for img in ordered_images[1:]:
                if img['type'] == 'retained':
                    # If it already exists, keep it. If not, recreate it
                    rel_path = get_relative_media_path(img['value'])
                    if not instance.additional_images.filter(image=rel_path).exists():
                        BarterItemImage.objects.create(item=updated_item, image=rel_path)
                elif img['type'] == 'new':
                    BarterItemImage.objects.create(item=updated_item, image=img['value'])
                    
        # History Action determination
        new_status = updated_item.status
        action = 'UPDATED'
        if old_status != new_status:
            if new_status == 'reserved':
                action = 'RESERVED'
            elif new_status == 'traded':
                action = 'COMPLETED'
            elif new_status == 'archived':
                action = 'ARCHIVED'
            elif old_status == 'archived' and new_status == 'active':
                action = 'RESTORED'
                
        # Write history logs
        ListingHistory.objects.create(
            listing=updated_item,
            performed_by=request.user,
            action=action,
            metadata={"old_status": old_status, "new_status": new_status}
        )
        
        # Track image additions/removals
        new_images = list(updated_item.additional_images.all())
        new_image_urls = [request.build_absolute_uri(img.image.url) for img in new_images]
        if updated_item.image:
            new_image_urls.insert(0, request.build_absolute_uri(updated_item.image.url))
            
        added_count = 0
        removed_count = 0
        for url in new_image_urls:
            if url not in old_image_urls:
                added_count += 1
        for url in old_image_urls:
            if url not in new_image_urls:
                removed_count += 1
                
        if added_count > 0:
            ListingHistory.objects.create(
                listing=updated_item, performed_by=request.user, action='IMAGE_ADDED',
                metadata={"count": added_count}
            )
        if removed_count > 0:
            ListingHistory.objects.create(
                listing=updated_item, performed_by=request.user, action='IMAGE_REMOVED',
                metadata={"count": removed_count}
            )
            
        return Response(self.get_serializer(updated_item).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to delete this listing."}, status=status.HTTP_403_FORBIDDEN)
            
        # Log DELETE history log before deleting the object
        from .models import ListingHistory
        ListingHistory.objects.create(
            listing=instance,
            performed_by=request.user,
            action='DELETE',
            metadata={"title": instance.title}
        )
        
        # Delete related images from disk / database first
        instance.additional_images.all().delete()
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def boost(self, request, pk=None):
        from django.conf import settings
        from django.utils import timezone
        from datetime import timedelta
        
        instance = self.get_object()
        
        # Check permissions
        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to boost this listing."}, status=status.HTTP_403_FORBIDDEN)
            
        cost = getattr(settings, 'BOOST_COST', 100)
        duration = getattr(settings, 'BOOST_DURATION_DAYS', 7)
        
        with transaction.atomic():
            try:
                profile = UserProfile.objects.select_for_update().get(user=request.user)
            except UserProfile.DoesNotExist:
                return Response({"detail": "User profile not found."}, status=status.HTTP_400_BAD_REQUEST)
                
            if profile.coin_balance < cost:
                return Response({"detail": f"Insufficient coins. Boosting costs {cost} coins."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Deduct coins
            profile.coin_balance -= cost
            profile.save(update_fields=['coin_balance'])
            
            # Boost listing
            instance.is_boosted = True
            instance.boosted_at = timezone.now()
            instance.boost_expires_at = timezone.now() + timedelta(days=duration)
            instance.save(update_fields=['is_boosted', 'boosted_at', 'boost_expires_at'])
            
            # Create history log
            from .models import ListingHistory
            ListingHistory.objects.create(
                listing=instance,
                performed_by=request.user,
                action='BOOSTED',
                metadata={"cost": cost, "duration_days": duration}
            )
        
        return Response({
            "message": "Listing boosted successfully!",
            "new_balance": profile.coin_balance,
            "boost_expires_at": instance.boost_expires_at
        }, status=status.HTTP_200_OK)





# ChatMessageViewSet is replaced by ConversationViewSet actions.


class UserReviewViewSet(viewsets.ModelViewSet):
    serializer_class = UserReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserReview.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        target_user = review.reviewed_user
        profile = getattr(target_user, 'profile', None)
        if profile:
            all_reviews = UserReview.objects.filter(reviewed_user=target_user)
            avg_rating = all_reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
            profile.average_rating = round(float(avg_rating), 2)
            if review.rating >= 4:
                profile.trust_score = max(0, min(100, profile.trust_score + 5))
            profile.save(update_fields=['average_rating', 'trust_score'])


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_email_change(self, request):
        new_email = request.data.get('new_email', '').strip().lower()
        if not new_email or not re.match(r'[^@]+@[^@]+\.[^@]+', new_email):
            return Response({"new_email": ["A valid email address is required."]}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=new_email).exists():
            return Response({"new_email": ["This email is already in use by another account."]}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        otp_hash = make_password(otp)

        OTPVerification.objects.update_or_create(
            email=new_email,
            defaults={'otp_hash': otp_hash, 'attempts': 0, 'created_at': timezone.now()}
        )
        send_otp_email(new_email, otp)
        
        return Response({"message": "Verification OTP sent to your new email."})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_email_change(self, request):
        new_email = request.data.get('new_email', '').strip().lower()
        otp = str(request.data.get('otp', '')).strip()

        if not new_email or not otp:
            return Response({"detail": "New email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = OTPVerification.objects.get(email=new_email)
        except OTPVerification.DoesNotExist:
            return Response({'otp': 'No OTP requested for this email.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired():
            return Response({'otp': 'OTP code has expired (valid for 5 mins).'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.attempts >= 5:
            return Response({'otp': 'Too many failed attempts.'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            return Response({'otp': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update the user's email
        user = request.user
        user.email = new_email
        user.save(update_fields=['email'])
        
        # Clean up
        otp_record.delete()

        return Response({"message": "Email updated successfully.", "new_email": new_email})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def nearby_traders(self, request):
        from .distance_service import haversine_distance_km
        import math
        
        radius_km = float(request.query_params.get('radius', 50.0))
        try:
            profile = request.user.profile
            user_lat = float(profile.latitude)
            user_lng = float(profile.longitude)
        except (AttributeError, TypeError, ValueError):
            user_lat, user_lng = None, None

        # Get active items from other users
        active_items = BarterItem.objects.exclude(owner=request.user).filter(status='active').select_related('owner__profile')
        
        # SQL-level bounding-box pre-filter
        if user_lat is not None and user_lng is not None:
            lat_delta = radius_km / 111.0
            lng_delta = radius_km / (111.0 * math.cos(math.radians(user_lat))) if math.cos(math.radians(user_lat)) != 0 else 0
            active_items = active_items.filter(
                latitude__gte=user_lat - lat_delta,
                latitude__lte=user_lat + lat_delta,
                longitude__gte=user_lng - lng_delta,
                longitude__lte=user_lng + lng_delta
            )

        trader_map = {}
        for item in active_items:
            # Precise haversine filter in Python
            if user_lat is not None and user_lng is not None and item.latitude is not None and item.longitude is not None:
                try:
                    if haversine_distance_km(user_lat, user_lng, item.latitude, item.longitude) > radius_km:
                        continue
                except Exception:
                    continue

            owner = item.owner
            if owner.id not in trader_map:
                try:
                    profile = owner.profile
                except Exception:
                    profile = None

                owner_loc = item.location or (profile.location if profile else "") or ""
                
                trader_map[owner.id] = {
                    "id": owner.id,
                    "name": (profile.display_name if profile else None) or owner.username,
                    "username": owner.username,
                    "avatar": profile.profile_picture_url if profile else None,
                    "location": owner_loc,
                    "average_rating": profile.average_rating if profile else 0.0,
                    "items": []
                }
                
            trader_map[owner.id]["items"].append({
                "id": item.id,
                "image": item.image_url or (item.image.url if item.image else None)
            })
            
        traders_list = list(trader_map.values())
        return Response(traders_list[:10])

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        # Calculate dynamic XP & Level
        completed_trades_count = Trade.objects.filter(Q(requester=request.user) | Q(receiver=request.user), status='completed').count()
        positive_reviews_count = UserReview.objects.filter(reviewed_user=request.user, rating__gte=4).count()
        created_listings_count = BarterItem.objects.filter(owner=request.user).count()

        xp = (completed_trades_count * 100) + (positive_reviews_count * 50) + (created_listings_count * 25)
        level = (xp // 200) + 1

        data = UserProfileSerializer(profile).data
        data['xp'] = xp
        data['level'] = level
        return Response(data)

    @action(detail=False, methods=['put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        display_name = request.data.get('display_name', profile.display_name)
        if display_name and len(display_name) > 50:
            return Response({"display_name": ["Display name cannot exceed 50 characters."]}, status=status.HTTP_400_BAD_REQUEST)
            
        max_size = 10 * 1024 * 1024 # 10MB
        if 'profile_picture' in request.FILES:
            profile_pic = request.FILES['profile_picture']
            if not profile_pic.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return Response({"avatar": ["Avatar must be JPG or PNG."]}, status=status.HTTP_400_BAD_REQUEST)
            if profile_pic.size > max_size:
                return Response({"avatar": ["File too large. Maximum size is 10MB."]}, status=status.HTTP_400_BAD_REQUEST)
                
        if 'cover_picture' in request.FILES:
            cover_pic = request.FILES['cover_picture']
            if not cover_pic.name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return Response({"cover_picture": ["Cover image must be JPG or PNG."]}, status=status.HTTP_400_BAD_REQUEST)
            if cover_pic.size > max_size:
                return Response({"cover_picture": ["File too large. Maximum size is 10MB."]}, status=status.HTTP_400_BAD_REQUEST)

        if 'resume' in request.FILES:
            resume_file = request.FILES['resume']
            if not resume_file.name.lower().endswith('.pdf'):
                return Response({"resume": ["Resume must be a PDF file."]}, status=status.HTTP_400_BAD_REQUEST)
            if resume_file.size > max_size:
                return Response({"resume": ["File too large. Maximum size is 10MB."]}, status=status.HTTP_400_BAD_REQUEST)

        profile.display_name = display_name
        profile.bio = request.data.get('bio', profile.bio)
        profile.city = request.data.get('city', profile.city)
        profile.state = request.data.get('state', profile.state)
        profile.country = request.data.get('country', profile.country)
        profile.location_name = request.data.get('location_name', profile.location_name)
        profile.profession = request.data.get('profession', profile.profession)

        latitude = request.data.get('latitude')
        if latitude is not None and latitude != '':
            try:
                lat_val = float(latitude)
                if lat_val < -90.0 or lat_val > 90.0:
                    return Response({"latitude": ["Latitude must be between -90 and 90."]}, status=status.HTTP_400_BAD_REQUEST)
                profile.latitude = lat_val
            except (ValueError, TypeError):
                return Response({"latitude": ["Invalid latitude format."]}, status=status.HTTP_400_BAD_REQUEST)
        elif 'latitude' in request.data and request.data.get('latitude') is None:
            profile.latitude = None

        longitude = request.data.get('longitude')
        if longitude is not None and longitude != '':
            try:
                lng_val = float(longitude)
                if lng_val < -180.0 or lng_val > 180.0:
                    return Response({"longitude": ["Longitude must be between -180 and 180."]}, status=status.HTTP_400_BAD_REQUEST)
                profile.longitude = lng_val
            except (ValueError, TypeError):
                return Response({"longitude": ["Invalid longitude format."]}, status=status.HTTP_400_BAD_REQUEST)
        elif 'longitude' in request.data and request.data.get('longitude') is None:
            profile.longitude = None
        
        if profile.location_name:
            profile.location = profile.location_name
        elif profile.city and profile.state:
            profile.location = f"{profile.city}, {profile.state}"
        elif request.data.get('location'):
            profile.location = request.data.get('location')

        profile.phone_number = request.data.get('phone_number', profile.phone_number)
        profile.profile_picture_url = request.data.get('profile_picture_url', profile.profile_picture_url)
        profile.cover_picture_url = request.data.get('cover_picture_url', profile.cover_picture_url)
        
        if 'profile_picture' in request.FILES:
            from django.core.files.storage import default_storage
            profile_pic = request.FILES['profile_picture']
            file_name = default_storage.save(f'profile_pics/{request.user.id}_{profile_pic.name}', profile_pic)
            profile.profile_picture_url = request.build_absolute_uri(default_storage.url(file_name))

        
        # Calculate updated trust score dynamically
        completed_interests = BarterInterest.objects.filter(
            Q(requester=request.user) | Q(receiver=request.user),
            status='completed'
        ).count()
        
        # Simple completion rule: Name + City/State/Location + Profession
        has_location = bool(profile.city or profile.state or profile.location)
        profile_complete = bool(profile.display_name and has_location and profile.profession)
        
        score = 20
        if profile_complete:
            score = 60
            
        if profile.is_verified:
            score += 20
        score += min(20, completed_interests * 5)
        score += min(20, int(profile.average_rating * 4))
        
        profile.trust_score = min(100, score)
        profile.save(update_fields=[
            'display_name', 'bio', 'city', 'state', 'country', 'location', 'location_name',
            'profession', 'latitude', 'longitude', 'phone_number', 'profile_picture_url',
            'cover_picture_url', 'trust_score'
        ])
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        """Centralized dashboard statistics endpoint.
        Ensures all metrics are calculated server-side for consistency."""
        from django.core.cache import cache
        user = request.user
        cache_key = f"dashboard_stats:{user.id}"

        def get_stats():
            profile, _ = UserProfile.objects.get_or_create(user=user)

            from datetime import datetime
            now = timezone.now()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            # Combine all BarterInterest counts into a single aggregated query
            from django.db.models import Count, Q
            interest_stats = BarterInterest.objects.filter(
                Q(requester=user) | Q(receiver=user)
            ).aggregate(
                successful=Count('id', filter=Q(status='completed')),
                recent=Count('id', filter=Q(status='completed', updated_at__gte=month_start)),
                pending=Count('id', filter=Q(status__in=['pending', 'accepted']))
            )
            
            successful_swaps = interest_stats['successful'] or 0
            recent_swaps = interest_stats['recent'] or 0
            pending_offers = interest_stats['pending'] or 0

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

            # Unread messages
            from chat.models import Message, Conversation
            unread_messages = Message.objects.filter(
                conversation__in=Conversation.objects.filter(participants=user),
                read_at__isnull=True
            ).exclude(sender=user).count()

            return {
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
            }

        data = cache.get_or_set(cache_key, get_stats, 30)
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def listings(self, request):
        items = BarterItem.objects.filter(owner=request.user).order_by('-created_at')
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(items, request)
        if page is not None:
            serializer = BarterItemSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = BarterItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def completed_trades(self, request):
        trades = Trade.objects.filter(Q(requester=request.user) | Q(receiver=request.user), status='completed')
        serializer = TradeSerializer(trades, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def saved_items(self, request):
        saved = SavedItem.objects.filter(user=request.user)
        serializer = SavedItemSerializer(saved, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def reviews(self, request):
        reviews = UserReview.objects.filter(reviewed_user=request.user)
        serializer = UserReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)


class PurchaseCoinsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        amount = int(request.data.get('amount', 0))
        order_id = request.data.get('order_id')
        payment_id = request.data.get('payment_id')
        signature = request.data.get('signature')
        
        if amount <= 0:
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        if not order_id or not payment_id or not signature:
            return Response({"detail": "Missing payment verification parameters."}, status=status.HTTP_400_BAD_REQUEST)

        razorpay_key = getattr(settings, 'RAZORPAY_KEY_ID', None)
        razorpay_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        
        if not razorpay_key or not razorpay_secret:
            return Response({"detail": "Payment gateway not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
            params_dict = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            client.utility.verify_payment_signature(params_dict)
        except Exception:
            return Response({"detail": "Razorpay Signature Verification Failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Payment successful
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.add_coins(amount)
        
        CoinTransaction.objects.create(
            user=request.user,
            amount=amount,
            transaction_type='purchased',
            description=f"Purchased {amount} coins via Razorpay ({payment_id})"
        )
        
        return Response({"message": f"Successfully purchased {amount} coins.", "new_balance": profile.coin_balance})


class CreateRazorpayOrderView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        amount = int(request.data.get('amount', 0))
        if amount <= 0:
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        # Indian college student pricing packages (₹5 base, with discounts)
        if amount == 50:
            price_inr = 250
        elif amount == 100:
            price_inr = 450
        elif amount == 250:
            price_inr = 1000
        elif amount == 500:
            price_inr = 1750
        else:
            price_inr = amount * 5

        # Check if real Razorpay credentials are set in settings
        razorpay_key = getattr(settings, 'RAZORPAY_KEY_ID', None)
        razorpay_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)

        order_id = f"order_sim_{random.randint(100000, 999999)}"
        is_simulated = True

        if razorpay_key and razorpay_secret:
            try:
                client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
                # Razorpay expects amount in paise (1 INR = 100 paise)
                data = {
                    "amount": price_inr * 100,
                    "currency": "INR",
                    "receipt": f"receipt_coins_{random.randint(1000, 9999)}",
                    "payment_capture": 1
                }
                order = client.order.create(data=data)
                order_id = order["id"]
                is_simulated = False
            except Exception as e:
                # If Razorpay client fails, fallback to simulated in debug
                if not getattr(settings, 'DEBUG', True):
                    return Response({"detail": f"Razorpay API Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create a pending WalletTransaction ledger record
        WalletTransaction.objects.create(
            user=request.user,
            amount=amount,
            transaction_type='PURCHASE',
            status='PENDING',
            reference_id=order_id,
            description=f"Purchase {amount} Barter Coins",
            price_inr=price_inr,
            metadata={"price_inr": price_inr, "is_simulated": is_simulated}
        )

        return Response({
            "order_id": order_id,
            "amount_inr": price_inr,
            "amount_coins": amount,
            "currency": "INR",
            "key_id": razorpay_key or "rzp_test_simulated_key",
            "is_simulated": is_simulated
        }, status=status.HTTP_200_OK)


class VerifyRazorpayPaymentView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        payment_id = request.data.get('payment_id')
        signature = request.data.get('signature')
        amount = int(request.data.get('amount_coins', 0))

        if not order_id or not payment_id or not signature or amount <= 0:
            return Response({"detail": "Missing payment verification parameters."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the pending transaction
        tx = WalletTransaction.objects.filter(
            user=request.user,
            reference_id=order_id,
            transaction_type='PURCHASE',
            status='PENDING'
        ).first()

        if not tx:
            return Response({"detail": "Payment order not found or already verified."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if real Razorpay credentials are set in settings
        razorpay_key = getattr(settings, 'RAZORPAY_KEY_ID', None)
        razorpay_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)

        is_valid = False
        if razorpay_key and razorpay_secret and not order_id.startswith("order_sim_"):
            try:
                client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
                params_dict = {
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                }
                client.utility.verify_payment_signature(params_dict)
                is_valid = True
            except Exception:
                tx.status = 'FAILED'
                tx.save(update_fields=['status'])
                return Response({"detail": "Razorpay Signature Verification Failed."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Simulated check
            if order_id.startswith("order_sim_") or signature == "simulated_razorpay_sig_123456":
                is_valid = True

        if not is_valid:
            tx.status = 'FAILED'
            tx.save(update_fields=['status'])
            return Response({"detail": "Invalid payment transaction signature."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            profile, _ = UserProfile.objects.select_for_update().get_or_create(user=request.user)
            
            # Double check transaction status
            tx_check = WalletTransaction.objects.get(id=tx.id)
            if tx_check.status == 'SUCCESS':
                return Response({"detail": "Payment already processed."}, status=status.HTTP_400_BAD_REQUEST)

            # Credit coins and stats
            profile.coin_balance += amount
            profile.total_coins_purchased += amount
            profile.save(update_fields=['coin_balance', 'total_coins_purchased'])

            # Mark transaction as success
            tx.status = 'SUCCESS'
            tx.metadata.update({"razorpay_payment_id": payment_id})
            tx.save(update_fields=['status', 'metadata'])

            # Record legacy transaction
            CoinTransaction.objects.create(
                user=request.user,
                amount=amount,
                transaction_type='purchased',
                description=f"Purchased {amount} coins via Razorpay ({payment_id})"
            )

        # Broadcast wallet update
        from .coin_service import broadcast_wallet_update
        broadcast_wallet_update(request.user)

        return Response({
            "message": f"Successfully verified payment. {amount} coins credited.",
            "new_balance": profile.coin_balance
        }, status=status.HTTP_200_OK)

class RedeemCoinsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        amount = int(request.data.get('amount', 0))
        description = request.data.get('description', 'Redeemed coins')
        
        if amount <= 0:
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            profile, _ = UserProfile.objects.select_for_update().get_or_create(user=request.user)
            
            if profile.coin_balance < amount:
                return Response({"detail": "Insufficient coin balance."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Deduct coins
            profile.coin_balance -= amount
            profile.save()
            
            CoinTransaction.objects.create(
                user=request.user,
                amount=amount,
                transaction_type='spent',
                description=description
            )
        
        return Response({"message": f"Successfully redeemed {amount} coins.", "new_balance": profile.coin_balance})

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
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        return BarterInterest.objects.filter(Q(requester=user) | Q(receiver=user))

    def create(self, request, *args, **kwargs):
        """Create a proposal in pending state and leave listings active until accepted."""
        requested_item_id = request.data.get('requested_item')
        offered_item_id = request.data.get('offered_item')
        proposal_message = (request.data.get('proposal_message') or '').strip()
        try:
            coins_offered = int(request.data.get('coins_offered', 0) or 0)
        except (ValueError, TypeError):
            coins_offered = 0

        if not requested_item_id:
            return Response({"detail": "requested_item is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            requested_item = BarterItem.objects.get(id=requested_item_id)
        except BarterItem.DoesNotExist:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if requested_item.owner == request.user:
            return Response({"detail": "Cannot request your own item."}, status=status.HTTP_400_BAD_REQUEST)
        if requested_item.status not in {'active', 'reserved'}:
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
            if offered_item.status not in {'active', 'reserved'}:
                return Response({"detail": "Offered item is not available."}, status=status.HTTP_400_BAD_REQUEST)

        # Validation: proposal must have either offered_item OR positive coins_offered
        if not offered_item and coins_offered <= 0:
            return Response({"detail": "A proposal must include either an offered item or a positive coin offer (or both)."}, status=status.HTTP_400_BAD_REQUEST)

        duplicate_query = BarterInterest.objects.filter(
            requester=request.user,
            requested_item=requested_item,
            offered_item=offered_item,
            status__in=['pending', 'negotiating', 'countered', 'accepted']
        )
        if duplicate_query.exists():
            return Response({"detail": "You already have an active proposal for this swap."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate or use provided coins_offered
        if offered_item:
            req_price = float(requested_item.purchase_price or 0)
            off_price = float(offered_item.purchase_price or 0)
            coins_val = int((req_price - off_price) / 100)
            if coins_offered > 0:
                coins_val = coins_offered
        else:
            coins_val = coins_offered

        if coins_val > 0:
            profile = getattr(request.user, 'profile', None)
            if not profile or profile.coin_balance < coins_val:
                return Response({"detail": f"Insufficient Barter Coins balance. You need {coins_val} coins to make this proposal, but you only have {profile.coin_balance if profile else 0} coins."}, status=status.HTTP_400_BAD_REQUEST)
        elif coins_val < 0:
            receiver_profile = getattr(requested_item.owner, 'profile', None)
            if not receiver_profile or receiver_profile.coin_balance < abs(coins_val):
                return Response({"detail": f"The other trader has insufficient coin balance. They need {abs(coins_val)} coins to bridge the value gap, but they only have {receiver_profile.coin_balance if receiver_profile else 0} coins."}, status=status.HTTP_400_BAD_REQUEST)

        interest = BarterInterest.objects.create(
            requester=request.user,
            receiver=requested_item.owner,
            requested_item=requested_item,
            offered_item=offered_item,
            status='pending',
            proposal_message=proposal_message,
            coins_offered=coins_val,
        )

        from .services import log_interaction
        log_interaction(request.user, requested_item, 'offer_sent')

        from chat.models import Conversation
        room, room_created = Conversation.objects.get_or_create(
            barter_interest=interest,
            defaults={'listing': requested_item}
        )
        if room_created:
            room.participants.add(request.user, requested_item.owner)

        DealConfirmation.objects.get_or_create(barter_interest=interest)

        requester_name = request.user.profile.display_name if (hasattr(request.user, 'profile') and request.user.profile.display_name) else request.user.username
        _create_notification(
            user=requested_item.owner,
            ntype='interest_received',
            title='New Swap Proposal',
            message=f"{requester_name} sent you a new swap proposal for {requested_item.title}.",
            interest=interest
        )

        broadcast_to_group(f"user_{requested_item.owner.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })

        serializer = self.get_serializer(interest)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a proposal and reserve both listings."""
        interest = self.get_object()
        if interest.receiver != request.user:
            return Response({"detail": "Only the receiver can accept."}, status=status.HTTP_403_FORBIDDEN)

        # Re-validate coin balance at acceptance time
        if interest.coins_offered > 0:
            sender_profile = getattr(interest.requester, 'profile', None)
            if not sender_profile or sender_profile.coin_balance < interest.coins_offered:
                return Response(
                    {"detail": f"Cannot accept proposal: requester has insufficient coin balance ({sender_profile.coin_balance if sender_profile else 0} available, {interest.coins_offered} required)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            with transaction.atomic():
                interest.transition_to('accepted')
                from .coin_service import reserve_coins_for_proposal
                reserve_coins_for_proposal(interest)
        except (ValidationError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from chat.models import Conversation
        room, room_created = Conversation.objects.get_or_create(
            barter_interest=interest,
            defaults={'listing': interest.requested_item}
        )
        if room_created:
            room.participants.add(interest.requester, interest.receiver)

        DealConfirmation.objects.get_or_create(barter_interest=interest)

        receiver_name = request.user.profile.display_name if (hasattr(request.user, 'profile') and request.user.profile.display_name) else request.user.username
        _create_notification(
            user=interest.requester,
            ntype='interest_accepted',
            title='Proposal Accepted',
            message=f"{receiver_name} accepted your swap proposal for {interest.requested_item.title}.",
            interest=interest
        )

        # Determine the trade and contract IDs for frontend navigation
        trade_id = None
        contract_id = None
        try:
            trade_id = interest.trade.id
        except Exception:
            pass
        try:
            contract_id = interest.contract.id
        except Exception:
            pass

        broadcast_to_group(f"user_{interest.requester.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
            "trade_id": trade_id,
            "contract_id": contract_id,
        })
        broadcast_to_group(f"user_{interest.receiver.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
            "trade_id": trade_id,
            "contract_id": contract_id,
        })

        return Response({"detail": "Proposal accepted.", "chat_room_id": room.id, "status": interest.status, "trade_id": trade_id, "contract_id": contract_id})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a proposal."""
        interest = self.get_object()
        if interest.receiver != request.user:
            return Response({"detail": "Only the receiver can decline."}, status=status.HTTP_403_FORBIDDEN)

        try:
            with transaction.atomic():
                interest.transition_to('declined')
                from .coin_service import release_coins_for_proposal
                release_coins_for_proposal(interest)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        receiver_name = request.user.profile.display_name if hasattr(request.user, 'profile') else request.user.username
        _create_notification(
            user=interest.requester,
            ntype='interest_rejected',
            title='Proposal Declined',
            message=f"{receiver_name} declined your swap proposal for {interest.requested_item.title}.",
            interest=interest
        )
        broadcast_to_group(f"user_{interest.requester.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })

        return Response({"detail": "Proposal declined.", "status": interest.status})

    @action(detail=True, methods=['post'])
    def negotiate(self, request, pk=None):
        """Mark a proposal as negotiating so it can be revised."""
        interest = self.get_object()
        if interest.receiver != request.user:
            return Response({"detail": "Only the receiver can negotiate."}, status=status.HTTP_403_FORBIDDEN)

        try:
            interest.transition_to('negotiating')
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Proposal is now negotiating.", "status": interest.status})

    @action(detail=True, methods=['post'])
    def counter(self, request, pk=None):
        """Send a counter-offer for an existing proposal."""
        interest = self.get_object()
        if request.user not in [interest.requester, interest.receiver]:
            return Response({"detail": "Not authorized to counter this proposal."}, status=status.HTTP_403_FORBIDDEN)

        offered_item_id = request.data.get('offered_item_id')
        coins_offered = int(request.data.get('coins_offered', 0))
        message = request.data.get('message', '')

        if coins_offered > 0:
            profile = getattr(request.user, 'profile', None)
            if not profile or profile.coin_balance < coins_offered:
                return Response({"detail": f"Insufficient Barter Coins balance. You have {profile.coin_balance if profile else 0} coins."}, status=status.HTTP_400_BAD_REQUEST)

        if offered_item_id:
            try:
                interest.offered_item = BarterItem.objects.get(id=offered_item_id)
            except BarterItem.DoesNotExist:
                return Response({"detail": "Offered item not found."}, status=status.HTTP_404_NOT_FOUND)

        interest.coins_offered = coins_offered
        if message:
            interest.proposal_message = message

        try:
            interest.transition_to('countered')
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        recipient = interest.requester if request.user == interest.receiver else interest.receiver
        _create_notification(
            user=recipient,
            ntype='interest_received',
            title='Counter Offer Received',
            message=f"{request.user.username} sent a counter offer for {interest.requested_item.title}.",
            interest=interest
        )
        broadcast_to_group(f"user_{recipient.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })
        return Response(self.get_serializer(interest).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a proposal."""
        interest = self.get_object()
        if request.user not in [interest.requester, interest.receiver]:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        if interest.status in {'declined', 'cancelled'}:
            return Response({"detail": "Proposal already closed."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                interest.transition_to('cancelled')
                from .coin_service import release_coins_for_proposal
                release_coins_for_proposal(interest)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        _create_notification(
            user=interest.receiver if request.user == interest.requester else interest.requester,
            ntype='interest_rejected',
            title='Proposal Cancelled',
            message='A proposal was cancelled.',
            interest=interest
        )
        broadcast_to_group(f"user_{interest.requester.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })
        broadcast_to_group(f"user_{interest.receiver.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })

        return Response({"detail": "Proposal cancelled.", "status": interest.status})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Step 2: In-app notifications."""
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = StandardResultsSetPagination

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


# ChatRoomViewSet has been removed and replaced by ConversationViewSet in the chat app.

class CoinTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CoinTransactionSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return CoinTransaction.objects.filter(user=self.request.user).order_by('-created_at')

class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Contract.objects.filter(Q(party_a=self.request.user) | Q(party_b=self.request.user)).order_by('-created_at')
        
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        contract = self.get_object()
        # Secure IP parsing: only trust X-Forwarded-For based on configured proxy hops
        from django.conf import settings
        trusted_proxies = getattr(settings, 'TRUSTED_PROXIES', 0)
        
        if trusted_proxies > 0:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
            if x_forwarded_for:
                ips = [ip.strip() for ip in x_forwarded_for.split(',') if ip.strip()]
                # Nginx/proxies append to the end. Client IP is at index -(trusted_proxies)
                if len(ips) >= trusted_proxies:
                    client_ip = ips[-trusted_proxies]
                else:
                    client_ip = ips[0]
            else:
                client_ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        else:
            # Fall back strictly to REMOTE_ADDR if we don't control the proxy hops
            client_ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        now = timezone.now()
        if request.user == contract.party_a:
            contract.signed_a = True
            contract.signed_a_timestamp = now
            contract.signed_a_ip = client_ip
        elif request.user == contract.party_b:
            contract.signed_b = True
            contract.signed_b_timestamp = now
            contract.signed_b_ip = client_ip
        else:
            return Response({"detail": "Not authorized to sign this contract."}, status=status.HTTP_403_FORBIDDEN)
            
        if contract.signed_a and contract.signed_b:
            contract.status = 'signed'
            trade = contract.barter_interest._ensure_trade_exists()
            if not trade.handshake_pin:
                import random
                trade.handshake_pin = f"{random.randint(1000, 9999)}"
                trade.save(update_fields=['handshake_pin'])
            
        contract.save()
        return Response(self.get_serializer(contract).data)
        
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        contract = self.get_object()
        if request.user not in [contract.party_a, contract.party_b]:
            return Response({"detail": "Not authorized to view this contract."}, status=status.HTTP_403_FORBIDDEN)
            
        pdf_buffer = generate_contract_pdf(contract)
        
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Contract_{contract.id}.pdf"'
        return response

class TradeViewSet(viewsets.ModelViewSet):
    serializer_class = TradeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Trade.objects.filter(Q(requester=self.request.user) | Q(receiver=self.request.user)).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def update_logistics(self, request, pk=None):
        with transaction.atomic():
            trade = Trade.objects.select_for_update().get(pk=pk)

            # Check idempotency: if trade is already completed, return error
            if trade.status == 'completed':
                return Response({"detail": "Trade is already completed and payout has been processed."}, status=status.HTTP_400_BAD_REQUEST)

            logistics_status = request.data.get('logistics_status')
            tracking_number = request.data.get('tracking_number')
            shipping_provider = request.data.get('shipping_provider')
            meetup_location = request.data.get('meetup_location')
            meetup_datetime = request.data.get('meetup_datetime')
            submitted_pin = request.data.get('handshake_pin') or request.data.get('pin')

            STAGES = ['preparing', 'shipped', 'out_for_delivery', 'delivered']
            if logistics_status and logistics_status in STAGES:
                current_idx = STAGES.index(trade.logistics_status) if trade.logistics_status in STAGES else 0
                new_idx = STAGES.index(logistics_status)
                if new_idx < current_idx:
                    return Response({"detail": "Cannot revert trade logistics to a previous stage."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check PIN verification if transitioning to 'delivered'
                if logistics_status == 'delivered':
                    if not trade.handshake_pin:
                        import random
                        trade.handshake_pin = f"{random.randint(1000, 9999)}"
                        trade.save(update_fields=['handshake_pin'])

                    if not submitted_pin or str(submitted_pin).strip() != str(trade.handshake_pin).strip():
                        return Response({"detail": "Invalid or missing handshake PIN for delivery verification."}, status=status.HTTP_400_BAD_REQUEST)

                trade.logistics_status = logistics_status

            if tracking_number is not None:
                trade.tracking_number = tracking_number
            if shipping_provider is not None:
                trade.shipping_provider = shipping_provider
            if meetup_location is not None:
                trade.meetup_location = meetup_location
            if meetup_datetime is not None:
                trade.meetup_datetime = meetup_datetime
                
            if logistics_status == 'delivered':
                trade.status = 'completed'
                trade.completed_at = timezone.now()

                from .services import log_interaction
                from .tasks import refresh_user_recommendations
                
                log_interaction(trade.requester, trade.requested_listing, 'traded')
                refresh_user_recommendations.delay(trade.requester.id)
                
                if trade.offered_listing:
                    log_interaction(trade.receiver, trade.offered_listing, 'traded')
                    refresh_user_recommendations.delay(trade.receiver.id)

                # Escrow coin settlement
                proposal = trade.proposal
                if proposal and proposal.coins_offered != 0:
                    from .coin_service import transfer_coins_for_trade
                    transfer_coins_for_trade(trade)

                # Trigger post-trade review notification
                if proposal:
                    _create_notification(
                        user=proposal.requester,
                        ntype='deal_completed',
                        title='Trade Completed!',
                        message=f'Trade #{trade.id} has been completed. Please rate your trade partner!',
                        interest=proposal
                    )
                    _create_notification(
                        user=proposal.receiver,
                        ntype='deal_completed',
                        title='Trade Completed!',
                        message=f'Trade #{trade.id} has been completed. Please rate your trade partner!',
                        interest=proposal
                    )

            trade.save()
            return Response(self.get_serializer(trade).data)

class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Dispute.objects.filter(Q(raised_by=self.request.user) | Q(against=self.request.user)).order_by('-created_at')

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        
        files = self.request.FILES.getlist('evidence_files') or self.request.FILES.getlist('evidence')
        
        # Pre-validate all files before saving the dispute
        for f in files:
            if f.size > 5 * 1024 * 1024:  # 5MB limit
                raise ValidationError({"evidence_files": f"File '{f.name}' exceeds the 5MB size limit."})
                
            ext = f.name.lower().split('.')[-1]
            if ext not in ['jpg', 'jpeg', 'png', 'pdf']:
                raise ValidationError({"evidence_files": f"File '{f.name}' has an invalid extension. Only JPG, PNG, and PDF are allowed."})
                
            if f.content_type not in ['image/jpeg', 'image/png', 'application/pdf']:
                raise ValidationError({"evidence_files": f"File '{f.name}' has an invalid MIME type."})
                
        dispute = serializer.save(raised_by=self.request.user)
        for f in files:
            DisputeEvidence.objects.create(dispute=dispute, file=f)

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        dispute = self.get_object()
        dispute.is_escalated = True
        dispute.status = 'escalated'
        dispute.save(update_fields=['is_escalated', 'status'])
        return Response(self.get_serializer(dispute).data)

class AIRecommendationViewSet(viewsets.ViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def matches(self, request):
        matches = get_ai_matches(request.user)
        return Response(matches)

    @action(detail=False, methods=['get'])
    def loops(self, request):
        from .ai_service import find_3_party_loops
        loops_data = find_3_party_loops(request.user)
        return Response(loops_data)


class SavedItemViewSet(viewsets.ModelViewSet):
    serializer_class = SavedItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SavedItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({"detail": "item_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        saved, created = SavedItem.objects.get_or_create(user=request.user, item_id=item_id)
        if not created:
            saved.delete()
            return Response({"saved": False, "item_id": item_id})

        from .services import log_interaction
        from .tasks import refresh_user_recommendations
        try:
            item = BarterItem.objects.get(id=item_id)
            log_interaction(request.user, item, 'save')
            refresh_user_recommendations.delay(request.user.id)
        except BarterItem.DoesNotExist:
            pass

        return Response({"saved": True, "item_id": item_id})


class CoinTransferView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        from django.db import transaction
        from django.contrib.auth.models import User
        from chat.services import broadcast_to_group

        recipient_username = request.data.get('recipient_username')
        amount = request.data.get('amount')
        description = request.data.get('description', '')

        if not recipient_username:
            return Response({"detail": "recipient_username is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = int(amount)
            if amount <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response({"detail": "Amount must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        if recipient_username == request.user.username:
            return Response({"detail": "You cannot transfer coins to yourself."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recipient = User.objects.get(username=recipient_username)
        except User.DoesNotExist:
            return Response({"detail": "Recipient user not found."}, status=status.HTTP_400_BAD_REQUEST)

        user_ids = sorted([request.user.id, recipient.id])

        with transaction.atomic():
            # Row locking
            locked_profiles = {
                p.user_id: p 
                for p in UserProfile.objects.select_for_update().filter(user_id__in=user_ids)
            }
            
            sender_profile = locked_profiles.get(request.user.id)
            recipient_profile = locked_profiles.get(recipient.id)

            if not sender_profile:
                sender_profile, _ = UserProfile.objects.get_or_create(user=request.user)
            if not recipient_profile:
                recipient_profile, _ = UserProfile.objects.get_or_create(user=recipient)

            if sender_profile.coin_balance < amount:
                return Response({"detail": "Insufficient coin balance."}, status=status.HTTP_400_BAD_REQUEST)

            sender_profile.coin_balance -= amount
            sender_profile.total_coins_spent += amount
            sender_profile.save(update_fields=['coin_balance', 'total_coins_spent'])

            recipient_profile.coin_balance += amount
            recipient_profile.total_coins_earned += amount
            recipient_profile.save(update_fields=['coin_balance', 'total_coins_earned'])

            # Record transactions
            CoinTransaction.objects.create(
                user=request.user,
                amount=-amount,
                transaction_type='spent',
                description=f"Transferred to {recipient.username}: {description}".strip()
            )

            CoinTransaction.objects.create(
                user=recipient,
                amount=amount,
                transaction_type='earned',
                description=f"Received from {request.user.username}: {description}".strip()
            )

            # Record WalletTransaction ledger entries
            WalletTransaction.objects.create(
                user=request.user,
                amount=-amount,
                transaction_type='TRADE_PAYMENT',
                status='SUCCESS',
                description=f"Transferred to {recipient.username}: {description}".strip()
            )
            WalletTransaction.objects.create(
                user=recipient,
                amount=amount,
                transaction_type='TRADE_RECEIPT',
                status='SUCCESS',
                description=f"Received from {request.user.username}: {description}".strip()
            )

        try:
            from .coin_service import broadcast_wallet_update
            broadcast_wallet_update(request.user)
            broadcast_wallet_update(recipient)
        except Exception:
            pass

        return Response({
            "message": f"Successfully transferred {amount} coins to {recipient.username}.",
            "new_balance": sender_profile.coin_balance
        }, status=status.HTTP_200_OK)


class ReverseGeocodeView(generics.GenericAPIView):
    """
    Authenticated API view for backend reverse geocoding.
    POST /api/geocode/reverse/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if latitude is None or longitude is None or latitude == '' or longitude == '':
            return Response(
                {"error": "Both latitude and longitude are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            lat = float(latitude)
            lng = float(longitude)
        except (ValueError, TypeError):
            return Response(
                {"error": "Latitude and longitude must be valid floating point numbers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        errors = {}
        if lat < -90.0 or lat > 90.0:
            errors["latitude"] = ["Latitude must be between -90 and 90."]
        if lng < -180.0 or lng > 180.0:
            errors["longitude"] = ["Longitude must be between -180 and 180."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        from .geocoding_service import reverse_geocode
        try:
            result = reverse_geocode(lat, lng)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "location_name": "Coordinates captured",
                "city": "",
                "state": "",
                "country": ""
            }, status=status.HTTP_200_OK)


COIN_PACKAGES = {
    "pack_50": {"coins": 50, "price_inr": 250},
    "pack_100": {"coins": 100, "price_inr": 450},
    "pack_250": {"coins": 250, "price_inr": 1000},
    "pack_500": {"coins": 500, "price_inr": 1750},
    "pack_1000": {"coins": 1000, "price_inr": 3000},
}


class CoinPackagesView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response([
            {"id": k, **v} for k, v in COIN_PACKAGES.items()
        ])


class WalletOverviewView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        profile = request.user.profile
        return Response({
            "coin_balance": profile.coin_balance,
            "coin_reserved": profile.coin_reserved,
            "total_coins_earned": profile.total_coins_earned,
            "total_coins_spent": profile.total_coins_spent,
            "total_coins_purchased": profile.total_coins_purchased,
        })


class WalletTransactionsView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WalletTransactionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user).order_by('-created_at')


class IsAdminUserOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class AdminDashboardStatsView(generics.GenericAPIView):
    permission_classes = (IsAdminUserOrStaff,)

    def get(self, request):
        from django.db.models import Sum
        from django.contrib.auth.models import User
        
        # User Stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users = User.objects.filter(date_joined__gte=timezone.now() - timezone.timedelta(days=7)).count()
        
        # Listing Stats
        total_listings = BarterItem.objects.count()
        active_listings = BarterItem.objects.filter(status='active').count()
        
        # Trade Stats
        completed_trades = Trade.objects.filter(status='completed').count()
        pending_trades = Trade.objects.filter(status='pending').count()
        disputed_trades = Trade.objects.filter(status='disputed').count()
        
        # Platform Revenue & Coins (Aggregated safely at database level)
        purchase_txs = WalletTransaction.objects.filter(transaction_type='PURCHASE', status='SUCCESS')
        revenue = purchase_txs.aggregate(total=Sum('price_inr'))['total'] or 0.00
        coins_circulation = UserProfile.objects.aggregate(total=Sum('coin_balance'))['total'] or 0
        coin_purchases = purchase_txs.aggregate(total=Sum('amount'))['total'] or 0

        # Content Safety Stats
        flagged_images = ImageModerationResult.objects.filter(status='FLAGGED').count()
        pending_reviews = ImageModerationResult.objects.filter(status='PENDING_REVIEW').count()
        active_disputes = Dispute.objects.exclude(status='resolved').count()

        # Audit Logs (Recent 5 logs)
        recent_logs = AdminActionLog.objects.order_by('-created_at')[:5]
        from .serializers import AdminActionLogSerializer
        logs_serializer = AdminActionLogSerializer(recent_logs, many=True)

        return Response({
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "new_users": new_users,
                "total_listings": total_listings,
                "active_listings": active_listings,
                "completed_trades": completed_trades,
                "pending_trades": pending_trades,
                "disputed_trades": disputed_trades,
                "coins_circulation": coins_circulation,
                "coin_purchases": coin_purchases,
                "platform_revenue": revenue,
                "flagged_images": flagged_images,
                "pending_reviews": pending_reviews,
                "active_disputes": active_disputes,
            },
            "recent_activity": logs_serializer.data
        })


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAdminUserOrStaff,)
    serializer_class = UserSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        from django.contrib.auth.models import User
        queryset = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
        
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'suspended':
            queryset = queryset.filter(is_active=False)
            
        verified_filter = self.request.query_params.get('verified')
        if verified_filter == 'true':
            queryset = queryset.filter(profile__is_verified=True)
        elif verified_filter == 'false':
            queryset = queryset.filter(profile__is_verified=False)

        return queryset

    @action(detail=True, methods=['post'])
    def manage(self, request, pk=None):
        from django.contrib.auth.models import User
        user_to_manage = generics.get_object_or_404(User, pk=pk)
        
        if user_to_manage == request.user:
            return Response({"detail": "You cannot perform admin actions on your own account."}, status=403)
            
        if (user_to_manage.is_staff or user_to_manage.is_superuser) and not request.user.is_superuser:
            return Response({"detail": "Only superusers can modify other staff or admin accounts."}, status=403)
            
        action_type = request.data.get('action') # suspend, reactivate, verify, unverify, make_premium
        notes = request.data.get('notes', '')

        with transaction.atomic():
            profile = user_to_manage.profile
            if action_type == 'suspend':
                user_to_manage.is_active = False
                user_to_manage.save()
            elif action_type == 'reactivate':
                user_to_manage.is_active = True
                user_to_manage.save()
            elif action_type == 'verify':
                profile.is_verified = True
                profile.save()
            elif action_type == 'unverify':
                profile.is_verified = False
                profile.save()
            elif action_type == 'make_premium':
                profile.is_premium = True
                profile.save()
            elif action_type == 'revoke_premium':
                profile.is_premium = False
                profile.save()
            else:
                return Response({"detail": "Invalid action specified."}, status=400)

            # Log admin action
            AdminActionLog.objects.create(
                admin=request.user,
                action=f"USER_{action_type.upper()}",
                target_user=user_to_manage,
                notes=notes
            )

        return Response({"message": f"Successfully performed action '{action_type}' on user {user_to_manage.username}."})


class AdminListingManagementViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAdminUserOrStaff,)
    serializer_class = BarterItemSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = BarterItem.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
            
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=['post'])
    def manage(self, request, pk=None):
        listing = generics.get_object_or_404(BarterItem, pk=pk)
        action_type = request.data.get('action') # remove, disable, restore
        notes = request.data.get('notes', '')

        with transaction.atomic():
            if action_type == 'remove' or action_type == 'disable':
                listing.status = 'archived'
                listing.save()
            elif action_type == 'restore':
                listing.status = 'active'
                listing.save()
            else:
                return Response({"detail": "Invalid action specified."}, status=400)

            # Log admin action
            AdminActionLog.objects.create(
                admin=request.user,
                action=f"LISTING_{action_type.upper()}",
                target_listing=listing,
                notes=notes
            )

        return Response({"message": f"Successfully performed action '{action_type}' on listing #{listing.id}."})


class AdminDisputeManagementViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAdminUserOrStaff,)
    serializer_class = DisputeSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Dispute.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        dispute = generics.get_object_or_404(Dispute, pk=pk)
        resolution_notes = request.data.get('resolution', '').strip()
        status_val = request.data.get('status', 'resolved') # resolved, rejected, investigating

        if not resolution_notes:
            return Response({"detail": "Resolution notes are required."}, status=400)

        with transaction.atomic():
            dispute.status = status_val
            dispute.resolution = resolution_notes
            dispute.save()

            # Release escrow if trade coin reservations exist and dispute was resolved by cancelling trade
            if status_val == 'resolved' and dispute.trade and dispute.trade.proposal:
                from .coin_service import release_coins_for_proposal
                release_coins_for_proposal(dispute.trade.proposal)

            # Log admin action
            AdminActionLog.objects.create(
                admin=request.user,
                action=f"DISPUTE_{status_val.upper()}",
                target_dispute=dispute,
                notes=resolution_notes
            )

        return Response({"message": f"Dispute status updated to {status_val}."})


class AdminImageModerationQueueViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAdminUserOrStaff,)
    serializer_class = ImageModerationResultSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ImageModerationResult.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            queryset = queryset.filter(status__in=['FLAGGED', 'PENDING_REVIEW'])
        return queryset

    @action(detail=True, methods=['post'])
    def action(self, request, pk=None):
        result = generics.get_object_or_404(ImageModerationResult, pk=pk)
        moderation_action = request.data.get('action') # approve, reject, remove_image, suspend_listing
        notes = request.data.get('notes', '')

        with transaction.atomic():
            result.reviewed_by = request.user
            result.reviewed_at = timezone.now()
            
            if moderation_action == 'approve':
                result.status = 'APPROVED'
                result.save()
            elif moderation_action == 'reject' or moderation_action == 'remove_image':
                result.status = 'BLOCKED'
                result.save()
                # Clear listing main cover image if it was this image
                if result.item and result.item.image == result.image:
                    result.item.image = None
                    result.item.save()
            elif moderation_action == 'suspend_listing':
                result.status = 'BLOCKED'
                result.save()
                if result.item:
                    result.item.status = 'archived'
                    result.item.save()
            else:
                return Response({"detail": "Invalid moderation action."}, status=400)

            # Log admin action
            AdminActionLog.objects.create(
                admin=request.user,
                action=f"MODERATION_{moderation_action.upper()}",
                target_listing=result.item,
                target_user=result.user,
                notes=f"Queue ID: {result.id}. {notes}"
            )

        return Response({"message": f"Successfully applied action '{moderation_action}'."})



