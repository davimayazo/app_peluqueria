from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Appointment(models.Model):
    """
    RF-10 a RF-13: Modelo de cita completo.
    Incluye snapshot del precio, campos de cancelación, y valoración.
    """
    STATUS_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    )
    CANCELLED_BY_CHOICES = (
        ('client', 'Cliente'),
        ('admin', 'Administrador'),
    )

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appointments',
    )
    barber = models.ForeignKey(
        'barbers.Barber',
        on_delete=models.CASCADE,
        related_name='appointments',
    )
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.PROTECT,
        related_name='appointments',
    )
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='confirmada',
    )
    price_at_booking = models.DecimalField(max_digits=8, decimal_places=2)
    cancellation_reason = models.TextField(blank=True, default='')
    cancelled_by = models.CharField(
        max_length=10,
        choices=CANCELLED_BY_CHOICES,
        blank=True,
        default='',
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    review = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_datetime']
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'

    def __str__(self):
        client_name = self.client.get_full_name() or self.client.username
        return (
            f"{client_name} → {self.barber.full_name} "
            f"({self.start_datetime:%d/%m/%Y %H:%M})"
        )
