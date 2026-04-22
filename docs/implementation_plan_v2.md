# Plan de Implementación — BarberBook v1.0 (Revisado)

## Decisiones del Usuario

| Decisión | Valor |
|----------|-------|
| **Supabase** | Omitido — desarrollo local con Django Auth + SQLite |
| **Email** | Omitido — módulo de notificaciones diferido |
| **Enfoque** | Lógica primero (backend → frontend) |
| **CSS** | Tailwind CSS v3 |
| **Barberos iniciales** | 3 |
| **Horario** | L-V 9:00-20:00, configurable por admin |
| **Idioma** | Solo español |
| **Nombre peluquería** | Configurable desde panel admin |
| **Deploy** | Solo local por ahora |

---

## Arquitectura Revisada

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐
│  Next.js 14     │ ◄──────────────── │  Django 5 + DRF  │
│  (App Router)   │     JSON API       │  (API REST)      │
│  Tailwind v3    │                    │  SimpleJWT       │
│  TanStack Query │                    │  SQLite (dev)    │
└─────────────────┘                    └──────────────────┘
     :3000                                  :8000
```

**Sin Supabase:** Usamos el sistema de auth nativo de Django con SimpleJWT. El modelo `User` de Django se extiende con un `Profile`. SQLite para desarrollo (migrable a PostgreSQL en producción).

---

## Fases de Ejecución

### Fase 1 — Backend Django (Estructura + Modelos + API)

1. Inicializar proyecto Django con estructura modular
2. Configurar DRF + SimpleJWT + CORS
3. Crear modelos: Profile, Service, Barber, BarberSchedule, Appointment, BusinessConfig
4. Serializers y ViewSets para cada modelo
5. Lógica de cálculo de slots disponibles (RF-11)
6. Prevención de overbooking (RF-12)
7. Reglas de negocio de citas (RF-13)
8. Datos semilla (3 barberos, servicios predefinidos, config negocio)
9. Tests unitarios de lógica de negocio

### Fase 2 — Frontend Next.js (Estructura + Páginas)

1. Inicializar proyecto Next.js 14 con TypeScript + Tailwind v3
2. Sistema de diseño: tokens CSS, componentes base
3. Layout con sidebar (admin) / navbar (cliente)
4. Auth pages: login, registro
5. Panel cliente: mis citas, reservar (wizard 4 pasos), perfil
6. Panel admin: dashboard, agenda, servicios, barberos, clientes, configuración
7. Integración con API Django via TanStack Query

### Fase 3 — Integración y Pulido

1. Conectar frontend ↔ backend
2. Flujo completo de reserva end-to-end
3. Responsive (375px — 1440px)
4. Animaciones y micro-interacciones
5. Testing E2E

---

## Verification Plan

### Automated Tests
- `python manage.py test` — Tests unitarios Django (>80% lógica de negocio)
- `npm run build` — Verificar que compila sin errores TypeScript
- Browser testing manual del flujo de reserva

### Manual Verification
- Crear cita completa como cliente
- Verificar prevención overbooking
- Verificar agenda admin
- Responsive en 375px y 1440px
