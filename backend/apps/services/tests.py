"""
Tests para la app 'services': CRUD de servicios y permisos.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.services.models import Service
from apps.users.models import Profile


class ServiceModelTests(TestCase):
    """Tests unitarios del modelo Service."""

    def test_str_representation(self):
        """El __str__ muestra nombre, duración y precio."""
        service = Service.objects.create(
            name='Corte', duration_minutes=30, price=Decimal('15.00')
        )
        self.assertIn('Corte', str(service))
        self.assertIn('30', str(service))

    def test_clean_duracion_no_multiplo_15(self):
        """La validación clean() rechaza duraciones que no son múltiplo de 15."""
        service = Service(name='Test', duration_minutes=25, price=Decimal('10.00'))
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            service.clean()

    def test_clean_duracion_multiplo_15(self):
        """La validación clean() acepta duraciones múltiplo de 15."""
        service = Service(name='Test', duration_minutes=45, price=Decimal('10.00'))
        service.clean()  # No debe lanzar excepción


class ServiceAPITests(TestCase):
    """Tests de integración para el CRUD de servicios via API."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/services/'

        # Crear usuario admin
        self.admin_user = User.objects.create_user(
            username='admin', password='AdminPass1', email='admin@test.com'
        )
        Profile.objects.create(user=self.admin_user, role='admin')

        # Crear usuario cliente
        self.client_user = User.objects.create_user(
            username='cliente', password='ClientPass1', email='cliente@test.com'
        )
        Profile.objects.create(user=self.client_user, role='cliente')

        # Servicio de prueba
        self.service = Service.objects.create(
            name='Corte Clásico', duration_minutes=30, price=Decimal('15.00')
        )

    def test_listar_servicios_publico(self):
        """Cualquier usuario puede listar servicios activos."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_listar_solo_servicios_activos_para_cliente(self):
        """Un cliente solo ve los servicios activos."""
        Service.objects.create(
            name='Inactivo', duration_minutes=30,
            price=Decimal('10.00'), is_active=False
        )
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.url)
        nombres = [s['name'] for s in response.data['results']]
        self.assertNotIn('Inactivo', nombres)

    def test_admin_ve_servicios_inactivos(self):
        """Un admin ve todos los servicios, incluyendo inactivos."""
        Service.objects.create(
            name='Inactivo', duration_minutes=30,
            price=Decimal('10.00'), is_active=False
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        nombres = [s['name'] for s in response.data['results']]
        self.assertIn('Inactivo', nombres)

    def test_crear_servicio_como_admin(self):
        """Solo un admin puede crear servicios."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, {
            'name': 'Tinte', 'duration_minutes': 60, 'price': '25.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_crear_servicio_como_cliente_rechazado(self):
        """Un cliente no puede crear servicios."""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(self.url, {
            'name': 'Tinte', 'duration_minutes': 60, 'price': '25.00'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_crear_servicio_anonimo_rechazado(self):
        """Un usuario anónimo no puede crear servicios."""
        response = self.client.post(self.url, {
            'name': 'Tinte', 'duration_minutes': 60, 'price': '25.00'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_soft_delete_servicio(self):
        """DELETE desactiva el servicio en vez de eliminarlo de la BD."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'{self.url}{self.service.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.service.refresh_from_db()
        self.assertFalse(self.service.is_active)
