"""URL Configuration principal de BarberBook."""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.services.urls')),
    path('api/v1/', include('apps.barbers.urls')),
    path('api/v1/', include('apps.appointments.urls')),
    path('api/v1/products/', include('apps.products.urls')),
]
