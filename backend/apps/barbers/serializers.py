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


class BarberCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar barberos (admin)."""
    schedules = BarberScheduleSerializer(many=True, required=False)

    class Meta:
        model = Barber
        fields = [
            'id', 'full_name', 'bio', 'avatar_url',
            'specialties', 'is_active', 'schedules',
        ]

    def create(self, validated_data):
        schedules_data = validated_data.pop('schedules', [])
        barber = Barber.objects.create(**validated_data)
        for schedule_data in schedules_data:
            BarberSchedule.objects.create(barber=barber, **schedule_data)
        return barber

    def update(self, instance, validated_data):
        schedules_data = validated_data.pop('schedules', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if schedules_data is not None:
            instance.schedules.all().delete()
            for schedule_data in schedules_data:
                BarberSchedule.objects.create(barber=instance, **schedule_data)

        return instance
