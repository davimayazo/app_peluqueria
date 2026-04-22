# Plan de Implementación — BarberBook v1.0

## Descripción del Proyecto

BarberBook es una aplicación web full-stack para la gestión de citas de peluquería. Permite a clientes reservar, gestionar y cancelar citas de forma autónoma, mientras el barbero/admin gestiona su agenda y negocio desde un panel centralizado.

**Stack tecnológico (según SRS):** Django REST (backend) · Next.js 14 (frontend) · Supabase (PostgreSQL + Auth + Storage)

---

## Análisis del Diseño UX de Referencia

La imagen `diseño_ux.png` muestra un dashboard de estilo premium con las siguientes características visuales que adoptaremos y adaptaremos al contexto de peluquería:

| Elemento Visual | Adaptación a BarberBook |
|----------------|------------------------|
| **Fondo degradado suave** (tonos verdes/lila pastel) | Fondo degradado con tonos cálidos ámbar/dorado y negro (temática barbería) |
| **Sidebar lateral** con iconos + texto y elemento activo resaltado | Sidebar con navegación: Dashboard, Agenda, Servicios, Barberos, Clientes, Configuración |
| **Tarjetas de métricas** con iconos 3D/ilustrados y porcentajes comparativos | Tarjetas: Citas Hoy, Ingresos del Día, Citas Completadas, Cancelaciones |
| **Gráfico de barras** con datos semanales y tooltips | Gráfico de citas por día de la semana actual |
| **Gráfico circular/donut** con porcentajes | Distribución de servicios más populares |
| **Tabla de datos** con búsqueda, filtros y acciones | Tabla de próximas citas con búsqueda y filtros |
| **Glassmorphism** en tarjetas y componentes | Aplicado en cards, modales y sidebar |
| **Tarjeta flotante "Expert Insights"** | Tarjeta de resumen rápido / acciones rápidas |
| **Barra superior** con búsqueda, notificaciones y avatar de usuario | Header con búsqueda, campana de notificaciones y perfil |

---

## Decisiones de Diseño

> [!IMPORTANT]
> ### Paleta de Colores — Temática Barbería Premium
> Se usará una paleta oscura con acentos dorados/ámbar para transmitir elegancia y profesionalidad:
> - **Primary:** `#C8A97E` (oro viejo / ámbar)
> - **Background:** `#0F0F0F` a `#1A1A2E` (negro con toque azulado)
> - **Surface:** `rgba(255,255,255,0.05)` (glassmorphism)
> - **Text:** `#F5F5F5` (blanco suave)
> - **Success:** `#4CAF50` | **Warning:** `#FF9800` | **Error:** `#EF5350`
> - **Accent secundario:** `#7C4DFF` (violeta premium)

### Tipografía
- **Headings:** `Playfair Display` (serif elegante)
- **Body:** `Inter` (sans-serif moderna y legible)

---

## Fases de Desarrollo

### Fase 1 — Inicialización del Proyecto (Backend + Frontend)

#### Backend Django

##### [NEW] `barberbook-backend/` — Proyecto Django completo

- Estructura modular: `config/` para settings, `apps/` para cada módulo
- Apps Django: `users`, `services`, `barbers`, `appointments`, `notifications`
- Settings separados: `base.py`, `dev.py`, `prod.py`
- Dependencias: Django 5+, DRF, simplejwt, drf-spectacular, celery, redis, supabase-py

##### Archivos clave:
- `config/settings/base.py` — Configuración base con Supabase
- `config/urls.py` — Router principal con prefijo `/api/v1/`
- `requirements/base.txt`, `dev.txt`, `prod.txt`
- `Dockerfile` para despliegue

---

#### Frontend Next.js

##### [NEW] `barberbook-frontend/` — Proyecto Next.js 14 con App Router

- TypeScript en modo estricto
- Tailwind CSS v3 con variables CSS personalizadas (según SRS)
- React Query v5 (TanStack Query)
- React Hook Form + Zod para formularios
- date-fns para manejo de fechas

---

### Fase 2 — Backend: Modelos y API REST

#### 2.1 App `users` (M-01: Autenticación)
- Modelo `Profile` sincronizado con Supabase Auth
- Endpoints: registro, login, refresh, logout, recuperación contraseña
- Middleware de verificación JWT contra JWKS de Supabase
- Decoradores de permisos por rol (`@role_required('admin')`)

#### 2.2 App `services` (M-02: Catálogo)
- Modelo `Service` con soft-delete
- ViewSet REST con CRUD completo
- Filtros por precio, duración; ordenamiento por nombre, precio, duración
- Datos semilla: Corte Fade, Arreglo de barba, Corte + Barba, Tinte

#### 2.3 App `barbers` (M-03: Barberos)
- Modelos `Barber` y `BarberSchedule`
- Lógica de cálculo de slots disponibles (RF-11)
- Endpoint `/barbers/{id}/slots/?date=YYYY-MM-DD&service_id=UUID`

#### 2.4 App `appointments` (M-04: Motor de Reservas)
- Modelo `Appointment` con estados y transiciones
- Prevención de overbooking con `SELECT FOR UPDATE`
- Reglas de negocio: máx 3 citas futuras, mín 1h antelación, máx 60 días futuro
- Endpoints: crear, cancelar, completar, valorar

#### 2.5 App `notifications` (M-05: Emails)
- Tareas Celery: confirmación, recordatorio (24h antes), cancelación
- Plantillas HTML responsive para emails
- Integración con Resend/SendGrid

---

### Fase 3 — Frontend: Páginas y Componentes

