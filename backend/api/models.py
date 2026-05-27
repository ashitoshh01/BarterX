from django.db import models

class BarterItem(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    offering = models.CharField(max_length=200)
    wanting = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    owner = models.CharField(max_length=100, default="Anonymous")
    location = models.CharField(max_length=150, default="Remote")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (Offering: {self.offering} | Wanting: {self.wanting})"
