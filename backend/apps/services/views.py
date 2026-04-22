from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Service
from .serializers import ServiceSerializer
from apps.users.permissions import IsAdminOrReadOnly

class ServiceViewSet(viewsets.ModelViewSet):
    """
    RF-06 / RF-07: Catálogo de Servicios.
    - Clientes pueden ver servicios activos.
    - Admin puede crear, actualizar y desactivar (soft-delete).
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'price', 'duration_minutes']
    ordering = ['price']

    def get_queryset(self):
        """
        Los clientes solo ven los servicios activos.
        Los admins ven todos.
        """
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'profile') and user.profile.role == 'admin':
            return Service.objects.all()
        return Service.objects.filter(is_active=True)

    def perform_destroy(self, instance):
        """Soft-delete para servicios en uso."""
        instance.is_active = False
        instance.save()
