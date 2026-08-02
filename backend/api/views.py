from rest_framework import viewsets, generics, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
import random
import re
import requests as http_requests

from .models import (
    BarterItem, BarterItemImage, Category, BarterOffer, UserReview,
    UserProfile, OTPVerification, TradeTransaction, CoinTransaction,
    BarterInterest, Notification, DealConfirmation, Trade, Contract, SavedItem
)
from .serializers import (
    BarterItemSerializer, CategorySerializer, BarterOfferSerializer,
    UserReviewSerializer, UserSerializer, UserProfileSerializer,
    TradeTransactionSerializer, BarterInterestSerializer, NotificationSerializer,
    DealConfirmationSerializer, BarterItemCompactSerializer, CoinTransactionSerializer,
    ContractSerializer, TradeSerializer, DisputeSerializer, SavedItemSerializer
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

class FlexLoginView(TokenObtainPairView):
    """Endpoint: POST /api/login/  — accepts username or email."""
    serializer_class = EmailOrUsernameTokenSerializer


class SimpleRegisterView(generics.CreateAPIView):
    """
    POST /api/register/simple/
    Body: { name, username, email, password }
    Creates User + UserProfile in one shot, returns JWT tokens.
    No OTP required — straightforward signup.
    """
    permission_classes = (permissions.AllowAny,)

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
                coin_balance=10,
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
                    coin_balance=10,
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

        try:
            send_otp_email(email, otp)
        except Exception as e:
            return Response({"detail": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Verification OTP sent to email successfully."}, status=status.HTTP_200_OK)


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
            UserProfile.objects.filter(user=user).update(
                display_name=name,
                account_type='individual',
                is_verified=True,
                coin_balance=10,
            )
            otp_record.delete()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'message': 'Account created and email verified successfully!',
        }, status=status.HTTP_201_CREATED)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)


    @action(detail=False, methods=['get'])
    def nearby_traders(self, request):
        user_profile = request.user.profile
        my_location = user_profile.location or ""
        my_city = my_location.split(',')[0].strip().lower() if my_location else ""
        
        # Get active items from other users
        active_items = BarterItem.objects.exclude(owner=request.user).filter(status='active').select_related('owner__profile')
        
        trader_map = {}
        for item in active_items:
            owner = item.owner
            if owner.id not in trader_map:
                owner_loc = item.location or owner.profile.location or ""
                owner_city = owner_loc.split(',')[0].strip().lower() if owner_loc else ""
                
                # Deterministic pseudo-distance
                if not my_city or not owner_city:
                    distance_km = hash(owner.username) % 20 + 10 # 10-29 km
                elif my_city == owner_city:
                    distance_km = hash(owner.username) % 5 + 1 # 1-5 km
                else:
                    distance_km = hash(owner.username) % 15 + 5 # 5-19 km
                    
                trader_map[owner.id] = {
                    "id": owner.id,
                    "name": owner.profile.display_name or owner.username,
                    "username": owner.username,
                    "avatar": owner.profile.profile_picture_url,
                    "distance": f"{distance_km} km away",
                    "mutual_friends": hash(owner.username) % 5,
                    "items": []
                }
                
            trader_map[owner.id]["items"].append({
                "id": item.id,
                "image": item.image_url or (item.image.url if item.image else None)
            })
            
        # Return only traders that have at least 1 item, sorted by distance
        traders_list = list(trader_map.values())
        traders_list.sort(key=lambda x: int(x["distance"].split(' ')[0]))
        return Response(traders_list[:10])

