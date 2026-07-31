from django.db import models
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from api.models import BarterItem, BarterInterest

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    listing = models.ForeignKey(BarterItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    barter_interest = models.OneToOneField(BarterInterest, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_room')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message = models.ForeignKey('Message', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    last_activity = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_activity']

    def __str__(self):
        return f"Conversation #{self.id} (Listing: {self.listing.title if self.listing else 'None'})"


class Message(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('FILE', 'File'),
        ('SYSTEM', 'System'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default='TEXT')
    text = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    
    edited = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message #{self.id} in Conversation #{self.conversation.id} by {self.sender.username}"
