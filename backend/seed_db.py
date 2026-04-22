import os
import django
from datetime import time

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.users.models import Profile, BusinessConfig
from apps.barbers.models import Barber, BarberSchedule
from apps.services.models import Service

def seed():
    print("Iniciando seed de la base de datos...")

    # 1. Eliminar datos existentes
    print("Limpiando datos existentes...")
    User.objects.all().delete()
    Service.objects.all().delete()
    BusinessConfig.objects.all().delete()
    # Profile y Barber (vinculado a User) se borran en cascada

    # 2. Configuración de negocio (RF-24)
    print("Creando configuración del negocio...")
    BusinessConfig.objects.create(
        name="BarberBook Elite",
        address="Calle Principal 123, Madrid",
        phone="+34 600 123 456",
        email="contacto@barberbook.es",
        description="Tu barbería de confianza con el mejor estilo."
    )

    # 3. Crear usuario administrador
    print("Creando usuario administrador (admin/admin)...")
    admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    # Actualizar el perfil (se crea vía signal o en el serializer de registro, pero superuser no pasa por el serializer de API)
    admin_profile, _ = Profile.objects.get_or_create(user=admin_user)
    admin_profile.role = 'admin'
    admin_profile.save()

    # 4. Crear cliente de prueba
    print("Creando cliente de prueba (cliente/cliente)...")
    cliente = User.objects.create_user('cliente', 'cliente@example.com', 'cliente')
    cliente_profile, _ = Profile.objects.get_or_create(user=cliente)
    cliente_profile.role = 'cliente'
    cliente_profile.save()

    # 5. Crear Servicios (RF-06)
    print("Creando servicios...")
    services = [
        {"name": "Corte Clásico", "description": "Corte de pelo tradicional a tijera o máquina.", "duration_minutes": 30, "price": 15.00},
        {"name": "Arreglo de Barba", "description": "Perfilado y recorte de barba con toalla caliente.", "duration_minutes": 30, "price": 12.00},
        {"name": "Corte + Barba", "description": "El paquete completo para salir perfecto.", "duration_minutes": 60, "price": 25.00},
        {"name": "Tinte de Pelo", "description": "Coloración profesional.", "duration_minutes": 60, "price": 30.00},
    ]
    for s in services:
        Service.objects.create(**s)

    # 6. Crear Barberos y sus horarios (RF-08)
    print("Creando barberos y horarios...")
    barbers = [
        {
            "full_name": "Carlos Ruiz",
            "bio": "Especialista en cortes clásicos y afeitado tradicional.",
            "specialties": ["Clásico", "Afeitado"],
        },
        {
            "full_name": "Marcos Díaz",
            "bio": "Experto en degradados y estilos modernos.",
            "specialties": ["Fade", "Moderno"],
        },
        {
            "full_name": "Javier López",
            "bio": "Maestro del color y tratamientos capilares.",
            "specialties": ["Color", "Tratamientos"],
        }
    ]

    for b_data in barbers:
        barber = Barber.objects.create(
            full_name=b_data["full_name"],
            bio=b_data["bio"],
            specialties=b_data["specialties"]
        )
        
        # Horari de Lunes (0) a Viernes (4)
        for day in range(5):
            BarberSchedule.objects.create(
                barber=barber,
                day_of_week=day,
                start_time=time(10, 0),        # Inicio a las 10:00
                end_time=time(19, 0),          # Fin a las 19:00
                break_start=time(14, 0),       # Descanso 14:00 - 15:00
                break_end=time(15, 0),
                is_working=True
            )
        
        # Sábado (5) - Medio día sin descanso
        BarberSchedule.objects.create(
            barber=barber,
            day_of_week=5,
            start_time=time(10, 0),
            end_time=time(14, 0),
            is_working=True
        )
        # Domingo (6) - descanso (no creamos o is_working=False)
        BarberSchedule.objects.create(
            barber=barber,
            day_of_week=6,
            start_time=time(0, 0),
            end_time=time(0, 0),
            is_working=False
        )

    print("Base de datos inicializada correctamente.")

if __name__ == '__main__':
    seed()
