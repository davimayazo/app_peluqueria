from django.contrib import admin
from .models import Profile, BusinessConfig

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone', 'is_active')

@admin.register(BusinessConfig)
class BusinessConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email')