class BarterItemViewSet(viewsets.ModelViewSet):
    serializer_class = BarterItemSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'offering', 'wanting', 'location']
    ordering_fields = ['created_at', 'title']

    def get_queryset(self):
        from django.utils import timezone
        from django.db import models
        # Deactivate expired boosts
        BarterItem.objects.filter(is_boosted=True, boost_expires_at__lt=timezone.now()).update(is_boosted=False)
        
        queryset = BarterItem.objects.all()
        # Exclude archived items from general public feed, but let owners see their own archived listings.
        if self.request.user.is_authenticated:
            queryset = queryset.filter(
                models.Q(owner=self.request.user) | ~models.Q(status='archived')
            )
        # Query parameter filters
        category = self.request.query_params.get('category')
        if category and category != 'all':
            queryset = queryset.filter(models.Q(category__slug__iexact=category) | models.Q(category__name__iexact=category))

        condition = self.request.query_params.get('condition')
        if condition and condition != 'all':
            queryset = queryset.filter(condition__iexact=condition)

        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        item_type = self.request.query_params.get('item_type')
        if item_type and item_type != 'all':
            queryset = queryset.filter(item_type__iexact=item_type)

        val_min = self.request.query_params.get('valuation_min')
        if val_min:
            try:
                queryset = queryset.filter(estimated_value__gte=float(val_min))
            except ValueError:
                pass

        val_max = self.request.query_params.get('valuation_max')
        if val_max:
            try:
                queryset = queryset.filter(estimated_value__lte=float(val_max))
            except ValueError:
                pass

        return queryset.order_by('-is_boosted', '-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        viewed_session_key = f'viewed_item_{instance.id}'
        if not request.session.get(viewed_session_key):
            instance.views_count += 1
            instance.save(update_fields=['views_count'])
            request.session[viewed_session_key] = True
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

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
            
        # Get profile of user
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response({"detail": "User profile not found."}, status=status.HTTP_400_BAD_REQUEST)
            
        cost = getattr(settings, 'BOOST_COST', 100)
        duration = getattr(settings, 'BOOST_DURATION_DAYS', 7)
        
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


# ChatMessageViewSet is replaced by ConversationViewSet actions.


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
        
        # Calculate dynamic XP & Level
        completed_trades_count = Trade.objects.filter(Q(requester=request.user) | Q(receiver=request.user), status='completed').count()
        positive_reviews_count = UserReview.objects.filter(reviewed_user=request.user, rating__gte=4).count()
        created_listings_count = BarterItem.objects.filter(owner=request.user).count()

        xp = (completed_trades_count * 100) + (positive_reviews_count * 50) + (created_listings_count * 25)
        level = (xp // 200) + 1

        profile.xp = xp
        profile.level = level
        profile.save(update_fields=['xp', 'level'])

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

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
        profile.location = request.data.get('location', profile.location)
        profile.phone_number = request.data.get('phone_number', profile.phone_number)
        profile.profile_picture_url = request.data.get('profile_picture_url', profile.profile_picture_url)
        profile.cover_picture_url = request.data.get('cover_picture_url', profile.cover_picture_url)
        
        if 'profile_picture' in request.FILES:
            from django.core.files.storage import default_storage
            profile_pic = request.FILES['profile_picture']
            file_name = default_storage.save(f'profile_pics/{request.user.id}_{profile_pic.name}', profile_pic)
            profile.profile_picture_url = request.build_absolute_uri(default_storage.url(file_name))
            
        if 'cover_picture' in request.FILES:
            from django.core.files.storage import default_storage
            cover_pic = request.FILES['cover_picture']
            file_name = default_storage.save(f'cover_pics/{request.user.id}_{cover_pic.name}', cover_pic)
            profile.cover_picture_url = request.build_absolute_uri(default_storage.url(file_name))
        
        profile.college_organization = request.data.get('college_organization', profile.college_organization)
        profile.department_branch = request.data.get('department_branch', profile.department_branch)
        profile.year_of_study = request.data.get('year_of_study', profile.year_of_study)
        
        profile.github_profile = request.data.get('github_profile', profile.github_profile)
        profile.linkedin_profile = request.data.get('linkedin_profile', profile.linkedin_profile)
        profile.portfolio_website = request.data.get('portfolio_website', profile.portfolio_website)
        profile.resume_url = request.data.get('resume_url', profile.resume_url)
        
        if 'resume' in request.FILES:
            from django.core.files.storage import default_storage
            resume_file = request.FILES['resume']
            file_name = default_storage.save(f'resumes/{request.user.id}_{resume_file.name}', resume_file)
            profile.resume_url = request.build_absolute_uri(default_storage.url(file_name))
        
        proof_of_work = request.data.get('proof_of_work', profile.proof_of_work)
        if isinstance(proof_of_work, str):
            import json
            try:
                proof_of_work = json.loads(proof_of_work)
            except ValueError:
                pass
        profile.proof_of_work = proof_of_work

        is_verified = request.data.get('is_verified', profile.is_verified)
        if isinstance(is_verified, str):
            is_verified = is_verified.lower() == 'true'
        profile.is_verified = is_verified
        
        # Calculate updated trust score dynamically
        completed_interests = BarterInterest.objects.filter(
            Q(requester=request.user) | Q(receiver=request.user),
            status='completed'
        ).count()
        
        profile_complete = bool(profile.display_name and profile.bio and profile.location)
        email_verified = bool(request.user.email)
        phone_verified = bool(profile.phone_number)
        
        score = 30
        if profile_complete: score += 10
        if email_verified: score += 5
        if phone_verified: score += 10
        if profile.is_verified: score += 20
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
        from chat.models import Message, Conversation
        unread_messages = Message.objects.filter(
            conversation__in=Conversation.objects.filter(participants=user),
            read_at__isnull=True
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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def listings(self, request):
        items = BarterItem.objects.filter(owner=request.user)
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
        if amount <= 0:
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        # Simulate payment gateway success
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.add_coins(amount)
        
        CoinTransaction.objects.create(
            user=request.user,
            amount=amount,
            transaction_type='purchased',
            description=f"Purchased {amount} coins"
        )
        
        return Response({"message": f"Successfully purchased {amount} coins.", "new_balance": profile.coin_balance})

class RedeemCoinsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        amount = int(request.data.get('amount', 0))
        description = request.data.get('description', 'Redeemed coins')
        
        if amount <= 0:
            return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
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
        coins_offered = request.data.get('coins_offered', 0)

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

        duplicate_query = BarterInterest.objects.filter(
            requester=request.user,
            requested_item=requested_item,
            offered_item=offered_item,
            status__in=['pending', 'negotiating', 'countered', 'accepted']
        )
        if duplicate_query.exists():
            return Response({"detail": "You already have an active proposal for this swap."}, status=status.HTTP_400_BAD_REQUEST)

        coins_val = int(coins_offered or 0)
        if coins_val > 0:
            profile = getattr(request.user, 'profile', None)
            if not profile or profile.coin_balance < coins_val:
                return Response({"detail": f"Insufficient Barter Coins balance. You have {profile.coin_balance if profile else 0} coins."}, status=status.HTTP_400_BAD_REQUEST)

        interest = BarterInterest.objects.create(
            requester=request.user,
            receiver=requested_item.owner,
            requested_item=requested_item,
            offered_item=offered_item,
            status='pending',
            proposal_message=proposal_message,
            coins_offered=coins_val,
        )

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
            interest.transition_to('accepted')
        except ValidationError as exc:
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
        broadcast_to_group(f"user_{interest.requester.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })
        broadcast_to_group(f"user_{interest.receiver.id}", "proposal.updated", {
            "id": interest.id,
            "status": interest.status,
        })

        return Response({"detail": "Proposal accepted.", "chat_room_id": room.id, "status": interest.status})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a proposal."""
        interest = self.get_object()
        if interest.receiver != request.user:
            return Response({"detail": "Only the receiver can decline."}, status=status.HTTP_403_FORBIDDEN)

        try:
            interest.transition_to('declined')
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
            interest.transition_to('cancelled')
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
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '127.0.0.1'))
        if ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()

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

            STAGES = ['preparing', 'shipped', 'out_for_delivery', 'delivered']
            if logistics_status and logistics_status in STAGES:
                current_idx = STAGES.index(trade.logistics_status) if trade.logistics_status in STAGES else 0
                new_idx = STAGES.index(logistics_status)
                if new_idx < current_idx:
                    return Response({"detail": "Cannot revert trade logistics to a previous stage."}, status=status.HTTP_400_BAD_REQUEST)
                trade.logistics_status = logistics_status

            if tracking_number is not None:
                trade.tracking_number = tracking_number
            if shipping_provider is not None:
                trade.shipping_provider = shipping_provider
                
            if logistics_status == 'delivered':
                trade.status = 'completed'
                trade.completed_at = timezone.now()

                # Escrow coin settlement
                if trade.barter_interest and trade.barter_interest.coins_offered > 0:
                    coins = trade.barter_interest.coins_offered
                    sender_profile = getattr(trade.barter_interest.requester, 'profile', None)
                    receiver_profile = getattr(trade.barter_interest.receiver, 'profile', None)
                    
                    if sender_profile and receiver_profile:
                        if sender_profile.coin_balance < coins:
                            return Response({"detail": f"Requester has insufficient coin balance ({sender_profile.coin_balance}) for escrow payout."}, status=status.HTTP_400_BAD_REQUEST)
                        
                        sender_profile.coin_balance -= coins
                        sender_profile.save(update_fields=['coin_balance'])
                        receiver_profile.coin_balance += coins
                        receiver_profile.save(update_fields=['coin_balance'])

                        CoinTransaction.objects.create(
                            user=trade.barter_interest.requester,
                            amount=-coins,
                            transaction_type='spent',
                            description=f"Barter Coins transferred for Trade #{trade.id}"
                        )
                        CoinTransaction.objects.create(
                            user=trade.barter_interest.receiver,
                            amount=coins,
                            transaction_type='earned',
                            description=f"Barter Coins received for Trade #{trade.id}"
                        )

            trade.save()
            return Response(self.get_serializer(trade).data)

class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Dispute.objects.filter(Q(raised_by=self.request.user) | Q(against=self.request.user)).order_by('-created_at')

    def perform_create(self, serializer):
        dispute = serializer.save(raised_by=self.request.user)
        files = self.request.FILES.getlist('evidence_files') or self.request.FILES.getlist('evidence')
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
        return Response({"saved": True, "item_id": item_id})


