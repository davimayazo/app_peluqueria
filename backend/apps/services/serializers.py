from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """
    RF-06: Serializer con campos de presentación formateados.
    Valida múltiplos de 15 y rangos de duración.
    """
    price_display = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'duration_minutes', 'duration_display',
            'price', 'price_display', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_price_display(self, obj):
        return f"{obj.price:.2f} €"

    def get_duration_display(self, obj):
        return f"{obj.duration_minutes} min"

    def validate_duration_minutes(self, value):
        if value % 15 != 0:
            raise serializers.ValidationError(
                'La duración debe ser múltiplo de 15 minutos.'
            )
        if value < 15 or value > 240:
            raise serializers.ValidationError(
                'La duración debe estar entre 15 y 240 minutos.'
            )
        return value
