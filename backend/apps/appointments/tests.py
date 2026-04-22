"""
Tests para la app 'appointments': creación, cancelación, completar y valoración.
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.appointments.models import Appointment
from apps.barbers.models import Barber, BarberSchedule
from apps.services.models import Service
from apps.users.models import Profile


class AppointmentTestBase(TestCase):
    """Clase base con datos compartidos para los tests de citas."""

    def setUp(self):
        self.api_client = APIClient()
        self.url = '/api/v1/appointments/'

        # Admin
        self.admin_user = User.objects.create_user(
            username='admin', password='AdminPass1'
        )
        Profile.objects.create(user=self.admin_user, role='admin')

        # Cliente
        self.client_user = User.objects.create_user(
            username='cliente', password='ClientPass1'
        )
        Profile.objects.create(user=self.client_user, role='cliente')

        # Otro cliente
        self.other_client = User.objects.create_user(
            username='otro_cliente', password='ClientPass1'
        )
        Profile.objects.create(user=self.other_client, role='cliente')

        # Barbero y servicio
        self.barber = Barber.objects.create(full_name='Carlos López')
        self.service = Service.objects.create(
            name='Corte', duration_minutes=30, price=Decimal('15.00')
        )

        # Datetime futuro válido (3 días desde ahora para evitar la regla de 1h)
        self.future_dt = timezone.now() + timedelta(days=3)


class CreateAppointmentTests(AppointmentTestBase):
    """RF-10, RF-12, RF-13: Creación de citas y prevención de overbooking."""

    def test_crear_cita_exitosa(self):
        """Un cliente autenticado puede crear una cita válida."""
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': self.future_dt.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'confirmada')

    def test_crear_cita_sin_autenticacion(self):
        """Un usuario anónimo no puede crear citas."""
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': self.future_dt.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_cita_servicio_inexistente(self):
        """Rechaza si el servicio no existe."""
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(self.url, {
            'service_id': 9999,
            'barber_id': self.barber.id,
            'start_datetime': self.future_dt.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_antelacion_minima_1_hora(self):
        """RF-13: Rechaza citas con menos de 1 hora de antelación."""
        self.api_client.force_authenticate(user=self.client_user)
        too_soon = timezone.now() + timedelta(minutes=30)
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': too_soon.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('1 hora', response.data['error'])

    def test_antelacion_maxima_60_dias(self):
        """RF-13: Rechaza citas con más de 60 días de antelación."""
        self.api_client.force_authenticate(user=self.client_user)
        too_far = timezone.now() + timedelta(days=61)
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': too_far.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('60 días', response.data['error'])

    def test_limite_3_citas_futuras(self):
        """RF-13: Un cliente no puede tener más de 3 citas futuras activas."""
        self.api_client.force_authenticate(user=self.client_user)

        # Crear 3 citas
        for i in range(3):
            dt = timezone.now() + timedelta(days=3 + i)
            Appointment.objects.create(
                client=self.client_user, barber=self.barber, service=self.service,
                start_datetime=dt, end_datetime=dt + timedelta(minutes=30),
                status='confirmada', price_at_booking=self.service.price,
            )

        # La 4ª debe ser rechazada
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': (timezone.now() + timedelta(days=10)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('límite', response.data['error'])

    def test_overbooking_prevencion(self):
        """RF-12: No permite crear una cita que se solape con otra existente."""
        self.api_client.force_authenticate(user=self.client_user)

        # Crear primera cita
        Appointment.objects.create(
            client=self.other_client, barber=self.barber, service=self.service,
            start_datetime=self.future_dt,
            end_datetime=self.future_dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )

        # Intentar crear cita que se solapa
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': (self.future_dt + timedelta(minutes=15)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_precio_snapshot(self):
        """El precio registrado es el del momento de la reserva."""
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(self.url, {
            'service_id': self.service.id,
            'barber_id': self.barber.id,
            'start_datetime': self.future_dt.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['price_at_booking']), self.service.price)


class ListAppointmentTests(AppointmentTestBase):
    """Tests de listado de citas con filtrado por rol."""

    def test_cliente_solo_ve_sus_citas(self):
        """Un cliente solo ve sus propias citas."""
        # Cita del cliente
        Appointment.objects.create(
            client=self.client_user, barber=self.barber, service=self.service,
            start_datetime=self.future_dt,
            end_datetime=self.future_dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )
        # Cita de otro
        Appointment.objects.create(
            client=self.other_client, barber=self.barber, service=self.service,
            start_datetime=self.future_dt + timedelta(hours=2),
            end_datetime=self.future_dt + timedelta(hours=2, minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )

        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.get(self.url)
        self.assertEqual(len(response.data['results']), 1)

    def test_admin_ve_todas_las_citas(self):
        """Un admin ve todas las citas del sistema."""
        Appointment.objects.create(
            client=self.client_user, barber=self.barber, service=self.service,
            start_datetime=self.future_dt,
            end_datetime=self.future_dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )
        Appointment.objects.create(
            client=self.other_client, barber=self.barber, service=self.service,
            start_datetime=self.future_dt + timedelta(hours=2),
            end_datetime=self.future_dt + timedelta(hours=2, minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )

        self.api_client.force_authenticate(user=self.admin_user)
        response = self.api_client.get(self.url)
        self.assertEqual(len(response.data['results']), 2)


class CancelAppointmentTests(AppointmentTestBase):
    """RF-18: Cancelación de citas."""

    def _create_appointment(self, client, dt_offset_days=5):
        dt = timezone.now() + timedelta(days=dt_offset_days)
        return Appointment.objects.create(
            client=client, barber=self.barber, service=self.service,
            start_datetime=dt, end_datetime=dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )

    def test_cancelar_cita_con_24h_antelacion(self):
        """Un cliente puede cancelar con más de 24h de antelación."""
        appt = self._create_appointment(self.client_user, dt_offset_days=5)
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.patch(f'{self.url}{appt.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelada')

    def test_no_cancelar_con_menos_24h(self):
        """Un cliente no puede cancelar con menos de 24h de antelación."""
        dt = timezone.now() + timedelta(hours=12)
        appt = Appointment.objects.create(
            client=self.client_user, barber=self.barber, service=self.service,
            start_datetime=dt, end_datetime=dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.patch(f'{self.url}{appt.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_puede_cancelar_siempre(self):
        """Un admin puede cancelar sin restricción de tiempo."""
        dt = timezone.now() + timedelta(hours=2)
        appt = Appointment.objects.create(
            client=self.client_user, barber=self.barber, service=self.service,
            start_datetime=dt, end_datetime=dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )
        self.api_client.force_authenticate(user=self.admin_user)
        response = self.api_client.patch(f'{self.url}{appt.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['cancelled_by'], 'admin')

    def test_no_cancelar_cita_ya_cancelada(self):
        """No se puede cancelar una cita que ya está cancelada."""
        appt = self._create_appointment(self.client_user)
        appt.status = 'cancelada'
        appt.save()
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.patch(f'{self.url}{appt.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReviewAppointmentTests(AppointmentTestBase):
    """RF-17: Valoración de citas completadas."""

    def _create_completed_appointment(self, client):
        dt = timezone.now() - timedelta(days=1)
        return Appointment.objects.create(
            client=client, barber=self.barber, service=self.service,
            start_datetime=dt, end_datetime=dt + timedelta(minutes=30),
            status='completada', price_at_booking=self.service.price,
        )

    def test_valorar_cita_completada(self):
        """Un cliente puede valorar su cita completada."""
        appt = self._create_completed_appointment(self.client_user)
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(f'{self.url}{appt.id}/review/', {
            'rating': 5, 'review': 'Excelente servicio'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 5)

    def test_no_valorar_cita_no_completada(self):
        """No se puede valorar una cita que no está completada."""
        dt = timezone.now() + timedelta(days=3)
        appt = Appointment.objects.create(
            client=self.client_user, barber=self.barber, service=self.service,
            start_datetime=dt, end_datetime=dt + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(f'{self.url}{appt.id}/review/', {
            'rating': 5
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_valorar_cita_ajena(self):
        """Un cliente no puede valorar la cita de otro cliente."""
        appt = self._create_completed_appointment(self.other_client)
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(f'{self.url}{appt.id}/review/', {
            'rating': 5
        })
        # El queryset filtra por client=user, así que la cita de otro cliente no se encuentra
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rating_fuera_de_rango(self):
        """No se aceptan ratings fuera del rango 1-5."""
        appt = self._create_completed_appointment(self.client_user)
        self.api_client.force_authenticate(user=self.client_user)
        response = self.api_client.post(f'{self.url}{appt.id}/review/', {
            'rating': 6
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
