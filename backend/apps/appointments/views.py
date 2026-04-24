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
        if hasattr(user, 'profile') and user.profile.role in ['admin', 'barbero']:
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
            
            if barber_id:
                barber = Barber.objects.get(id=barber_id, is_active=True)
                barbers_to_check = [barber]
            else:
                # RF-09: Lógica "Sin preferencia"
                barbers_to_check = Barber.objects.filter(is_active=True)
        except (Service.DoesNotExist, Barber.DoesNotExist):
            return Response(
                {"error": "Servicio o Barbero inválido/inactivo."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
        now = timezone.now()
        
        # Regla: RF-13 (Antelación mínima configurable)
        is_staff = hasattr(request.user, 'profile') and request.user.profile.role in ['admin', 'barbero']
        
        if not is_staff:
            from apps.users.models import BusinessConfig
            config, _ = BusinessConfig.objects.get_or_create(id=1)
            min_notice = config.min_booking_notice_minutes
            
            if start_datetime <= now + timedelta(minutes=min_notice):
                return Response(
                    {"error": f"La reserva requiere al menos {min_notice} minutos de antelación."},
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
        
        if future_appointments >= 3 and getattr(request.user, 'profile', None) and request.user.profile.role not in ['admin', 'barbero']:
            return Response(
                {"error": "Has alcanzado el límite de citas futuras (3)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RF-12: Prevención de overbooking transaccional pesimista
        try:
            with transaction.atomic():
                # Determinar el cliente (el admin puede especificar uno)
                client = request.user
                
                if is_staff and serializer.validated_data.get('client_id'):
                    from django.contrib.auth.models import User
                    try:
                        client = User.objects.get(id=serializer.validated_data['client_id'])
                    except User.DoesNotExist:
                        return Response({"error": "Cliente no encontrado."}, status=status.HTTP_404_NOT_FOUND)

                # Si es "Sin preferencia", buscar el primer disponible
                assigned_barber = None
                day_of_week = start_datetime.weekday()
                
                for b in barbers_to_check:
                    sched = b.schedules.filter(day_of_week=day_of_week, is_working=True).first()
                    if not sched: continue
                    
                    start_t = start_datetime.time()
                    end_t = end_datetime.time()
                    if start_t < sched.start_time or end_t > sched.end_time:
                        continue
                    
                    if sched.break_start and sched.break_end:
                        if (start_t < sched.break_end) and (end_t > sched.break_start):
                            continue
                    
                    existing_appts = Appointment.objects.select_for_update().filter(
                        barber=b,
                        start_datetime__date=start_datetime.date(),
                        status__in=['pendiente', 'confirmada']
                    )
                    
                    overlap = False
                    for appt in existing_appts:
                        if (start_datetime < appt.end_datetime) and (end_datetime > appt.start_datetime):
                            overlap = True
                            break
                    
                    if not overlap:
                        assigned_barber = b
                        break
                
                if not assigned_barber:
                    return Response(
                        {"error": "No hay barberos disponibles para este horario."},
                        status=status.HTTP_409_CONFLICT
                    )
                
                # Crear cita
                appointment = Appointment.objects.create(
                    client=client,
                    barber=assigned_barber,
                    service=service,
                    start_datetime=start_datetime,
                    end_datetime=end_datetime,
                    status='pendiente',
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
            
        is_staff = hasattr(request.user, 'profile') and request.user.profile.role in ['admin', 'barbero']
        
        # Validar 24h si el usuario es cliente
        if not is_staff:
            if appointment.start_datetime <= timezone.now() + timedelta(hours=24):
                return Response(
                    {"error": "No es posible cancelar con menos de 24h de antelación. Contacta con nosotros."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        appointment.status = 'cancelada'
        appointment.cancelled_by = 'admin' if is_staff else 'client'
        appointment.cancellation_reason = request.data.get('reason', '')
        appointment.save()
        
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        """RF-20: Marcar cita como completada (solo admin/barbero)."""
        if getattr(request.user, 'profile', None) and getattr(request.user.profile, 'role') not in ['admin', 'barbero']:
             return Response(status=status.HTTP_403_FORBIDDEN)
             
        appointment = self.get_object()
        if appointment.status not in ['confirmada', 'pendiente']:
            return Response({"error": "Solo se pueden completar citas confirmadas o pendientes."}, status=status.HTTP_400_BAD_REQUEST)
            
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
