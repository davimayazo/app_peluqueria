from django.contrib import admin
from .models import Barber, BarberSchedule

class BarberScheduleInline(admin.TabularInline):
    model = BarberSchedule
    extra = 7
    max_num = 7

@admin.register(Barber)
class BarberAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'is_active', 'user')
    inlines = [BarberScheduleInline]
