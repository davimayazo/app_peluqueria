from django.db import models
from django.contrib.auth.models import User


class Barber(models.Model):
    """
    RF-08: Perfil de barbero.
    Un barbero puede opcionalmente estar vinculado a un User de Django.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='barber_profile',
    )
    full_name = models.CharField(max_length=150)
    bio = models.CharField(max_length=300, blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')
    specialties = models.JSONField(
        default=list,
        blank=True,
        help_text='Lista de especialidades como etiquetas.',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['full_name']
        verbose_name = 'Barbero'
        verbose_name_plural = 'Barberos'

    def __str__(self):
        return self.full_name


class BarberSchedule(models.Model):
    """
    Horario laboral semanal del barbero, incluyendo descansos.
    Un registro por día de la semana por barbero.
    """
    DAY_CHOICES = (
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    )

    barber = models.ForeignKey(
        Barber,
        on_delete=models.CASCADE,
        related_name='schedules',
    )
    day_of_week = models.SmallIntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_start = models.TimeField(
        null=True,
        blank=True,
        help_text='Hora de inicio del descanso (ej. 14:00).',
    )
    break_end = models.TimeField(
        null=True,
        blank=True,
        help_text='Hora de fin del descanso (ej. 15:00).',
    )
    is_working = models.BooleanField(default=True)

    class Meta:
        unique_together = ('barber', 'day_of_week')
        ordering = ['day_of_week']
        verbose_name = 'Horario de Barbero'
        verbose_name_plural = 'Horarios de Barberos'

    def __str__(self):
        return f"{self.barber.full_name} — {self.get_day_of_week_display()}"
