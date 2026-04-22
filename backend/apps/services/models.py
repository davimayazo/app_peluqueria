from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator


class Service(models.Model):
    """
    RF-06/RF-07: Servicio de peluquería con soft-delete.
    La duración debe ser múltiplo de 15 minutos (entre 15 y 240).
    """
    name = models.CharField(max_length=60, unique=True)
    description = models.TextField(max_length=500, blank=True, default='')
    duration_minutes = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(15), MaxValueValidator(240)],
        help_text='Duración en minutos (múltiplo de 15, entre 15 y 240).',
    )
    price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'

    def __str__(self):
        return f"{self.name} ({self.duration_minutes} min — {self.price} €)"

    def clean(self):
        if self.duration_minutes and self.duration_minutes % 15 != 0:
            raise ValidationError({
                'duration_minutes': 'La duración debe ser múltiplo de 15 minutos.',
            })
