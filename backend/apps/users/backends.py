from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    """
    Permite la autenticación usando el correo electrónico en lugar del nombre de usuario.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # El parámetro 'username' puede contener el email
        email = username or kwargs.get('email')
        try:
            # Buscar al usuario por email
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Si no existe por email, intentar por username (para compatibilidad con admin)
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Verificar la contraseña
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
