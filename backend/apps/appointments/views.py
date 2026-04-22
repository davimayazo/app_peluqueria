from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from .models import Appointment
from .serializers import AppointmentSerializer, CreateAppointmentSerializer, ReviewSerializer
from apps.services.models import Service
from apps.barbers.models import Barber

class AppointmentViewSet(viewsets.ModelViewSet):
    """
    RF-10, RF-12, RF-13: Motor de Reservas.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateAppointmentSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            return Appointment.objects.all().order_by('-start_datetime')
        return Appointment.objects.filter(client=user).order_by('-start_datetime')

    def create(self, request, *args, **kwargs):
        """RF-10 y RF-12: Crea una reserva preveniendo overbooking."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service_id = serializer.validated_data['service_id']
        barber_id = serializer.validated_data['barber_id']
        start_datetime = serializer.validated_data['start_datetime']
        
        try:
            service = Service.objects.get(id=service_id, is_active=True)
            barber = Barber.objects.get(id=barber_id, is_active=True)
        except (Service.DoesNotExist, Barber.DoesNotExist):
            return Response(
                {"error": "Servicio o Barbero inválido/inactivo."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
        now = timezone.now()
        
        # Regla: RF-13 (1 hora mínima de antelación)
        if start_datetime <= now + timedelta(hours=1):
            return Response(
                {"error": "La reserva requiere al menos 1 hora de antelación."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Regla: RF-13 (Máximo 60 días)
        if start_datetime > now + timedelta(days=60):
            return Response(
                {"error": "No se puede reservar con más de 60 días de antelación."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Regla: RF-13 (Máximo 3 citas futuras)
        future_appointments = Appointment.objects.filter(
            client=request.user,
            start_datetime__gt=now,
            status__in=['pendiente', 'confirmada']
        ).count()
        
        if future_appointments >= 3 and getattr(request.user, 'profile', None) and request.user.profile.role != 'admin':
            return Response(
                {"error": "Has alcanzado el límite de citas futuras (3)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RF-12: Prevención de overbooking transaccional pesimista
        try:
            with transaction.atomic():
                # Bloquear las citas de este barbero ese día para escritura
                # `select_for_update()` impide que otra transacción lea esto hasta acabar
                target_date = start_datetime.date()
                existing_appts = Appointment.objects.select_for_update().filter(
                    barber=barber,
                    start_datetime__date=target_date,
                    status__in=['pendiente', 'confirmada']
                )
                
                # Verificar solapamiento
                for appt in existing_appts:
                    if (start_datetime < appt.end_datetime) and (end_datetime > appt.start_datetime):
                        return Response(
                            {"error": "Este horario ya ha sido reservado."},
                            status=status.HTTP_409_CONFLICT
                        )
                
                # Crear cita
                appointment = Appointment.objects.create(
                    client=request.user,
                    barber=barber,
                    service=service,
                    start_datetime=start_datetime,
                    end_datetime=end_datetime,
                    status='confirmada',  # confirmada directamente según RF-10
                    price_at_booking=service.price
                )
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        read_serializer = AppointmentSerializer(appointment)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """RF-18: Cancelar cita con validación de 24 horas."""
        appointment = self.get_object()
        
        if appointment.status in ['cancelada', 'completada']:
            return Response({"error": "La cita ya está completada o cancelada."}, status=status.HTTP_400_BAD_REQUEST)
            
        is_admin = hasattr(request.user, 'profile') and request.user.profile.role == 'admin'
        
        # Validar 24h si el usuario es cliente
        if not is_admin:
            if appointment.start_datetime <= timezone.now() + timedelta(hours=24):
                return Response(
                    {"error": "No es posible cancelar con menos de 24h de antelación. Contacta con nosotros."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        appointment.status = 'cancelada'
        appointment.cancelled_by = 'admin' if is_admin else 'client'
        appointment.cancellation_reason = request.data.get('reason', '')
        appointment.save()
        
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def complete(self, request, pk=None):
        """RF-20: Marcar cita como completada (solo admin)."""
        # Nota: Idealmente deberíamos usar IsAdmin (custom permission) aquí, 
        # asumiendo IsAdminUser es personal, usamos la comprobación normal.
        if getattr(request.user, 'profile', None) and getattr(request.user.profile, 'role') != 'admin':
             return Response(status=status.HTTP_403_FORBIDDEN)
             
        appointment = self.get_object()
        if appointment.status != 'confirmada':
            return Response({"error": "Solo se pueden completar citas confirmadas."}, status=status.HTTP_400_BAD_REQUEST)
            
        appointment.status = 'completada'
        appointment.save()
        
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """RF-17: Añadir valoración a una cita pasada (completada)."""
        appointment = self.get_object()
        
        if appointment.client != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        if appointment.status != 'completada':
            return Response({"error": "Solo se pueden valorar citas completadas."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        appointment.rating = serializer.validated_data['rating']
        appointment.review = serializer.validated_data.get('review', '')
        appointment.save()
        
        return Response(AppointmentSerializer(appointment).data)
