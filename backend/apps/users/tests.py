"""
Tests para la app 'users': registro, login, perfil y permisos.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import Profile, BusinessConfig


class UserRegistrationTests(TestCase):
    """RF-01: Registro de usuarios con validación de contraseña."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.valid_data = {
            'username': 'nuevo_usuario',
            'email': 'nuevo@test.com',
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'password': 'Password1',
            'password_confirm': 'Password1',
        }

    def test_registro_exitoso(self):
        """Un usuario válido se registra correctamente y se crea su perfil."""
        response = self.client.post(self.register_url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='nuevo_usuario').exists())
        user = User.objects.get(username='nuevo_usuario')
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.role, 'cliente')

    def test_registro_email_duplicado(self):
        """No permite registrar dos usuarios con el mismo email."""
        User.objects.create_user('existente', 'nuevo@test.com', 'Password1')
        response = self.client.post(self.register_url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_username_duplicado(self):
        """No permite registrar dos usuarios con el mismo username."""
        User.objects.create_user('nuevo_usuario', 'otro@test.com', 'Password1')
        response = self.client.post(self.register_url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_passwords_no_coinciden(self):
        """Rechaza cuando las contraseñas no coinciden."""
        data = {**self.valid_data, 'password_confirm': 'OtraPass1'}
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_password_sin_mayuscula(self):
        """Rechaza contraseñas sin al menos una mayúscula."""
        data = {**self.valid_data, 'password': 'password1', 'password_confirm': 'password1'}
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_password_sin_minuscula(self):
        """Rechaza contraseñas sin al menos una minúscula."""
        data = {**self.valid_data, 'password': 'PASSWORD1', 'password_confirm': 'PASSWORD1'}
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_password_sin_numero(self):
        """Rechaza contraseñas sin al menos un número."""
        data = {**self.valid_data, 'password': 'Passwordd', 'password_confirm': 'Passwordd'}
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_password_muy_corta(self):
        """Rechaza contraseñas de menos de 8 caracteres."""
        data = {**self.valid_data, 'password': 'Pass1', 'password_confirm': 'Pass1'}
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthenticationTests(TestCase):
    """RF-02: Login y obtención de tokens JWT."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/v1/auth/login/'
        self.user = User.objects.create_user(
            username='testuser', password='Password1', email='test@test.com'
        )
        Profile.objects.create(user=self.user, role='cliente')

    def test_login_exitoso(self):
        """Login con credenciales válidas devuelve access y refresh tokens."""
        response = self.client.post(self.login_url, {
            'username': 'testuser', 'password': 'Password1'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_password_incorrecta(self):
        """Login con contraseña incorrecta es rechazado."""
        response = self.client.post(self.login_url, {
            'username': 'testuser', 'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_usuario_inexistente(self):
        """Login con usuario que no existe es rechazado."""
        response = self.client.post(self.login_url, {
            'username': 'noexiste', 'password': 'Password1'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(TestCase):
    """Perfil del usuario autenticado."""

    def setUp(self):
        self.client = APIClient()
        self.profile_url = '/api/v1/users/me/'
        self.user = User.objects.create_user(
            username='testuser', password='Password1',
            email='test@test.com', first_name='Test', last_name='User'
        )
        Profile.objects.create(user=self.user, role='cliente')

    def test_perfil_requiere_autenticacion(self):
        """El acceso al perfil sin token devuelve 401."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_perfil_con_autenticacion(self):
        """El usuario autenticado puede ver su propio perfil."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['profile']['role'], 'cliente')


class BusinessConfigTests(TestCase):
    """RF-24: Configuración del negocio."""

    def setUp(self):
        self.client = APIClient()
        self.config_url = '/api/v1/config/'

    def test_config_acceso_publico(self):
        """La configuración del negocio es accesible sin autenticación."""
        response = self.client.get(self.config_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_config_crea_default_si_no_existe(self):
        """Se crea una configuración por defecto si no existe ninguna."""
        self.assertFalse(BusinessConfig.objects.exists())
        response = self.client.get(self.config_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(BusinessConfig.objects.exists())
