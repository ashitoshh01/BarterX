from rest_framework import viewsets, generics, permissions
from .models import BarterItem
from .serializers import BarterItemSerializer, UserSerializer
from django.contrib.auth.models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class BarterItemViewSet(viewsets.ModelViewSet):
    queryset = BarterItem.objects.all().order_by('-created_at')
    serializer_class = BarterItemSerializer
