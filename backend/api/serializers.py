from rest_framework import serializers
from .models import BarterItem

class BarterItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarterItem
        fields = '__all__'
