from rest_framework import serializers
from .models import Barber, BarberSchedule


class BarberScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = BarberSchedule
        fields = [
            'id', 'day_of_week', 'day_name',
            'start_time', 'end_time',
            'break_start', 'break_end',
            'is_working',
        ]


class BarberSerializer(serializers.ModelSerializer):
    """RF-08: Serializer del barbero con horarios incluidos."""
    schedules = BarberScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Barber
        fields = [
            'id', 'full_name', 'bio', 'avatar_url',
            'specialties', 'is_active', 'created_at', 'schedules',
        ]
        read_only_fields = ['id', 'created_at']


from django.contrib.auth.models import User
from apps.users.models import Profile

class BarberCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar barberos (admin)."""
    schedules = BarberScheduleSerializer(many=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = Barber
        fields = [
            'id', 'full_name', 'bio', 'avatar_url',
            'specialties', 'is_active', 'schedules',
            'email', 'password',
        ]

    def create(self, validated_data):
        schedules_data = validated_data.pop('schedules', [])
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        
        user = None
        if email and password:
            # Generar username a partir del email
            username = email.split('@')[0]
            # Asegurar que sea único en caso de colisión rápida
            if User.objects.filter(username=username).exists():
                username = f"{username}_{User.objects.count()}"
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=validated_data.get('full_name', '').split(' ')[0],
                last_name=' '.join(validated_data.get('full_name', '').split(' ')[1:])
            )
            # Crear perfil de barbero
            Profile.objects.create(user=user, role='barbero')

        barber = Barber.objects.create(user=user, **validated_data)
        
        for schedule_data in schedules_data:
            BarberSchedule.objects.create(barber=barber, **schedule_data)
            
        return barber

    def update(self, instance, validated_data):
        schedules_data = validated_data.pop('schedules', None)
        # No permitimos cambiar email/password por aquí por seguridad, 
        # se debe hacer desde la gestión de usuarios si es necesario.
        validated_data.pop('email', None)
        validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if schedules_data is not None:
            instance.schedules.all().delete()
            for schedule_data in schedules_data:
                BarberSchedule.objects.create(barber=instance, **schedule_data)

        return instance
