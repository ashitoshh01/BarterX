# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import UserProfile, Category, BarterItem, BarterOffer, ChatMessage, UserReview

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'location', 'is_verified', 'average_rating')
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

@admin.register(BarterOffer)
class BarterOfferAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'offered_item', 'requested_item', 'status')
    list_filter = ('status',)
    search_fields = ('sender__username', 'receiver__username')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('sender__username', 'receiver__username', 'message')

@admin.register(UserReview)
class UserReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'reviewed_user', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('reviewer__username', 'reviewed_user__username')
