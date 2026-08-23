# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import (
    UserProfile, Category, BarterItem, UserReview,
    BarterInterest, Notification, DealConfirmation,
    FinancialAuditLog
)
from chat.models import Conversation, Message

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'location', 'is_verified', 'average_rating', 'trust_score', 'reward_points')
    search_fields = ('user__username', 'location')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_service')
    search_fields = ('name',)

@admin.register(BarterItem)
class BarterItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'description', 'owner__username')



@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'conversation', 'message_type', 'created_at')
    list_filter = ('message_type',)
    search_fields = ('sender__username', 'text')

@admin.register(UserReview)
class UserReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'reviewed_user', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('reviewer__username', 'reviewed_user__username')

@admin.register(BarterInterest)
class BarterInterestAdmin(admin.ModelAdmin):
    list_display = ('requester', 'receiver', 'offered_item', 'requested_item', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('requester__username', 'receiver__username')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('user__username', 'title')

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'barter_interest', 'created_at')
    search_fields = ('participants__username', 'listing__title')

@admin.register(DealConfirmation)
class DealConfirmationAdmin(admin.ModelAdmin):
    list_display = ('barter_interest', 'user1_confirmed', 'user2_confirmed', 'completed_at')

@admin.register(FinancialAuditLog)
class FinancialAuditLogAdmin(admin.ModelAdmin):
    list_display = ('target_user', 'action_type', 'amount_changed', 'previous_balance', 'new_balance', 'timestamp')
    list_filter = ('action_type',)
    search_fields = ('target_user__username', 'actor__username')
    readonly_fields = ('target_user', 'actor', 'action_type', 'previous_balance', 'amount_changed', 'new_balance', 'reference_transaction', 'ip_address', 'notes', 'timestamp')

    def has_add_permission(self, request):
        return False
        
    def has_change_permission(self, request, obj=None):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False
