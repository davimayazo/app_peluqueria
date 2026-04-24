from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Service
from .serializers import ServiceSerializer
from apps.users.permissions import IsAdminOrReadOnly, IsStaffOrReadOnly

class ServiceViewSet(viewsets.ModelViewSet):
    """
    RF-06 / RF-07: Catálogo de Servicios.
    - Clientes pueden ver servicios activos.
    - Staff (Admin/Barbero) puede crear, actualizar y desactivar (soft-delete).
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'price', 'duration_minutes']
    ordering = ['price']

    def get_queryset(self):
        """
        Los clientes solo ven los servicios activos.
        El staff (admin/barbero) ve todos.
        """
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'profile') and user.profile.role in ['admin', 'barbero']:
            return Service.objects.all()
        return Service.objects.filter(is_active=True)
