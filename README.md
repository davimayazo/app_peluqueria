# BarberBook 💈

Sistema premium de reserva de citas para peluquerías. Permite a los clientes reservar citas online, y a los administradores gestionar barberos, servicios y agenda.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | Django 5 + Django REST Framework |
| **Autenticación** | JWT (SimpleJWT) |
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Estado** | Zustand (auth) + React Query (server state) |
| **Estilos** | Tailwind CSS 3 |
| **Validación** | Zod + React Hook Form |

## Requisitos Previos

- Python 3.11+
- Node.js 18+
- npm 9+

## Instalación

### Backend

```bash
# Crear y activar entorno virtual
cd backend
python -m venv ../venv
..\venv\Scripts\activate   # Windows
# source ../venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements/dev.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores

# Aplicar migraciones y datos iniciales
python manage.py migrate
python seed_db.py

# Levantar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000/api/v1/
- **Admin Django:** http://localhost:8000/admin/

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Requerida |
|---|---|---|
| `DJANGO_SECRET_KEY` | Clave secreta de Django | ✅ |
| `DJANGO_SETTINGS_MODULE` | Módulo de settings a usar | ✅ |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos (separados por coma) | Producción |
| `DB_NAME` | Nombre de la base de datos | Producción |
| `DB_USER` | Usuario de la base de datos | Producción |
| `DB_PASSWORD` | Contraseña de la base de datos | Producción |
| `DB_HOST` | Host de la base de datos | Producción |
| `DB_PORT` | Puerto de la base de datos | Producción |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | Producción |

## Estructura del Proyecto

```
APP_PELUQUERIA/
├── backend/
│   ├── apps/
│   │   ├── users/          # Autenticación, perfiles, config negocio
│   │   ├── services/       # Catálogo de servicios
│   │   ├── barbers/        # Barberos y horarios
│   │   └── appointments/   # Gestión de citas
│   ├── config/
│   │   └── settings/       # base.py, dev.py, prod.py
│   └── requirements/       # base.txt, dev.txt
├── frontend/
│   ├── app/                # Páginas (App Router)
│   ├── components/         # Componentes reutilizables
│   ├── lib/                # Cliente API y utilidades
│   ├── store/              # Estado global (Zustand)
│   └── types/              # Interfaces TypeScript
└── README.md
```

## API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/register/` | Registro de usuario |
| `POST` | `/api/v1/auth/login/` | Obtener tokens JWT |
| `POST` | `/api/v1/auth/refresh/` | Refrescar access token |
| `GET` | `/api/v1/users/me/` | Perfil del usuario autenticado |
| `GET` | `/api/v1/services/` | Listar servicios |
| `GET` | `/api/v1/barbers/` | Listar barberos |
| `GET` | `/api/v1/barbers/:id/slots/` | Slots disponibles |
| `GET/POST` | `/api/v1/appointments/` | Listar/crear citas |

## Licencia

Proyecto privado — Todos los derechos reservados.
