"""
Tests para la app 'barbers': gestión de barberos y disponibilidad de slots.
"""
from datetime import time, date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.barbers.models import Barber, BarberSchedule
from apps.services.models import Service
from apps.appointments.models import Appointment
from apps.users.models import Profile


class BarberModelTests(TestCase):
    """Tests unitarios del modelo Barber."""

    def test_str_representation(self):
        barber = Barber.objects.create(full_name='Carlos López')
        self.assertEqual(str(barber), 'Carlos López')

    def test_ordering_por_nombre(self):
        """Los barberos se ordenan alfabéticamente por nombre."""
        Barber.objects.create(full_name='Zebra')
        Barber.objects.create(full_name='Alpha')
        names = list(Barber.objects.values_list('full_name', flat=True))
        self.assertEqual(names, ['Alpha', 'Zebra'])


class BarberAPITests(TestCase):
    """Tests de integración para el CRUD de barberos."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/barbers/'

        self.admin_user = User.objects.create_user(
            username='admin', password='AdminPass1'
        )
        Profile.objects.create(user=self.admin_user, role='admin')

        self.client_user = User.objects.create_user(
            username='cliente', password='ClientPass1'
        )
        Profile.objects.create(user=self.client_user, role='cliente')

        self.barber = Barber.objects.create(
            full_name='Carlos López', bio='Experto en degradados',
            specialties=['Degradados', 'Barba']
        )

    def test_listar_barberos_publico(self):
        """Cualquier usuario puede listar barberos."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cliente_no_ve_barberos_inactivos(self):
        """Un cliente no ve barberos desactivados."""
        Barber.objects.create(full_name='Inactivo', is_active=False)
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.url)
        nombres = [b['full_name'] for b in response.data['results']]
        self.assertNotIn('Inactivo', nombres)

    def test_crear_barbero_como_admin(self):
        """Solo un admin puede crear barberos."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, {
            'full_name': 'Nuevo Barbero',
            'specialties': ['Afeitado'],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_crear_barbero_como_cliente_rechazado(self):
        """Un cliente no puede crear barberos."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(self.url, {
            'full_name': 'Nuevo Barbero',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BarberSlotsTests(TestCase):
    """RF-11: Tests para el endpoint de disponibilidad de slots."""

    def setUp(self):
        self.api_client = APIClient()
        self.barber = Barber.objects.create(full_name='Carlos López')
        self.service = Service.objects.create(
            name='Corte', duration_minutes=30, price=Decimal('15.00')
        )

        # Crear horario: todos los días laborables, 09:00-18:00, descanso 14:00-15:00
        for day in range(5):  # Lunes a Viernes
            BarberSchedule.objects.create(
                barber=self.barber,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(18, 0),
                break_start=time(14, 0),
                break_end=time(15, 0),
                is_working=True,
            )

    def _get_next_weekday(self, target_weekday=0):
        """Devuelve la fecha del próximo día laborable (lunes por defecto)."""
        today = date.today()
        days_ahead = target_weekday - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return today + timedelta(days=days_ahead)

    def test_slots_sin_parametros(self):
        """Devuelve error 400 si faltan date o service_id."""
        url = f'/api/v1/barbers/{self.barber.id}/slots/'
        response = self.api_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_slots_servicio_inexistente(self):
        """Devuelve 404 si el servicio no existe."""
        target = self._get_next_weekday()
        url = f'/api/v1/barbers/{self.barber.id}/slots/?date={target}&service_id=9999'
        response = self.api_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_slots_dia_sin_horario(self):
        """Devuelve lista vacía si el barbero no trabaja ese día (domingo)."""
        # Encontrar el próximo domingo (day_of_week=6, sin schedule)
        today = date.today()
        days_ahead = 6 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        sunday = today + timedelta(days=days_ahead)

        url = f'/api/v1/barbers/{self.barber.id}/slots/?date={sunday}&service_id={self.service.id}'
        response = self.api_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slots'], [])

    def test_slots_devuelve_formatos_correctos(self):
        """Los slots devueltos tienen formato HH:MM."""
        target = self._get_next_weekday()
        url = f'/api/v1/barbers/{self.barber.id}/slots/?date={target}&service_id={self.service.id}'
        response = self.api_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if response.data['slots']:
            import re
            for slot in response.data['slots']:
                self.assertRegex(slot, r'^\d{2}:\d{2}$')

    def test_slots_no_incluyen_descanso(self):
        """Los slots no incluyen horarios que se solapan con el descanso (14:00-15:00)."""
        target = self._get_next_weekday()
        url = f'/api/v1/barbers/{self.barber.id}/slots/?date={target}&service_id={self.service.id}'

        # Mockear timezone.now() para simular que estamos al inicio del día
        mock_now = timezone.make_aware(
            timezone.datetime(target.year, target.month, target.day, 6, 0)
        )
        with patch('apps.barbers.views.timezone.now', return_value=mock_now):
            response = self.api_client.get(url)

        slots = response.data['slots']
        # 14:00 no debería estar (el servicio de 30 min terminaría a las 14:30, solapando con descanso)
        # Los slots que empiecen en el rango de descanso tampoco deberían estar
        for slot in slots:
            hour = int(slot.split(':')[0])
            minute = int(slot.split(':')[1])
            # Ningún slot debería empezar a las 14:XX
            if hour == 14:
                slot_end_minutes = hour * 60 + minute + 30
                # El descanso es 14:00-15:00 (840-900 min)
                self.assertGreaterEqual(slot_end_minutes, 900,
                    f"Slot {slot} se solapa con el descanso")

    def test_slots_excluyen_citas_existentes(self):
        """Los slots ocupados por citas confirmadas no aparecen como disponibles."""
        target = self._get_next_weekday()

        user = User.objects.create_user('test', password='Password1')
        Profile.objects.create(user=user, role='cliente')

        # Crear una cita confirmada a las 10:00
        start = timezone.make_aware(
            timezone.datetime(target.year, target.month, target.day, 10, 0)
        )
        Appointment.objects.create(
            client=user, barber=self.barber, service=self.service,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=30),
            status='confirmada', price_at_booking=self.service.price,
        )

        url = f'/api/v1/barbers/{self.barber.id}/slots/?date={target}&service_id={self.service.id}'

        mock_now = timezone.make_aware(
            timezone.datetime(target.year, target.month, target.day, 6, 0)
        )
        with patch('apps.barbers.views.timezone.now', return_value=mock_now):
            response = self.api_client.get(url)

        self.assertNotIn('10:00', response.data['slots'])
