"""
Configuración de desarrollo local para BarberBook.
Extiende la configuración base con valores permisivos para desarrollo.
"""

from .base import *  # noqa: F401, F403
from datetime import timedelta

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Base de datos SQLite para desarrollo (migrable a PostgreSQL en producción)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS permisivo solo en desarrollo
CORS_ALLOW_ALL_ORIGINS = True

# Token más largo en desarrollo para comodidad
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(days=1)
