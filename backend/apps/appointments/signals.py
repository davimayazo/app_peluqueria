from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Appointment
from apps.users.models import BusinessConfig

@receiver(pre_save, sender=Appointment)
def grant_points_on_completion(sender, instance, **kwargs):
    if instance.pk:
        # La cita ya existe, comprobamos si el estado ha cambiado a 'completada'
        try:
            old_instance = Appointment.objects.get(pk=instance.pk)
            if old_instance.status != 'completada' and instance.status == 'completada':
                # La cita se acaba de marcar como completada
                config = BusinessConfig.objects.first()
                points_per_euro = config.points_per_euro if config else 1
                
                # Calcular puntos (precio * ratio)
                # Usamos price_at_booking ya que es el snapshot del precio
                earned_points = int(instance.price_at_booking * points_per_euro)
                
                # Sumar al perfil del cliente
                profile = instance.client.profile
                profile.points += earned_points
                profile.save()
                
                print(f"DEBUG: Otorgados {earned_points} puntos al usuario {instance.client.username}")
        except Appointment.DoesNotExist:
            pass
