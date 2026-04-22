from datetime import datetime, timedelta
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Barber, BarberSchedule
from apps.services.models import Service
from apps.appointments.models import Appointment
from .serializers import BarberSerializer, BarberCreateSerializer
from apps.users.permissions import IsAdminOrReadOnly


class BarberViewSet(viewsets.ModelViewSet):
    """
    RF-08 / RF-11: Gestión de Barberos y disponibilidad.
    - Clientes ven la lista y las disponibilidades.
    - Admin gestiona los perfiles y horarios completos.
    """
    queryset = Barber.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'specialties']
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BarberCreateSerializer
        return BarberSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'profile') and user.profile.role == 'admin':
            return Barber.objects.all()
        return Barber.objects.filter(is_active=True)

    @action(detail=True, methods=['get'])
    def slots(self, request, pk=None):
        """
        RF-11: Obtener slots disponibles para un barbero en una fecha.
        Requiere: ?date=YYYY-MM-DD y ?service_id=UUID/ID
        """
        barber = self.get_object()
        date_str = request.query_params.get('date')
        service_id = request.query_params.get('service_id')

        if not date_str or not service_id:
            return Response(
                {"error": "Los parámetros 'date' y 'service_id' son requeridos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            service = Service.objects.get(id=service_id, is_active=True)
        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Usa YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Service.DoesNotExist:
            return Response(
                {"error": "Servicio no encontrado o inactivo."},
                status=status.HTTP_404_NOT_FOUND,
            )

        day_of_week = target_date.weekday()
        schedule = BarberSchedule.objects.filter(
            barber=barber, day_of_week=day_of_week, is_working=True
        ).first()

        if not schedule:
            return Response({"slots": []})

        service_duration = service.duration_minutes
        step = 15  # Los slots se generan cada 15 min

        start_dt = datetime.combine(target_date, schedule.start_time)
        end_dt = datetime.combine(target_date, schedule.end_time)
        
        break_start_dt = None
        break_end_dt = None
        if schedule.break_start and schedule.break_end:
            break_start_dt = datetime.combine(target_date, schedule.break_start)
            break_end_dt = datetime.combine(target_date, schedule.break_end)

        # Usar timezone local para comparar de manera segura
        start_dt = timezone.make_aware(start_dt)
        end_dt = timezone.make_aware(end_dt)
        if break_start_dt:
            break_start_dt = timezone.make_aware(break_start_dt)
            break_end_dt = timezone.make_aware(break_end_dt)

        # Citas existentes para este día
        appointments = Appointment.objects.filter(
            barber=barber,
            start_datetime__date=target_date,
            status__in=['pendiente', 'confirmada']
        )
        booked_ranges = [
            (appt.start_datetime, appt.end_datetime)
            for appt in appointments
        ]

        slots = []
        current = start_dt

        # Aumentar minutos para evitar slots en el pasado si la fecha es hoy
        now = timezone.now()

        while current + timedelta(minutes=service_duration) <= end_dt:
            slot_end = current + timedelta(minutes=service_duration)
            is_valid = True

            # 1. ¿Está en el pasado? (Ignorar slots que ya pasaron hoy, con margen de 1 hora según RF-13)
            # Para simplificar, consideramos ahora. RF-13 requiere 1h antelación a nivel de reserva.
            if current <= now + timedelta(hours=1):
                is_valid = False

            # 2. ¿Se solapa con el descanso?
            if is_valid and break_start_dt and break_end_dt:
                if (current < break_end_dt) and (slot_end > break_start_dt):
                    is_valid = False

            # 3. ¿Se solapa con una cita existente?
            if is_valid:
                for b_start, b_end in booked_ranges:
                    if (current < b_end) and (slot_end > b_start):
                        is_valid = False
                        break
            
            if is_valid:
                slots.append(timezone.localtime(current).strftime('%H:%M'))

            current += timedelta(minutes=step)

        return Response({"date": date_str, "slots": slots})
