from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('client', 'barber', 'service', 'start_datetime', 'status')
    list_filter = ('status', 'barber', 'start_datetime')
    search_fields = ('client__username', 'client__first_name')
