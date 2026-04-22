# Documento de Especificación de Requerimientos de Software

# BarberBook
### Aplicación Web de Gestión de Citas de Peluquería

| Campo    | Valor                      |
|----------|----------------------------|
| **Versión** | 1.0                     |
| **Fecha**   | Abril 2026              |
| **Estado**  | Borrador Inicial        |
| **Stack**   | Django · Next.js · Supabase |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Descripción General del Sistema](#2-descripción-general-del-sistema)
3. [Requerimientos Funcionales](#3-requerimientos-funcionales)
4. [Requerimientos No Funcionales](#4-requerimientos-no-funcionales)
5. [Especificaciones Técnicas de Arquitectura](#5-especificaciones-técnicas-de-arquitectura)
6. [Criterios de Aceptación](#6-criterios-de-aceptación)

---

## 1. Introducción

### 1.1 Propósito del Documento

Este Documento de Especificación de Requerimientos de Software (SRS) describe de manera exhaustiva los requerimientos funcionales, no funcionales, restricciones de diseño y criterios de aceptación para el desarrollo de BarberBook, una aplicación web moderna para la gestión de citas en peluquerías y barberías.

El documento está dirigido a desarrolladores, arquitectos de software, diseñadores UX/UI, equipo de QA y cualquier parte interesada en el proyecto. Sirve como contrato técnico entre el equipo de desarrollo y los stakeholders del negocio.

### 1.2 Alcance del Producto

BarberBook es una aplicación web full-stack que permite a los clientes de una peluquería reservar, gestionar y cancelar citas de forma autónoma, mientras ofrece al barbero/administrador una vista centralizada de su agenda y herramientas de gestión operativa.

La aplicación incluye:

- Sistema de autenticación basado en JWT integrado con Supabase Auth, con roles diferenciados.
- Catálogo de servicios configurable con descripción, duración y precio.
- Motor de reservas con calendario interactivo que evita el overbooking.
- Notificaciones automáticas por correo electrónico.
- Panel de administración con agenda visual diaria.
- Gestión de barberos/sillas y selección de peluquero favorito.
- Interfaz responsive compatible con dispositivos móviles, tablet y escritorio.

### 1.3 Definiciones, Acrónimos y Abreviaturas

| Término       | Definición |
|---------------|------------|
| **SRS**       | Software Requirements Specification — documento actual. |
| **JWT**       | JSON Web Token. Estándar de autenticación sin estado (RFC 7519). |
| **API REST**  | Interfaz de programación de aplicaciones basada en el protocolo HTTP con arquitectura REST. |
| **Overbooking** | Solapamiento de dos o más citas en el mismo slot de tiempo para el mismo barbero. |
| **CRUD**      | Create, Read, Update, Delete — operaciones básicas de persistencia de datos. |
| **RLS**       | Row Level Security — política de seguridad a nivel de fila en Supabase/PostgreSQL. |
| **UX/UI**     | User Experience / User Interface. |
| **Admin**     | Rol de administrador con acceso completo a la gestión de la peluquería. |
| **Cliente**   | Usuario final que reserva y gestiona sus citas. |
| **Slot**      | Intervalo de tiempo disponible para reservar una cita. |

### 1.4 Referencias

- IEEE Std 830-1998 — IEEE Recommended Practice for Software Requirements Specifications.
- RFC 7519 — JSON Web Token (JWT).
- Documentación oficial de Supabase: https://supabase.com/docs
- Documentación oficial de Django REST Framework: https://www.django-rest-framework.org
- Documentación oficial de Next.js 14: https://nextjs.org/docs

### 1.5 Visión General del Documento

El documento está organizado en seis secciones principales: (1) Introducción, (2) Descripción General del Sistema, (3) Requerimientos Funcionales detallados por módulo, (4) Requerimientos No Funcionales, (5) Especificaciones Técnicas de Arquitectura, y (6) Criterios de Aceptación.

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del Producto

BarberBook es un sistema web independiente que no requiere integración con sistemas heredados existentes. Opcionalmente puede integrarse con servicios de terceros para el envío de correos electrónicos (SMTP / SendGrid / Resend) y para pagos futuros. El sistema actúa como plataforma centralizada única para la peluquería.

### 2.2 Funciones Principales del Producto

| #        | Módulo                        | Descripción Resumida |
|----------|-------------------------------|----------------------|
| **M-01** | Autenticación y Roles         | Registro, login, recuperación de contraseña, gestión de sesiones JWT, roles Cliente y Admin. |
| **M-02** | Catálogo de Servicios         | CRUD de servicios con nombre, descripción, duración y precio. Visible para clientes y gestionable por admin. |
| **M-03** | Gestión de Barberos           | Alta, baja y modificación de perfiles de barberos. Asignación de horarios laborales. |
| **M-04** | Motor de Reservas             | Calendario interactivo, cálculo de slots disponibles, prevención de overbooking, creación de citas. |
| **M-05** | Notificaciones por Email      | Envío automático de confirmación, recordatorio y cancelación de citas. |
| **M-06** | Historial de Citas (Cliente)  | Visualización de citas pasadas y futuras. Cancelación con política de 24 horas. |
| **M-07** | Agenda del Barbero/Admin      | Vista diaria visual tipo timeline de citas. Gestión de disponibilidad y bloqueos. |
| **M-08** | Panel de Administración       | Dashboard con métricas, gestión de usuarios, servicios, barberos y configuración del negocio. |

### 2.3 Características de los Usuarios

#### 2.3.1 Cliente

- **Perfil:** Cualquier persona con acceso a internet y cuenta registrada en la plataforma.
- **Nivel técnico:** Básico. Experiencia habitual con aplicaciones móviles y reservas online.
- **Frecuencia de uso:** Ocasional (media de 1-4 visitas/mes).
- **Necesidades clave:** Reservar citas de forma rápida, ver disponibilidad en tiempo real y recibir confirmación.

#### 2.3.2 Administrador / Barbero

- **Perfil:** Propietario o empleado de la peluquería con acceso al panel de administración.
- **Nivel técnico:** Intermedio. Familiarizado con herramientas de gestión empresarial básicas.
- **Frecuencia de uso:** Diario. Consulta de agenda varias veces al día.
- **Necesidades clave:** Vista clara de la agenda, gestión de citas y configuración del negocio.

### 2.4 Restricciones Generales

- El sistema debe operar completamente en un navegador web moderno sin necesidad de instalación de software adicional.
- La base de datos y autenticación residen exclusivamente en Supabase (PostgreSQL).
- El backend expone exclusivamente una API REST; no se generan vistas HTML desde Django.
- El sistema debe cumplir con el Reglamento General de Protección de Datos (RGPD) europeo.
- La aplicación debe ser funcional en los navegadores Chrome, Firefox, Safari y Edge (últimas 2 versiones).

### 2.5 Suposiciones y Dependencias

- Se asume disponibilidad continua del servicio de Supabase (SLA >= 99.9 %).
- El servicio de email externo (ej. Resend o SendGrid) debe estar configurado antes del despliegue a producción.
- La peluquería opera con un único negocio/sede en esta versión (v1.0). Multi-sede queda fuera del alcance.
- Los horarios laborales son fijos por semana (no contempla festividades automáticas en v1.0).

---

## 3. Requerimientos Funcionales

### 3.1 Módulo de Autenticación y Gestión de Roles (M-01)

La autenticación se implementa utilizando Supabase Auth como proveedor de identidad, con JWT emitidos por Supabase. El backend Django valida los tokens mediante la clave pública JWT de Supabase (JWKS). Los roles se almacenan en los metadatos de usuario de Supabase y se propagan al frontend a través del payload del token.

#### RF-01: Registro de nuevo usuario

- El sistema debe presentar un formulario de registro con los campos: nombre completo, correo electrónico, contraseña y confirmación de contraseña.
- El correo electrónico debe ser único en el sistema. Si ya existe, se muestra un mensaje de error apropiado.
- La contraseña debe cumplir: mínimo 8 caracteres, al menos una letra mayúscula, una minúscula y un número.
- Tras el registro exitoso, Supabase envía un email de verificación de cuenta. El usuario no puede iniciar sesión hasta verificar su email.
- El rol por defecto asignado al nuevo usuario es `'cliente'`.

#### RF-02: Inicio de sesión

- El sistema debe presentar un formulario con campos de correo electrónico y contraseña.
- Supabase Auth verifica las credenciales y emite un `access_token` (JWT) y un `refresh_token`.
- El frontend almacena los tokens de forma segura (memoria + httpOnly cookie o localStorage con precauciones XSS).
- Tras login exitoso, el sistema redirige: al panel de administración si el rol es `'admin'`, o al panel de cliente si el rol es `'cliente'`.
- Tras 5 intentos fallidos consecutivos, la cuenta se bloquea temporalmente durante 15 minutos.

#### RF-03: Cierre de sesión

- El sistema debe proveer un botón de cierre de sesión accesible desde cualquier página autenticada.
- Al cerrar sesión, los tokens son revocados en Supabase y eliminados del almacenamiento del cliente.
- El usuario es redirigido a la página de inicio/login.

#### RF-04: Recuperación de contraseña

- El usuario puede solicitar un enlace de recuperación introduciendo su correo electrónico.
- Supabase envía un email con un enlace de un solo uso y caducidad de 1 hora.
- El enlace permite establecer una nueva contraseña cumpliendo las mismas reglas de la RF-01.

#### RF-05: Gestión de roles

- Existen exactamente dos roles: `'cliente'` y `'admin'`.
- Solo un `'admin'` puede modificar el rol de otro usuario desde el panel de administración.
- Las rutas de la API Django aplican decoradores de permiso que verifican el rol del JWT antes de procesar la solicitud (RLS en Supabase como segunda capa).

---

### 3.2 Módulo de Catálogo de Servicios (M-02)

#### RF-06: Visualización del catálogo (público)

- La página de catálogo es accesible sin autenticación.
- Muestra tarjetas de servicio con: nombre, descripción, duración (en minutos formateados como `'30 min'`) y precio (en euros con formato `'15,00 €'`).
- Los servicios se ordenan por precio ascendente por defecto. Se puede ordenar por nombre o duración.
- Se puede filtrar por rango de precio y duración.

#### RF-07: Gestión de servicios (admin)

- El admin puede crear nuevos servicios con los campos: nombre (máx. 60 caracteres), descripción (máx. 500 caracteres), duración en minutos (múltiplo de 15, entre 15 y 240 minutos) y precio en euros (dos decimales).
- El admin puede editar cualquier campo de un servicio existente.
- El admin puede desactivar (soft-delete) un servicio. Los servicios inactivos no aparecen para nuevas reservas pero mantienen su referencia en citas históricas.
- Ejemplos de servicios predefinidos al inicializar el sistema: Corte Fade (30 min, 15€), Arreglo de barba (20 min, 10€), Corte + Barba (50 min, 22€), Tinte (60 min, 35€).

---

### 3.3 Módulo de Gestión de Barberos (M-03)

#### RF-08: Alta y perfil de barbero

- El admin puede dar de alta un barbero creando un perfil con: nombre completo, foto de perfil (URL o upload), especialidades (etiquetas seleccionables), breve bio (máx. 300 caracteres) y estado activo/inactivo.
- Cada barbero tiene un horario laboral semanal configurable: días de la semana activos, hora de inicio, hora de fin y duración del descanso (break) con hora de inicio del break.
- El admin puede desactivar un barbero. Los barberos inactivos no reciben nuevas reservas.

#### RF-09: Selección de barbero favorito por el cliente

- Durante el proceso de reserva, el cliente puede ver la lista de barberos activos con su foto y especialidades.
- El cliente puede marcar un barbero como `'favorito'` en su perfil. Esta preferencia se guarda en su cuenta.
- Si el cliente tiene un favorito definido, el flujo de reserva preselecciona ese barbero, permitiendo cambiarlo.
- Si el cliente selecciona `'Sin preferencia'`, el sistema asigna el barbero disponible con menor carga en el slot elegido.

---

### 3.4 Módulo Motor de Reservas (M-04)

Este módulo es el núcleo funcional de la aplicación. Gestiona la lógica de disponibilidad y prevención de overbooking de forma transaccional.

#### RF-10: Flujo de creación de cita

El proceso de reserva sigue los siguientes pasos secuenciales:

1. **Paso 1 — Selección de servicio:** El cliente elige un servicio del catálogo activo.
2. **Paso 2 — Selección de barbero:** Elige un barbero específico o `'Sin preferencia'`.
3. **Paso 3 — Selección de fecha y hora:** Se muestra un calendario interactivo. Únicamente están habilitados los días con disponibilidad. Al seleccionar un día, se muestran los slots horarios disponibles calculados dinámicamente.
4. **Paso 4 — Revisión y confirmación:** Resumen de la cita (servicio, barbero, fecha, hora, precio). El cliente confirma.
5. **Paso 5 — Confirmación:** La cita se crea en base de datos y se envía el email de confirmación.

#### RF-11: Cálculo de slots disponibles

- El sistema calcula los slots disponibles para un barbero y servicio dados según: horario laboral del barbero, duración del servicio seleccionado, descansos configurados del barbero, citas ya existentes en esa jornada.
- Un slot es válido si: pertenece al horario laboral, no cae en el descanso, no se solapa con ninguna cita existente (`hora_inicio_nueva >= hora_fin_existente OR hora_fin_nueva <= hora_inicio_existente`), y no sobrepasa el fin de jornada.
- Los slots se generan cada 15 minutos dentro del horario laboral y se filtra cuáles cumplen los criterios.
- El sistema muestra los slots en intervalos de tiempo local del navegador del cliente.

#### RF-12: Prevención de overbooking

- La inserción de una cita se ejecuta dentro de una transacción de base de datos con bloqueo pesimista (`SELECT FOR UPDATE` o equivalente en Supabase) sobre las citas del barbero en ese día.
- Si en el momento de confirmar el slot ya fue tomado por otro usuario (race condition), el sistema devuelve un error `409 Conflict` e informa al cliente para que elija otro slot.
- La lógica de validación de solapamiento se implementa tanto en el backend (fuente de verdad) como en el frontend (optimización UX, no seguridad).

#### RF-13: Reglas de negocio de citas

- Un cliente puede tener máximo 3 citas futuras activas simultáneamente.
- No se permiten reservas con menos de 1 hora de antelación.
- No se permiten reservas con más de 60 días de antelación.
- Una cita puede estar en los estados: `'pendiente'`, `'confirmada'`, `'completada'`, `'cancelada'`.

---

### 3.5 Módulo de Notificaciones por Email (M-05)

#### RF-14: Confirmación de cita

- Inmediatamente tras crear una cita exitosamente, el sistema envía un email de confirmación al correo del cliente.
- El email incluye: nombre del cliente, nombre del servicio, nombre del barbero, fecha y hora de la cita, precio, dirección de la peluquería y enlace para cancelar la cita.
- El asunto del email es: `'Confirmación de tu cita en [Nombre Peluquería] - [Fecha]'`.

#### RF-15: Recordatorio de cita

- El sistema envía un email de recordatorio 24 horas antes de la cita (mediante un job programado — Celery Beat o cron en Supabase Edge Functions).
- El recordatorio incluye la misma información que la confirmación más un enlace de cancelación.

#### RF-16: Notificación de cancelación

- Cuando una cita es cancelada (por el cliente o el admin), se envía un email de cancelación al cliente con la información de la cita cancelada y el motivo si fue proporcionado por el admin.
- Si la cancelación es realizada por el admin, también se notifica al cliente que puede reservar de nuevo.

---

### 3.6 Módulo de Historial de Citas del Cliente (M-06)

#### RF-17: Vista de historial

- El cliente accede a una sección `'Mis Citas'` desde su panel con dos pestañas: `'Próximas'` y `'Pasadas'`.
- Cada cita muestra: servicio, barbero, fecha, hora, precio, estado y acciones disponibles.
- Las citas pasadas muestran opcionalmente una valoración con estrellas (1-5) y comentario opcional (máx. 200 caracteres).

#### RF-18: Cancelación de cita por el cliente

- El cliente puede cancelar una cita futura siempre que falten más de 24 horas para la hora de la cita.
- Si faltan menos de 24 horas, el botón de cancelación aparece deshabilitado con el mensaje: `'No es posible cancelar con menos de 24h de antelación. Contacta con nosotros.'`
- Al cancelar, el sistema solicita confirmación mediante un diálogo modal antes de procesar la cancelación.
- Tras cancelar, la cita cambia de estado a `'cancelada'` y se envía el email de notificación (RF-16).

---

### 3.7 Módulo de Agenda Visual del Barbero/Admin (M-07)

#### RF-19: Vista de agenda diaria

- El panel del admin/barbero muestra una vista tipo timeline/columna de la agenda del día actual por defecto.
- Cada cita se representa como un bloque de color proporcional a su duración, mostrando: nombre del cliente, servicio e icono de estado.
- Los bloques de color se diferencian por estado: confirmada (azul), completada (verde), cancelada (gris tachado).
- La vista permite navegar entre días (flechas anterior/siguiente + selector de fecha).
- Si hay múltiples barberos, se muestra una columna por barbero, permitiendo filtrar por barbero específico.

#### RF-20: Gestión de citas desde la agenda

- Al hacer clic en un bloque de cita, se abre un panel lateral con los detalles completos del cliente y la cita.
- El admin puede marcar una cita como `'completada'` una vez concluida.
- El admin puede cancelar cualquier cita con un campo de motivo opcional. Se notifica al cliente.
- El admin puede crear citas manualmente desde la agenda seleccionando un slot vacío.

#### RF-21: Bloqueo de disponibilidad

- El admin puede bloquear franjas horarias (ej. vacaciones, formación) seleccionando un rango de fechas y hora para uno o todos los barberos.
- Los bloques de indisponibilidad se reflejan automáticamente en el calendario de reservas del cliente.

---

### 3.8 Módulo de Panel de Administración (M-08)

#### RF-22: Dashboard de métricas

- La página principal del admin muestra métricas resumidas del día actual y la semana: total de citas, citas completadas, citas canceladas, ingresos estimados del día y del mes.
- Gráfico de barras con citas por día de la semana actual.
- Lista de las próximas 5 citas del día con acceso rápido.

#### RF-23: Gestión de usuarios

- El admin puede ver la lista de usuarios registrados con nombre, email, fecha de registro, número de citas y rol.
- El admin puede cambiar el rol de un usuario entre `'cliente'` y `'admin'`.
- El admin puede desactivar una cuenta de cliente (sin eliminarla) lo que impide nuevos logins.

#### RF-24: Configuración del negocio

- El admin puede configurar: nombre de la peluquería, dirección, teléfono de contacto, email de contacto, logo (upload de imagen) y descripción breve.
- Esta información se usa en las plantillas de email y en el footer de la aplicación.

---

## 4. Requerimientos No Funcionales

### 4.1 Rendimiento

| Métrica                             | Objetivo     | Mínimo Aceptable |
|-------------------------------------|:------------:|:----------------:|
| Tiempo de carga inicial (LCP)       | < 2.5 s      | < 4 s            |
| Tiempo de respuesta API (p95)       | < 300 ms     | < 800 ms         |
| Tiempo de cálculo de slots          | < 100 ms     | < 300 ms         |
| Usuarios concurrentes soportados    | 500          | 100              |
| Uptime mensual                      | 99.9 %       | 99.5 %           |
| Envío de email de confirmación      | < 5 segundos | < 30 segundos    |

### 4.2 Seguridad

- **Autenticación:** Todos los tokens JWT deben tener un tiempo de expiración de 1 hora (`access_token`). El `refresh_token` caduca en 7 días.
- **HTTPS obligatorio:** Toda comunicación entre cliente y servidor debe realizarse sobre TLS 1.2+. Redirección automática de HTTP a HTTPS.
- **CORS:** La API Django solo acepta solicitudes desde los dominios del frontend registrados en la configuración `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS`.
- **Inyección SQL:** El uso del ORM de Django y consultas parametrizadas de Supabase previene inyección SQL. Prohibido el uso de consultas SQL raw no parametrizadas.
- **XSS:** El frontend Next.js aplica sanitización de inputs y escapa todo contenido dinámico antes de renderizar en el DOM.
- **Rate Limiting:** La API limita peticiones a 100 req/min por IP para endpoints públicos y 300 req/min para endpoints autenticados.
- **RLS de Supabase:** Cada tabla sensible (citas, perfiles) tiene políticas RLS que garantizan que un cliente solo accede a sus propios registros.
- **Variables de entorno:** Todas las credenciales (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SECRET_KEY`, `EMAIL_API_KEY`) se gestionan exclusivamente como variables de entorno, nunca hardcodeadas.

### 4.3 Usabilidad

- La interfaz debe seguir los principios de diseño WCAG 2.1 nivel AA para accesibilidad.
- El flujo de creación de una cita no debe requerir más de 4 pasos claramente numerados.
- Todos los mensajes de error deben ser descriptivos y ofrecer una acción correctiva al usuario.
- La aplicación debe funcionar correctamente en resoluciones desde 320px (móvil) hasta 2560px (pantallas grandes).
- Los estados de carga (loading states) deben mostrarse en todas las operaciones asíncronas que superen 200ms.
- El tiempo máximo de aprendizaje para un usuario nuevo (primera reserva completa) debe ser inferior a 3 minutos.

### 4.4 Mantenibilidad

- El código backend (Django) debe alcanzar una cobertura de tests unitarios superior al 80%.
- La API debe estar documentada con OpenAPI 3.0 (drf-spectacular) y accesible en `/api/schema/swagger-ui/`.
- El frontend debe usar TypeScript estricto (`strict: true`) para todas las páginas y componentes.
- Se debe mantener un `CHANGELOG.md` con registro de cambios por versión.
- El código debe pasar linting con ESLint (frontend) y flake8/ruff (backend) en el CI/CD.

### 4.5 Escalabilidad

- La arquitectura debe permitir añadir múltiples peluquerías (multi-tenancy) en una versión futura sin refactorización mayor, utilizando un campo `barbershop_id` en las tablas principales.
- El backend Django debe ser stateless para permitir escalado horizontal detrás de un load balancer.
- Las imágenes (logos, fotos de barberos) se almacenan en Supabase Storage, no en el servidor de aplicaciones.

### 4.6 Compatibilidad

- **Navegadores:** Chrome 120+, Firefox 120+, Safari 17+, Edge 120+.
- **Dispositivos:** Diseño responsive compatible con iOS 16+, Android 10+.
- **Zona horaria:** La aplicación muestra las horas en la zona horaria local del usuario. Los datos se almacenan en UTC en la base de datos.

---

## 5. Especificaciones Técnicas de Arquitectura

### 5.1 Arquitectura General del Sistema

BarberBook sigue una arquitectura de tres capas desacopladas: presentación (Next.js), lógica de negocio (Django REST) y persistencia (Supabase/PostgreSQL). La comunicación entre capas es exclusivamente a través de HTTP/REST con JSON.

### 5.2 Stack Tecnológico

| Capa                  | Tecnología                       | Versión / Notas |
|-----------------------|----------------------------------|-----------------|
| **Frontend**          | Next.js                          | v14+ con App Router. React Server Components + Client Components. |
| **Frontend**          | TypeScript                       | v5+. Strict mode habilitado. |
| **Frontend**          | Tailwind CSS                     | v3+. Sistema de diseño con variables CSS personalizadas. |
| **Frontend**          | React Query                      | v5 (TanStack Query). Gestión de estado servidor, caché y sincronización. |
| **Frontend**          | React Hook Form + Zod            | Formularios tipados con validación en el cliente. |
| **Frontend**          | date-fns                         | Manipulación de fechas y zonas horarias. |
| **Backend**           | Django                           | v5+. Configuración modular (settings/base.py, dev.py, prod.py). |
| **Backend**           | Django REST Framework            | v3.15+. Serializers, ViewSets, Routers. |
| **Backend**           | djangorestframework-simplejwt    | Validación de JWT de Supabase mediante JWKS. |
| **Backend**           | Celery + Redis                   | Jobs asíncronos para envío de emails y recordatorios. |
| **Backend**           | drf-spectacular                  | Generación automática de documentación OpenAPI 3.0. |
| **Base de Datos**     | Supabase (PostgreSQL 15)         | Hosting gestionado. RLS habilitado por tabla. |
| **Autenticación**     | Supabase Auth                    | JWT. Email + contraseña en v1.0. OAuth social en v2.0. |
| **Almacenamiento**    | Supabase Storage                 | Imágenes de barberos y logo de la peluquería. |
| **Email**             | Resend (o SendGrid)              | SDK oficial. Plantillas HTML responsivas. |
| **Despliegue Frontend** | Vercel                         | Despliegue automático desde rama `main`. |
| **Despliegue Backend** | Railway / Render                | Contenedor Docker. Variables de entorno configuradas. |
| **CI/CD**             | GitHub Actions                   | Pipeline: lint → test → build → deploy. |

### 5.3 Modelo de Datos — Tablas Principales

#### 5.3.1 Tabla: `profiles`

| Campo               | Tipo                    | Nulos | Descripción |
|---------------------|-------------------------|:-----:|-------------|
| `id`                | UUID (FK auth.users)    | NO    | Identificador del usuario. FK a auth.users de Supabase. |
| `full_name`         | VARCHAR(150)            | NO    | Nombre completo del usuario. |
| `phone`             | VARCHAR(20)             | SÍ    | Teléfono de contacto opcional. |
| `role`              | ENUM('cliente','admin') | NO    | Rol del usuario. Default: `'cliente'`. |
| `favorite_barber_id`| UUID (FK barbers)       | SÍ    | Barbero favorito del cliente. |
| `is_active`         | BOOLEAN                 | NO    | Indica si la cuenta está activa. Default: `true`. |
| `created_at`        | TIMESTAMPTZ             | NO    | Timestamp de creación. Default: `now()`. |
| `updated_at`        | TIMESTAMPTZ             | NO    | Timestamp de última modificación. |

#### 5.3.2 Tabla: `services`

| Campo              | Tipo         | Nulos | Descripción |
|--------------------|--------------|:-----:|-------------|
| `id`               | UUID         | NO    | PK generado automáticamente (`gen_random_uuid()`). |
| `name`             | VARCHAR(60)  | NO    | Nombre del servicio. Único. |
| `description`      | TEXT         | SÍ    | Descripción detallada del servicio. |
| `duration_minutes` | SMALLINT     | NO    | Duración en minutos. Múltiplo de 15, entre 15 y 240. |
| `price`            | NUMERIC(8,2) | NO    | Precio en euros. Positivo. |
| `is_active`        | BOOLEAN      | NO    | Servicio activo/inactivo (soft-delete). Default: `true`. |
| `created_at`       | TIMESTAMPTZ  | NO    | Timestamp de creación. |

#### 5.3.3 Tabla: `barbers`

| Campo          | Tipo              | Nulos | Descripción |
|----------------|-------------------|:-----:|-------------|
| `id`           | UUID              | NO    | PK generado automáticamente. |
| `user_id`      | UUID (FK profiles)| SÍ    | Si el barbero tiene cuenta de usuario asociada. |
| `full_name`    | VARCHAR(150)      | NO    | Nombre completo del barbero. |
| `bio`          | VARCHAR(300)      | SÍ    | Descripción breve del barbero. |
| `avatar_url`   | TEXT              | SÍ    | URL de la foto en Supabase Storage. |
| `specialties`  | TEXT[]            | SÍ    | Array de etiquetas de especialidades. |
| `is_active`    | BOOLEAN           | NO    | Barbero activo para nuevas reservas. Default: `true`. |
| `created_at`   | TIMESTAMPTZ       | NO    | Timestamp de creación. |

#### 5.3.4 Tabla: `barber_schedules`

| Campo          | Tipo              | Nulos | Descripción |
|----------------|-------------------|:-----:|-------------|
| `id`           | UUID              | NO    | PK. |
| `barber_id`    | UUID (FK barbers) | NO    | Barbero al que pertenece el horario. |
| `day_of_week`  | SMALLINT (0-6)    | NO    | 0=Lunes, 6=Domingo. |
| `start_time`   | TIME              | NO    | Hora de inicio de jornada (ej. `09:00`). |
| `end_time`     | TIME              | NO    | Hora de fin de jornada (ej. `19:00`). |
| `break_start`  | TIME              | SÍ    | Hora de inicio del descanso (ej. `14:00`). |
| `break_end`    | TIME              | SÍ    | Hora de fin del descanso (ej. `15:00`). |
| `is_working`   | BOOLEAN           | NO    | Si el barbero trabaja ese día. Default: `true`. |

#### 5.3.5 Tabla: `appointments`

| Campo                 | Tipo                      | Nulos | Descripción |
|-----------------------|---------------------------|:-----:|-------------|
| `id`                  | UUID                      | NO    | PK generado automáticamente. |
| `client_id`           | UUID (FK profiles)        | NO    | Cliente que realizó la reserva. |
| `barber_id`           | UUID (FK barbers)         | NO    | Barbero asignado a la cita. |
| `service_id`          | UUID (FK services)        | NO    | Servicio reservado. |
| `start_datetime`      | TIMESTAMPTZ               | NO    | Inicio de la cita en UTC. |
| `end_datetime`        | TIMESTAMPTZ               | NO    | Fin de la cita (start + duration). Calculado. |
| `status`              | ENUM(4 estados)           | NO    | `pendiente` \| `confirmada` \| `completada` \| `cancelada`. |
| `price_at_booking`    | NUMERIC(8,2)              | NO    | Precio en el momento de la reserva (snapshot). |
| `cancellation_reason` | TEXT                      | SÍ    | Motivo de cancelación (solo cuando `status=cancelada`). |
| `cancelled_by`        | ENUM('client','admin')    | SÍ    | Quién canceló la cita. |
| `rating`              | SMALLINT (1-5)            | SÍ    | Valoración del cliente tras la cita. |
| `review`              | VARCHAR(200)              | SÍ    | Comentario de valoración del cliente. |
| `created_at`          | TIMESTAMPTZ               | NO    | Timestamp de creación de la reserva. |
| `updated_at`          | TIMESTAMPTZ               | NO    | Timestamp de última modificación. |

### 5.4 Endpoints de la API REST

La API sigue el prefijo `/api/v1/`. Todos los endpoints salvo `/auth/` y `/services/` (GET) requieren autenticación JWT en el header `Authorization: Bearer <token>`.

| Método      | Endpoint                        | Rol           | Descripción |
|-------------|----------------------------------|:-------------:|-------------|
| `POST`      | `/auth/register/`               | Público       | Registro de nuevo cliente. |
| `POST`      | `/auth/login/`                  | Público       | Login y obtención de tokens JWT. |
| `POST`      | `/auth/refresh/`                | Público       | Renovar `access_token` con `refresh_token`. |
| `GET`       | `/services/`                    | Público       | Listar servicios activos. |
| `POST`      | `/services/`                    | Admin         | Crear nuevo servicio. |
| `PUT/PATCH` | `/services/{id}/`               | Admin         | Actualizar servicio existente. |
| `DELETE`    | `/services/{id}/`               | Admin         | Desactivar servicio (soft-delete). |
| `GET`       | `/barbers/`                     | Público       | Listar barberos activos con horarios. |
| `POST`      | `/barbers/`                     | Admin         | Crear perfil de barbero. |
| `PUT/PATCH` | `/barbers/{id}/`                | Admin         | Actualizar perfil de barbero. |
| `GET`       | `/barbers/{id}/slots/`          | Autenticado   | Obtener slots disponibles para fecha y servicio. |
| `GET`       | `/appointments/`                | Autenticado   | Listar citas del usuario (o todas si admin). |
| `POST`      | `/appointments/`                | Cliente       | Crear nueva cita. |
| `PATCH`     | `/appointments/{id}/cancel/`    | Cliente/Admin | Cancelar cita. |
| `PATCH`     | `/appointments/{id}/complete/`  | Admin         | Marcar cita como completada. |
| `POST`      | `/appointments/{id}/review/`    | Cliente       | Añadir valoración a cita completada. |
| `GET`       | `/admin/agenda/`                | Admin         | Agenda visual de un día específico. |
| `GET`       | `/admin/dashboard/`             | Admin         | Métricas del dashboard. |
| `GET`       | `/admin/users/`                 | Admin         | Listar usuarios registrados. |
| `PATCH`     | `/admin/users/{id}/`            | Admin         | Cambiar rol o estado de usuario. |

### 5.5 Estructura de Directorios del Proyecto

#### 5.5.1 Backend (Django)

```
barberbook-backend/
├── config/               # settings/, urls.py, wsgi.py, asgi.py
├── apps/
│   ├── users/            # Modelos Profile, serializadores, vistas de auth
│   ├── services/         # Modelo Service, CRUD
│   ├── barbers/          # Modelos Barber, BarberSchedule, lógica de slots
│   ├── appointments/     # Modelo Appointment, lógica de reservas y anti-overbooking
│   └── notifications/    # Tareas Celery para envío de emails
├── requirements/         # base.txt, dev.txt, prod.txt
├── tests/                # Tests unitarios e integración por app
└── Dockerfile
```

#### 5.5.2 Frontend (Next.js)

```
barberbook-frontend/
├── app/                  # App Router: layout, páginas y rutas
│   ├── (public)/         # landing, catálogo (sin auth)
│   ├── (auth)/           # login, register, forgot-password
│   ├── dashboard/        # Panel cliente: mis-citas, perfil
│   └── admin/            # Panel admin: agenda, servicios, barberos, usuarios
├── components/           # UI components reutilizables
│   ├── ui/               # Primitivos (Button, Input, Modal, Badge…)
│   ├── booking/          # Flujo de reserva (pasos 1-4)
│   └── calendar/         # Componente de agenda visual
├── lib/                  # Clientes API, utilidades, tipos TypeScript
├── hooks/                # Custom hooks (useAuth, useSlots, useAppointments…)
└── styles/               # globals.css, variables de diseño Tailwind
```

---

## 6. Criterios de Aceptación

Los siguientes criterios deben cumplirse para considerar la entrega de cada módulo como completa y aprobada.

### 6.1 Criterios por Módulo

| ID       | Módulo        | Criterio de Aceptación |
|----------|---------------|------------------------|
| **CA-01** | Autenticación | Un usuario puede registrarse, verificar email, iniciar sesión y recibir un JWT válido. El rol correcto se refleja en el payload del token. |
| **CA-02** | Autenticación | Un intento de login con credenciales incorrectas devuelve HTTP 401. Tras 5 intentos, la cuenta se bloquea 15 min. |
| **CA-03** | Catálogo      | Un admin puede crear, editar y desactivar un servicio. El servicio inactivo no aparece en el catálogo público. |
| **CA-04** | Barberos      | Un admin puede crear un barbero con horario. El barbero inactivo no aparece en la lista de reservas. |
| **CA-05** | Reservas      | Un cliente completa el flujo de reserva de 4 pasos y la cita queda registrada en base de datos con estado `'confirmada'`. |
| **CA-06** | Reservas      | El sistema rechaza la creación de una cita que se solape con otra existente del mismo barbero, devolviendo error 409. |
| **CA-07** | Reservas      | Solo aparecen slots válidos según el horario laboral y descansos del barbero para el servicio seleccionado. |
| **CA-08** | Email         | El cliente recibe un email de confirmación en menos de 30 segundos tras crear la cita, con todos los datos correctos. |
| **CA-09** | Historial     | El cliente puede ver sus citas futuras y pasadas correctamente clasificadas. |
| **CA-10** | Cancelación   | El cliente puede cancelar una cita con más de 24h de antelación. El botón se deshabilita con menos de 24h. |
| **CA-11** | Agenda Admin  | El admin ve un timeline visual con las citas del día, pudiendo navegar entre días y filtrar por barbero. |
| **CA-12** | Agenda Admin  | El admin puede marcar una cita como `'completada'` y cancelar una cita con motivo opcional. |
| **CA-13** | Dashboard     | El dashboard muestra métricas correctas del día actual comparadas con los registros de la base de datos. |
| **CA-14** | Rendimiento   | El tiempo de carga inicial de la página de catálogo es menor a 4 s en una conexión 4G simulada (Lighthouse). |
| **CA-15** | Seguridad     | Un usuario con rol `'cliente'` no puede acceder a ningún endpoint de `/admin/`. Devuelve HTTP 403. |
| **CA-16** | Responsive    | La aplicación es completamente funcional y sin desbordamientos en viewport de 375px (iPhone SE) y 1440px. |
| **CA-17** | Favorito      | El barbero favorito del cliente se preselecciona en el paso 2 de la reserva y puede cambiarse. |

### 6.2 Proceso de Validación

- Cada requerimiento funcional se acompaña de al menos un test automatizado (unitario o de integración) que valide su criterio de aceptación.
- Las pruebas de rendimiento se realizan con Lighthouse CI integrado en el pipeline de GitHub Actions.
- Las pruebas de seguridad incluyen un escaneo con OWASP ZAP en el entorno de staging antes del despliegue a producción.
- La revisión de accesibilidad se realiza con axe-core integrado en los tests de Playwright.

### 6.3 Control de Versiones y Entrega

- El código fuente se gestiona en un repositorio Git (GitHub) con la estrategia de ramas: `main` (producción), `develop` (integración), `feature/*` (funcionalidades), `fix/*` (correcciones).
- Cada Pull Request requiere al menos una revisión de código aprobada y que el pipeline de CI/CD pase con éxito antes de fusionarse.
- La versión 1.0 contempla todos los módulos M-01 a M-08 descritos en este documento.
- Las funcionalidades fuera de alcance para v1.0 (pagos online, OAuth social, multi-sede, app móvil nativa) quedan documentadas para la hoja de ruta de v2.0.

---

*Fin del Documento — BarberBook SRS v1.0 — Confidencial · Uso Interno*
