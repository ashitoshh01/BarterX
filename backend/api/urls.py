from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CategoryViewSet,
    BarterItemViewSet,
    BarterOfferViewSet,
    UserReviewViewSet,
    UserProfileViewSet,
    SendOTPView,
    VerifyOTPAndRegisterView,
    TradeTransactionViewSet,
    BarterInterestViewSet,
    NotificationViewSet,
    PurchaseCoinsView,
    RedeemCoinsView,
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,
    CoinTransactionViewSet,
    ContractViewSet,
    TradeViewSet,
    DisputeViewSet,
    AIRecommendationViewSet,
    SavedItemViewSet,
    FlexLoginView,
    SimpleRegisterView,
    GoogleOAuthView,
)

from chat.views import ConversationViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', BarterItemViewSet, basename='barter-item')
router.register(r'offers', BarterOfferViewSet, basename='barter-offer')
router.register(r'reviews', UserReviewViewSet, basename='user-review')
router.register(r'profiles', UserProfileViewSet, basename='user-profile')
router.register(r'transactions', TradeTransactionViewSet, basename='trade-transaction')
# New endpoints for barter interest flow
router.register(r'interests', BarterInterestViewSet, basename='barter-interest')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'chatrooms', ConversationViewSet, basename='chat-room')
router.register(r'wallet/transactions', CoinTransactionViewSet, basename='coin-transaction')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'trades', TradeViewSet, basename='trade')
router.register(r'disputes', DisputeViewSet, basename='dispute')
router.register(r'recommendations', AIRecommendationViewSet, basename='recommendation')
router.register(r'saved-items', SavedItemViewSet, basename='saved-item')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', UserProfileViewSet.as_view({'get': 'me', 'put': 'update_me', 'patch': 'update_me'}), name='profile-me'),
    path('register/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('register/verify-otp/', VerifyOTPAndRegisterView.as_view(), name='verify-otp'),
    path('register/', RegisterView.as_view(), name='register'),
    path('register/simple/', SimpleRegisterView.as_view(), name='register-simple'),
    path('auth/google/', GoogleOAuthView.as_view(), name='google-oauth'),
    path('login/', FlexLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('wallet/purchase-coins/', PurchaseCoinsView.as_view(), name='purchase-coins'),
    path('wallet/redeem-coins/', RedeemCoinsView.as_view(), name='redeem-coins'),
    path('wallet/create-razorpay-order/', CreateRazorpayOrderView.as_view(), name='create-razorpay-order'),
    path('wallet/verify-razorpay-payment/', VerifyRazorpayPaymentView.as_view(), name='verify-razorpay-payment'),
]
