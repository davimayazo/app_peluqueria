from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer de lectura con nombre del cliente, barbero y servicio."""
    client_name = serializers.SerializerMethodField()
    barber_name = serializers.CharField(source='barber.full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(
        source='service.duration_minutes', read_only=True,
    )

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'barber', 'service',
            'client_name', 'barber_name', 'service_name', 'service_duration',
            'start_datetime', 'end_datetime', 'status',
            'price_at_booking', 'cancellation_reason', 'cancelled_by',
            'rating', 'review', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'client', 'end_datetime', 'price_at_booking',
            'cancellation_reason', 'cancelled_by', 'created_at', 'updated_at',
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name() or obj.client.username


class CreateAppointmentSerializer(serializers.Serializer):
    """Serializer de entrada para crear una cita (RF-10)."""
    service_id = serializers.IntegerField()
    barber_id = serializers.IntegerField()
    start_datetime = serializers.DateTimeField()


class ReviewSerializer(serializers.Serializer):
    """Serializer para valorar una cita completada (RF-17)."""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(max_length=200, required=False, default='')
