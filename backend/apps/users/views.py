from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from .models import BusinessConfig
from .serializers import BusinessConfigSerializer

class RegisterView(generics.CreateAPIView):
    """
    RF-01: Endpoint público para registrar nuevos usuarios clientes.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Obtiene o actualiza el perfil del usuario autenticado.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """
    RF-03: Cierra sesión revocando el refresh token actual.
    (El access token no se puede revocar en JWT stateless, expira solo).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class BusinessConfigView(generics.RetrieveUpdateAPIView):
    """
    RF-24: Configuración general del negocio.
    """
    serializer_class = BusinessConfigSerializer
    permission_classes = [permissions.AllowAny] # Lectura pública

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [permissions.IsAuthenticated()] # TODO: IsAdmin
        return [permissions.AllowAny()]

    def get_object(self):
        obj, created = BusinessConfig.objects.get_or_create(id=1)
        return obj

class UsersListView(generics.ListAPIView):
    """
    RF-23: Lista de usuarios (sólo para administradores).
    """
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated] 

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Permite al admin gestionar un usuario específico.
    """
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated] # TODO: Add IsAdmin