#### 3.1 Layout y Diseño Global
- **Layout principal** con sidebar (admin) / navbar (cliente)
- **Sistema de diseño** en `globals.css`: tokens CSS, animaciones, glassmorphism
- **Componentes UI primitivos:** Button, Input, Modal, Badge, Card, Avatar, Skeleton

#### 3.2 Páginas Públicas
- **Landing page** (`/`) — Hero section, catálogo highlight, CTA de reserva
- **Catálogo** (`/servicios`) — Grid de tarjetas con filtros y ordenamiento
- **Login** (`/login`) — Formulario con validación Zod
- **Registro** (`/registro`) — Formulario con validación de contraseña
- **Recuperar contraseña** (`/recuperar-contrasena`)

#### 3.3 Panel de Cliente
- **Mis Citas** (`/dashboard/citas`) — Tabs "Próximas" / "Pasadas" con acciones
- **Nueva Reserva** (`/dashboard/reservar`) — Wizard de 4 pasos:
  1. Selección de servicio
  2. Selección de barbero (con favorito preseleccionado)
  3. Calendario + slots horarios
  4. Resumen y confirmación
- **Mi Perfil** (`/dashboard/perfil`) — Edición de datos y favorito

#### 3.4 Panel de Administración
- **Dashboard** (`/admin`) — Métricas, gráficos, próximas citas (diseño tipo UX reference)
- **Agenda** (`/admin/agenda`) — Timeline visual por día y barbero (RF-19)
- **Servicios** (`/admin/servicios`) — CRUD de servicios
- **Barberos** (`/admin/barberos`) — CRUD de barberos y horarios
- **Clientes** (`/admin/clientes`) — Lista de usuarios con gestión de roles
- **Configuración** (`/admin/configuracion`) — Datos del negocio

#### 3.5 Componentes Especializados
- `BookingWizard` — Flujo de reserva paso a paso con progreso visual
- `CalendarPicker` — Calendario interactivo con días disponibles resaltados
- `TimeSlotGrid` — Grid de slots horarios con estados visuales
- `AgendaTimeline` — Vista tipo timeline para agenda del barbero
- `MetricsCard` — Tarjeta de métrica con icono, valor y comparativa
- `BarChart` / `DonutChart` — Gráficos con Chart.js o Recharts

---

### Fase 4 — Integración Supabase

- Configuración de proyecto Supabase
- Tablas y migraciones SQL según modelo de datos del SRS (5.3)
- Políticas RLS por tabla
- Supabase Auth config: email/password, verificación de email
- Supabase Storage: buckets para avatars y logos
- Edge Functions para jobs programados (recordatorios)

---

### Fase 5 — Testing y QA

- Tests unitarios backend (>80% cobertura de lógica de negocio)
- Tests de integración endpoints API
- Tests E2E con Playwright (flujo de reserva completo)
- Auditoría Lighthouse (rendimiento, accesibilidad)

---

## User Review Required

> [!WARNING]
> ### Decisiones que requieren tu confirmación:
> 1. **Supabase:** ¿Ya tienes un proyecto de Supabase creado? ¿Tienes las credenciales (URL, anon key, service role key)?
> 2. **Email provider:** ¿Usamos Resend, SendGrid, u otro? ¿Tienes una API key?
> 3. **Enfoque de desarrollo:** Dado el tamaño del proyecto, propongo empezar por el **frontend completo con datos mock** para validar el diseño y UX, y luego integrar el backend. ¿Estás de acuerdo con este enfoque?
> 4. **Despliegue:** ¿Preparamos deploy a Vercel (frontend) + Railway (backend) desde el inicio, o desarrollo local primero?
> 5. **Tailwind CSS:** El SRS especifica Tailwind CSS v3. ¿Confirmas su uso? (Nota: tus reglas de usuario indican "Vanilla CSS por defecto", pero el SRS pide explícitamente Tailwind)

## Open Questions

> [!IMPORTANT]
> 1. ¿La peluquería tiene un nombre específico que debamos usar, o usamos "BarberBook" como marca?
> 2. ¿Cuántos barberos tendrá aproximadamente en el lanzamiento? (para dimensionar la vista de agenda)
> 3. ¿Hay requisitos específicos sobre el horario laboral de la peluquería? (ej. L-V 9:00-19:00)
> 4. ¿Deseas algún idioma adicional además de español para la UI?

---

## Verification Plan

### Automated Tests
- `python manage.py test` — Suite completa de tests unitarios Django
- `npm run test` — Tests unitarios de componentes React
- `npx playwright test` — Tests E2E del flujo de reserva
- `npx lighthouse-ci` — Auditoría de rendimiento

### Manual Verification
- Validar flujo completo de reserva en navegador (Chrome + Firefox)
- Verificar responsive en 375px (móvil) y 1440px (desktop)
- Probar prevención de overbooking con dos sesiones simultáneas
- Comprobar emails enviados correctamente
- Validar que usuario `cliente` no puede acceder a rutas `/admin/`

---

## Estimación de Archivos

| Componente | Archivos estimados |
|-----------|-------------------|
| Backend Django (modelos, vistas, serializers, tests) | ~40-50 archivos |
| Frontend Next.js (páginas, componentes, hooks, lib) | ~60-70 archivos |
| Configuración (Docker, env, CI/CD) | ~10 archivos |
| **Total estimado** | **~110-130 archivos** |

Este es un proyecto de envergadura considerable. Recomiendo abordarlo de forma iterativa, validando cada fase antes de avanzar a la siguiente.
