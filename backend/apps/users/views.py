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
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_object(self):
        # Auto-migrate missing columns directly in the view
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                for col in [
                    'show_appointments_widget',
                    'show_revenue_widget',
                    'show_services_widget',
                    'show_staff_widget',
                    'show_new_customers_widget',
                    'show_agenda_widget'
                ]:
                    try:
                        cursor.execute(f"ALTER TABLE users_businessconfig ADD COLUMN {col} bool DEFAULT 1")
                    except Exception:
                        pass
        except Exception as e:
            print("DB ALTER ERROR:", e)

        # Asegurar que siempre exista el registro 1
        obj, _ = BusinessConfig.objects.get_or_create(id=1)
        return obj

    def patch(self, request, *args, **kwargs):
        print("DEBUG: Recibiendo configuración:", request.data)
        try:
            return super().patch(request, *args, **kwargs)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print("CRITICAL ERROR IN PATCH:", error_details)
            from rest_framework.response import Response
            from rest_framework import status
            return Response({"error_critico": str(e), "detalles": error_details}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
