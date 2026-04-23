from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    """
    Extensión del modelo User de Django.
    Almacena rol, teléfono, barbero favorito y estado de la cuenta.
    """
    ROLE_CHOICES = (
        ('cliente', 'Cliente'),
        ('admin', 'Administrador'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cliente')
    phone = models.CharField(max_length=20, blank=True, default='')
    favorite_barber = models.ForeignKey(
        'barbers.Barber',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='favorited_by',
    )
    is_active = models.BooleanField(default=True)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil'
        verbose_name_plural = 'Perfiles'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_role_display()})"


class BusinessConfig(models.Model):
    """
    RF-24: Configuración general del negocio.
    Se usa en plantillas de email y en el footer de la app.
    """
    name = models.CharField(max_length=100, default='BarberBook')
    address = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    logo_url = models.URLField(blank=True, default='')
    description = models.TextField(max_length=500, blank=True, default='')
    min_booking_notice_minutes = models.PositiveIntegerField(default=60) # RF-13

    # Dashboard Widgets Config
    show_appointments_widget = models.BooleanField(default=True)
    show_revenue_widget = models.BooleanField(default=True)
    show_services_widget = models.BooleanField(default=True)
    show_staff_widget = models.BooleanField(default=True)
    show_new_customers_widget = models.BooleanField(default=True)
    show_agenda_widget = models.BooleanField(default=True)
    points_per_euro = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración del Negocio'
        verbose_name_plural = 'Configuración del Negocio'

    def __str__(self):
        return self.name
