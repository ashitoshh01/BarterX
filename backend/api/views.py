from rest_framework import viewsets
from .models import BarterItem
from .serializers import BarterItemSerializer

class BarterItemViewSet(viewsets.ModelViewSet):
    queryset = BarterItem.objects.all().order_by('-created_at')
    serializer_class = BarterItemSerializer
