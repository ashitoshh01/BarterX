# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    CategoryViewSet,
    BarterItemViewSet,
    BarterOfferViewSet,
    ChatMessageViewSet,
    UserReviewViewSet,
    UserProfileViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', BarterItemViewSet, basename='barter-item')
router.register(r'offers', BarterOfferViewSet, basename='barter-offer')
router.register(r'messages', ChatMessageViewSet, basename='chat-message')
router.register(r'reviews', UserReviewViewSet, basename='user-review')
router.register(r'profiles', UserProfileViewSet, basename='user-profile')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
