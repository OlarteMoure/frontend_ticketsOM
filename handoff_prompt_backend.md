# PROMPT DE HANDOFF — Backend TicketsOM (VERSIÓN DEFINITIVA)

> **Contexto**: Este documento fue construido a partir del análisis exhaustivo del frontend funcional existente y validado con el stakeholder técnico del proyecto. Todas las decisiones de diseño están confirmadas. No requiere contexto adicional.

---

## 🎯 OBJETIVO GENERAL

Eres un agente IA desarrollador Senior con especialización en Java y Spring Boot. Tu misión es construir **el backend completo** del sistema **TicketsOM**, un gestor interno de solicitudes (tickets) para una firma de propiedad intelectual. El frontend ya está construido en **Vue.js 2 (Vue CLI)** y actualmente opera con datos mockeados en `localStorage`. Tu trabajo consiste en reemplazar esa capa de persistencia local por una **API REST robusta**, conectada a una base de datos **PostgreSQL**, con autenticación federada real mediante **Microsoft Entra ID (Azure AD)** y tokens **JWT**.

---

## 📐 STACK TECNOLÓGICO (No negociable)

| Capa            | Tecnología                                    |
|-----------------|-----------------------------------------------|
| **Lenguaje**    | Java 17                                       |
| **Framework**   | Spring Boot 3.x                               |
| **Build Tool**  | Maven                                         |
| **Base de Datos**| PostgreSQL (instancia local en desarrollo)    |
| **ORM**         | Spring Data JPA (Hibernate)                   |
| **Seguridad**   | Spring Security + OAuth2 Resource Server + JWT|
| **IdP**         | Microsoft Entra ID (Azure AD)                 |
| **Email**       | Spring Boot Mail (SMTP corporativo)           |
| **Arquitectura**| Monolítica Modular                            |
| **Patrón**      | Domain-Driven Design (DDD)                    |
| **Frontend**    | Vue.js 2 (Vue CLI) — YA CONSTRUIDO, servidor aparte |
| **Despliegue**  | Azure VMs (backend y frontend en máquinas separadas) |

---

## 🏗️ ARQUITECTURA MONOLÍTICA MODULAR CON DDD

El proyecto debe organizarse en **módulos funcionales** dentro de un único artefacto desplegable (JAR ejecutable). Cada módulo sigue las capas de DDD. El backend vive en un **repositorio y servidor completamente independiente** del frontend.

```
ticketsom-backend/
├── pom.xml
├── src/main/java/com/firma/ticketsom/
│   ├── TicketsomApplication.java
│   │
│   ├── shared/                          # Módulo transversal
│   │   ├── config/                      # SecurityConfig, CorsConfig, JwtConfig, MailConfig
│   │   ├── exception/                   # GlobalExceptionHandler, custom exceptions
│   │   ├── dto/                         # ApiResponse<T>, PagedResponse<T>
│   │   └── util/                        # DateUtils, JwtUtils, BusinessHoursCalculator
│   │
│   ├── identity/                        # Módulo: Seguridad y Control de Acceso
│   │   ├── domain/
│   │   │   ├── entity/                  # Usuario
│   │   │   ├── repository/             # UsuarioRepository
│   │   │   └── valueobject/            # Email, RolType (enum)
│   │   ├── application/
│   │   │   ├── service/                # AuthService, UsuarioService, EntraIdSyncService
│   │   │   └── dto/                    # LoginResponseDTO, UsuarioDTO, TokenRequestDTO
│   │   └── infrastructure/
│   │       ├── adapter/                # MicrosoftGraphAdapter (MS Graph API client)
│   │       └── controller/             # AuthController, UsuarioController
│   │
│   ├── ticket/                          # Módulo: Gestión de Tickets
│   │   ├── domain/
│   │   │   ├── entity/                 # Ticket, HistorialEstado
│   │   │   ├── repository/            # TicketRepository, HistorialEstadoRepository
│   │   │   ├── valueobject/           # TicketCodigo, EstadoTicket (enum), TipoAns (enum)
│   │   │   └── service/              # TicketDomainService (reglas ANS + máquina de estados)
│   │   ├── application/
│   │   │   ├── service/               # TicketApplicationService
│   │   │   └── dto/                   # TicketCreateDTO, TicketResponseDTO, TicketUpdateStatusDTO
│   │   └── infrastructure/
│   │       └── controller/            # TicketController
│   │
│   ├── configuration/                   # Módulo: Parametrización del Sistema
│   │   ├── domain/
│   │   │   ├── entity/                # Area, Asunto
│   │   │   └── repository/           # AreaRepository, AsuntoRepository
│   │   ├── application/
│   │   │   ├── service/              # AreaService, AsuntoService
│   │   │   └── dto/                  # AreaDTO, AsuntoDTO, AsuntoCreateDTO
│   │   └── infrastructure/
│   │       └── controller/           # ConfigController
│   │
│   ├── reporting/                       # Módulo: Reportes y Estadísticas
│   │   ├── application/
│   │   │   ├── service/               # ReportService, StatisticsService, CsvExportService
│   │   │   └── dto/                   # ReportFilterDTO, KpiDTO, AgentPerformanceDTO
│   │   └── infrastructure/
│   │       └── controller/            # ReportController, StatisticsController
│   │
│   └── notification/                    # Módulo: Notificaciones por Email
│       ├── domain/
│       │   └── event/                  # TicketCreatedEvent, TicketStatusChangedEvent
│       ├── application/
│       │   ├── service/               # EmailNotificationService
│       │   └── template/              # Plantillas HTML de email (Thymeleaf)
│       └── infrastructure/
│           └── listener/              # TicketEventListener (escucha eventos de dominio)
│
├── src/main/resources/
│   ├── application.yml                  # Configuración general
│   ├── application-dev.yml              # Perfil desarrollo (PostgreSQL local)
│   ├── application-prod.yml             # Perfil producción (Azure VM)
│   ├── templates/email/                 # Plantillas de correo electrónico
│   │   ├── ticket-created.html
│   │   └── ticket-status-changed.html
│   └── db/migration/                    # Scripts Flyway (opcional)
```

---

## 🗄️ MODELO DE BASE DE DATOS (3FN — Tercera Forma Normal)

### Tablas Requeridas

```sql
-- 1. USUARIOS (sincronizados desde Microsoft Entra ID)
CREATE TABLE usuarios (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  nombre          VARCHAR(255) NOT NULL,
  rol             VARCHAR(50) NOT NULL DEFAULT 'Básico',  -- 'Administrador', 'Gestionador', 'Básico'
  activo          BOOLEAN DEFAULT TRUE,
  azure_oid       VARCHAR(255) UNIQUE,                     -- Object ID de Entra ID
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ÁREAS (departamentos funcionales)
CREATE TABLE areas (
  id              BIGSERIAL PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  activa          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ASUNTOS (tipos de requerimiento por área, con configuración de ANS)
CREATE TABLE asuntos (
  id              BIGSERIAL PRIMARY KEY,
  area_id         BIGINT NOT NULL REFERENCES areas(id),
  nombre          VARCHAR(255) NOT NULL,
  ans_horas       INTEGER NOT NULL DEFAULT 24,
  tipo_ans        VARCHAR(20) NOT NULL DEFAULT 'CALENDARIO', -- 'CALENDARIO' o 'HABIL'
  responsable_id  BIGINT REFERENCES usuarios(id),
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TICKETS (solicitudes/requerimientos)
CREATE TABLE tickets (
  id              BIGSERIAL PRIMARY KEY,
  codigo          VARCHAR(20) UNIQUE NOT NULL,              -- Formato: TK-00001
  titulo          VARCHAR(500) NOT NULL,
  descripcion     TEXT NOT NULL,
  area_id         BIGINT NOT NULL REFERENCES areas(id),
  asunto_id       BIGINT NOT NULL REFERENCES asuntos(id),
  responsable_id  BIGINT REFERENCES usuarios(id),
  solicitante_id  BIGINT NOT NULL REFERENCES usuarios(id),
  estado          VARCHAR(50) NOT NULL DEFAULT 'Creado',
  ans_horas       INTEGER NOT NULL,                         -- Copiado del asunto al crear
  tipo_ans        VARCHAR(20) NOT NULL DEFAULT 'CALENDARIO',-- Copiado del asunto al crear
  fecha_creacion  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. HISTORIAL DE ESTADOS (trazabilidad completa)
CREATE TABLE historial_estados (
  id              BIGSERIAL PRIMARY KEY,
  ticket_id       BIGINT NOT NULL REFERENCES tickets(id),
  estado          VARCHAR(50) NOT NULL,
  usuario_id      BIGINT NOT NULL REFERENCES usuarios(id),
  observacion     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_solicitante ON tickets(solicitante_id);
CREATE INDEX idx_tickets_responsable ON tickets(responsable_id);
CREATE INDEX idx_tickets_fecha ON tickets(fecha_creacion);
CREATE INDEX idx_historial_ticket ON historial_estados(ticket_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_azure_oid ON usuarios(azure_oid);
```

---

## 🔐 AUTENTICACIÓN, AUTORIZACIÓN Y SINCRONIZACIÓN CON ENTRA ID

### Contexto Confirmado
- La organización **ya tiene un App Registration** creado en Azure AD para esta aplicación.
- Los grupos y permisos de roles en Azure AD **aún no han sido configurados**. El backend debe manejar los roles internamente en la tabla `usuarios`.
- Los usuarios deben estar **alineados con los usuarios activos de Entra ID**. Se implementará sincronización bidireccional.

### Flujo de Autenticación

1. El **frontend Vue.js** inicia el flujo OAuth2 usando **MSAL.js** (Microsoft Authentication Library).
2. El usuario se autentica contra **Microsoft Entra ID** y obtiene un `id_token` + `access_token`.
3. El frontend envía el `access_token` al endpoint `POST /api/auth/login` del backend.
4. El backend **valida el token contra Microsoft** (verificando firma, audience, issuer).
5. El backend consulta **Microsoft Graph API** (`/me`) para obtener datos del perfil del usuario.
6. El backend busca al usuario por `azure_oid` en la tabla `usuarios`:
   - **Si existe**: Actualiza nombre/email si cambió, verificar campo `activo`.
   - **Si NO existe**: Crea el registro con rol `Básico` por defecto.
   - **Si `activo = false`**: Deniega el acceso con HTTP 403.
7. El backend genera un **JWT propio** (firmado con clave secreta) con los claims: `sub` (email), `role`, `name`, `userId`.
8. Retorna el JWT al frontend junto con los datos del usuario.

### Sincronización de Desactivación con Azure AD (CONFIRMADA — IMPLEMENTAR)

Implementar un **servicio programado** (Scheduled Task) que periódicamente (ej: cada 6 horas) consulte Microsoft Graph API para:
1. Listar usuarios activos del Tenant.
2. Comparar con la tabla `usuarios` local.
3. Marcar como `activo = false` a cualquier usuario que ya no exista o esté deshabilitado en Azure AD.
4. Opcionalmente, registrar un log de auditoría de desactivaciones.

```java
@Scheduled(cron = "0 0 */6 * * *") // Cada 6 horas
public void syncUsersWithEntraId() { ... }
```

### Roles y Permisos (RBAC — Gestionados internamente)

| Rol              | Permisos                                                                                                   |
|------------------|------------------------------------------------------------------------------------------------------------|
| **Administrador** | CRUD completo sobre Áreas, Asuntos, Usuarios (incluye asignar roles). Ve todos los tickets. Acceso a Estadísticas y Reportes. |
| **Gestionador**   | Cambia estados de tickets. Ve todos los tickets. Acceso a Estadísticas y Reportes. No configura sistema.  |
| **Básico**        | Crea tickets. Ve **solo sus propios tickets**. No accede a Estadísticas, Reportes ni Configuración.       |

> Los roles se asignan manualmente por un Administrador desde la interfaz o directamente en BD. No se leen de grupos de Azure AD en esta versión.

---

## 🔄 MÁQUINA DE ESTADOS DEL TICKET

Implementar las siguientes **transiciones válidas**. Cualquier transición no definida debe ser rechazada con HTTP 400.

```
                    ┌──────────────┐
                    │   CREADO     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
              ┌─────│  EN PROCESO  │─────┐
              │     └──────┬───────┘     │
              │            │             │
              ▼            │             ▼
       ┌──────────┐        │      ┌──────────┐
       │ PAUSADO  │────────┘      │ CERRADO  │
       └──────────┘               └──────────┘
```

**Transiciones permitidas:**

| Desde        | Hacia          | Quién puede                    |
|-------------|----------------|--------------------------------|
| Creado      | En Proceso     | Gestionador, Administrador     |
| En Proceso  | Pausado        | Gestionador, Administrador     |
| En Proceso  | Cerrado        | Gestionador, Administrador     |
| Pausado     | En Proceso     | Gestionador, Administrador     |

> Un ticket `Cerrado` **NO puede reabrirse**. Un ticket `Creado` **NO puede ir directamente a Cerrado** (debe pasar por En Proceso).

---

## ⏱️ SISTEMA DUAL DE ANS (Calendario + Horas Hábiles)

Cada Asunto puede configurarse con uno de dos modos de cálculo de ANS:

### Modo `CALENDARIO` (24/7)
- El tiempo corre de forma continua desde la creación del ticket.
- Cálculo: `horasTranscurridas = (ahora - fechaCreacion) / 3600000`

### Modo `HABIL` (Solo días laborables)
- El tiempo solo corre de lunes a viernes, dentro del horario laboral.
- **Horario de la firma**: Lunes a Viernes, 8:00 AM a 6:00 PM (10 horas hábiles por día).
- Implementar un `BusinessHoursCalculator` en el paquete `shared/util` que calcule las horas hábiles transcurridas excluyendo noches, fines de semana y (opcionalmente) festivos.

```java
public class BusinessHoursCalculator {
    private static final LocalTime START = LocalTime.of(8, 0);
    private static final LocalTime END = LocalTime.of(18, 0);

    public static long calculateBusinessHours(LocalDateTime from, LocalDateTime to) {
        // Lógica que recorre día por día, contando solo horas dentro del rango laboral
        // Excluye sábados y domingos
    }
}
```

El campo `tipo_ans` en las tablas `asuntos` y `tickets` determina qué modo usar.

---

## 📧 NOTIFICACIONES POR EMAIL (CONFIRMADA — IMPLEMENTAR)

Implementar notificaciones automáticas por correo electrónico usando **Spring Boot Mail** + **Thymeleaf** para plantillas HTML.

### Eventos que disparan notificación:

| Evento                        | Destinatarios                                        | Asunto del correo                                    |
|-------------------------------|------------------------------------------------------|------------------------------------------------------|
| Ticket Creado                 | Responsable asignado + Solicitante (confirmación)    | `[TicketsOM] Nuevo requerimiento: TK-XXXXX`         |
| Cambio de Estado              | Solicitante + Responsable                            | `[TicketsOM] Tu ticket TK-XXXXX cambió a: {estado}` |
| Ticket Cerrado                | Solicitante                                          | `[TicketsOM] Tu solicitud TK-XXXXX fue resuelta`    |
| ANS a punto de vencer (80%)   | Responsable                                          | `[TicketsOM] ⚠️ TK-XXXXX próximo a vencer ANS`      |

### Implementación con Eventos de Dominio

Usar el patrón de **eventos de Spring** (`ApplicationEventPublisher`) para desacoplar la lógica de tickets de la de notificaciones:

```java
// En TicketApplicationService
eventPublisher.publishEvent(new TicketStatusChangedEvent(ticket, oldStatus, newStatus, currentUser));

// En TicketEventListener (módulo notification)
@EventListener
public void onStatusChanged(TicketStatusChangedEvent event) {
    emailNotificationService.sendStatusChangeEmail(event);
}
```

### Configuración SMTP (application.yml)

```yaml
spring:
  mail:
    host: smtp.office365.com      # O el SMTP corporativo
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

---

## 📡 CONTRATO DE API REST

El frontend YA EXISTE y consume datos con una estructura específica. Los endpoints deben devolver **exactamente** los DTOs que el frontend espera.

### Formato de Respuesta Estándar

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "errors": []
}
```

### Autenticación

```
POST   /api/auth/login          — Body: { accessToken: "token_de_azure" }
                                  Response: { jwt, user: {id, email, name, role} }
GET    /api/auth/me             — Devuelve el usuario autenticado actual
```

### Tickets

```
GET    /api/tickets             — Lista de tickets (filtrada por rol del usuario autenticado)
         Query params: ?status=Creado&search=TK-12345&page=0&size=20
POST   /api/tickets             — Crea un nuevo ticket
         Body: { title, areaId, subjectId, description }
         Efecto: Asigna responsable automático, registra historial, envía email
GET    /api/tickets/{id}        — Detalle completo (incluye logs/historial)
PATCH  /api/tickets/{id}/status — Cambia el estado (valida máquina de estados)
         Body: { status: "En Proceso" }
         Efecto: Registra historial, envía email de notificación
```

### Configuración (Solo Administrador)

```
GET    /api/areas               — Lista de áreas activas
POST   /api/areas               — Crea área nueva. Body: { nombre }
DELETE /api/areas/{id}          — Borrado lógico (activa = false)

GET    /api/subjects            — Lista de asuntos. Query: ?areaId=X
POST   /api/subjects            — Body: { areaId, nombre, ansHoras, tipoAns, responsableId }
DELETE /api/subjects/{id}       — Borrado lógico

GET    /api/users               — Lista de usuarios del sistema
PATCH  /api/users/{id}/role     — Cambia el rol. Body: { role: "Gestionador" }
```

### Reportes y Estadísticas

```
GET    /api/reports/tickets     — Lista filtrada para vista de reportes
         Query: ?from=2026-01-01&to=2026-12-31&areaId=1&subjectId=2&page=0&size=50
GET    /api/reports/export/csv  — Descarga directa de archivo CSV (Content-Type: text/csv)
         Mismos query params. El backend genera el archivo como stream.

GET    /api/statistics/kpis     — { slaCompliance, overdueCount, avgClosureTime, totalTickets }
GET    /api/statistics/by-status — { creado: N, enProceso: N, pausado: N, cerrado: N }
GET    /api/statistics/by-area   — [{ areaName, count }]
GET    /api/statistics/by-agent  — [{ name, resolved, avgTime, slaPercentage }]
```

---

## 📋 ESTRUCTURA DE DTOs (Request / Response)

### TicketCreateDTO (Request)
```json
{
  "title": "Búsqueda de anterioridades marca XYZ",
  "areaId": 2,
  "subjectId": 3,
  "description": "Se requiere búsqueda fonética y figurativa..."
}
```

### TicketResponseDTO (Response — Debe coincidir exactamente con lo que espera el frontend)
```json
{
  "id": 1,
  "codigo": "TK-00054",
  "title": "Búsqueda de anterioridades marca XYZ",
  "description": "Se requiere búsqueda fonética...",
  "areaId": 2,
  "areaName": "Marcas",
  "subjectId": 3,
  "subjectName": "Registro de Marca Nuevo",
  "responsible": "Maria Garcia",
  "responsibleId": 5,
  "status": "Creado",
  "ans": 12,
  "tipoAns": "HABIL",
  "createdAt": "2026-04-21T10:30:00Z",
  "createdBy": "user@firma.com",
  "closedAt": null,
  "logs": [
    {
      "state": "Creado",
      "timestamp": "2026-04-21T10:30:00Z",
      "user": "Solicitante"
    }
  ]
}
```

### KpiDTO (Response de estadísticas)
```json
{
  "slaCompliance": 87,
  "overdueCount": 3,
  "avgClosureTime": 18,
  "totalTickets": 45
}
```

### AgentPerformanceDTO
```json
{
  "name": "Juan Pérez",
  "resolved": 12,
  "avgTime": 14,
  "sla": 92
}
```

---

## ⚙️ REGLAS DE NEGOCIO CRÍTICAS

1. **Asignación automática de responsable**: Al crear un ticket, el sistema asigna el `responsable_id` del `Asunto` seleccionado.
2. **ANS heredado e inmutable**: Los campos `ans_horas` y `tipo_ans` se copian desde el Asunto al ticket en el momento de creación. No cambian después.
3. **Trazabilidad obligatoria**: Cada cambio de estado genera un registro en `historial_estados` con usuario, timestamp y observación opcional.
4. **Filtrado por rol**: `Básico` ve solo tickets donde `solicitante_id = currentUser.id`. `Administrador` y `Gestionador` ven todos.
5. **Cálculo de vencimiento dual**: Dependiendo de `tipo_ans`, usar horas calendario o el `BusinessHoursCalculator`.
6. **Código secuencial**: `TK-00001`, `TK-00002`... Usar secuencia de PostgreSQL.
7. **Fecha de cierre**: Se establece automáticamente cuando el estado cambia a `Cerrado`.
8. **Validación de transiciones**: Rechazar con HTTP 400 cualquier transición de estado no permitida por la máquina de estados.
9. **Usuarios alineados a Entra ID**: Solo usuarios activos en Azure AD pueden autenticarse. Sincronización cada 6 horas.
10. **Notificaciones no bloqueantes**: El envío de email es asíncrono (`@Async`). Un fallo en el envío no debe impedir la operación del ticket.

---

## 🔗 INTEGRACIÓN CON EL FRONTEND (Servidores separados)

| Concepto          | Detalle                                                  |
|-------------------|----------------------------------------------------------|
| **Frontend URL**  | `https://tickets.firma.com` (en producción, VM separada) |
| **Backend URL**   | `https://api-tickets.firma.com` (otra VM en Azure)       |
| **Dev Frontend**  | `http://localhost:8081` (Vue CLI dev server)              |
| **Dev Backend**   | `http://localhost:8080` (Spring Boot)                     |
| **CORS**          | Configurar whitelist con ambos orígenes (dev + prod)     |
| **Auth Header**   | `Authorization: Bearer <JWT>` en todas las peticiones    |
| **Content-Type**  | `application/json` (excepto CSV export: `text/csv`)     |

### Configuración CORS (Spring)

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:8081",
                "https://tickets.firma.com"
            )
            .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

---

## 🔧 CONFIGURACIÓN DE PERFILES (application.yml)

### application-dev.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ticketsom_db
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  mail:
    host: smtp.office365.com
    port: 587

app:
  jwt:
    secret: ${JWT_SECRET:dev-secret-key-min-256-bits-long-for-hmac-sha256}
    expiration-ms: 86400000  # 24 horas
  azure:
    tenant-id: ${AZURE_TENANT_ID}
    client-id: ${AZURE_CLIENT_ID}
    client-secret: ${AZURE_CLIENT_SECRET}
```

### application-prod.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

server:
  port: 8080
```

---

## 🧪 ENTREGABLES ESPERADOS

1. ✅ **Proyecto Maven compilable** con estructura DDD descrita.
2. ✅ **Perfiles de configuración** (dev, prod) para PostgreSQL local y Azure VM.
3. ✅ **Entidades JPA** con relaciones correctas y anotaciones de validación.
4. ✅ **Repositorios Spring Data JPA** con queries personalizadas para reportes.
5. ✅ **Servicios de aplicación** con lógica de negocio, ANS dual, y máquina de estados.
6. ✅ **Controladores REST** con `@Valid`, paginación, y respuestas estandarizadas.
7. ✅ **Spring Security** + validación de tokens de Azure + generación de JWT propio.
8. ✅ **Sincronización con Entra ID** vía Microsoft Graph API (scheduled task cada 6h).
9. ✅ **Sistema de notificaciones por email** con eventos de dominio y plantillas Thymeleaf.
10. ✅ **BusinessHoursCalculator** para ANS en horas hábiles.
11. ✅ **CsvExportService** que genera el archivo CSV en el backend (streaming).
12. ✅ **GlobalExceptionHandler** con manejo uniforme de errores.
13. ✅ **README.md** con instrucciones de configuración, variables de entorno y ejecución local.

---

## ⚠️ RESTRICCIONES Y CONSIDERACIONES

- **NO** uses Spring WebFlux. Usa Spring MVC (stack síncrono).
- **NO** uses Lombok en exceso. Solo `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` en DTOs.
- **NO** expongas entidades JPA directamente en los endpoints. Siempre mapea a DTOs.
- **NO** hardcodees credenciales. Usa variables de entorno (`${VARIABLE}`).
- **SÍ** implementa paginación con `Pageable` en endpoints de listado.
- **SÍ** usa `@Transactional` en servicios que modifican datos.
- **SÍ** usa `@Async` para el envío de emails (no bloquear el hilo principal).
- **SÍ** documenta los endpoints con Javadoc y/o anotaciones de Swagger/OpenAPI 3.
- El código debe estar en **español** para nombres de dominio (entidades, tablas, campos de negocio) y en **inglés** para convenciones técnicas (controller, service, repository, dto, etc.).

---

## 📊 DATOS SEMILLA (Seed Data)

Incluir un `DataInitializer` (`CommandLineRunner`) que, en perfil `dev`, cargue los siguientes datos si la BD está vacía:

**Áreas:**
- Patentes, Marcas, Derecho de Autor, Litigios

**Asuntos:**
- Búsqueda de Prioridad (Patentes, 24h calendario, responsable: Juan Pérez)
- Redacción de Memoria (Patentes, 48h hábil, responsable: Juan Pérez)
- Registro de Marca Nuevo (Marcas, 12h calendario, responsable: Maria Garcia)
- Contestación de Demanda (Litigios, 72h hábil, responsable: Carlos Ruiz)

**Usuarios:**
- admin@firma.com → Administrador
- gestor@firma.com → Gestionador
- user@firma.com → Básico

---

> **RECUERDA**: El frontend ya está construido y funcionando con mockups. Tu objetivo es que al reemplazar el `localStorage` del store de Vuex por llamadas HTTP al backend, **todo siga funcionando igual** pero con persistencia real en PostgreSQL, autenticación real con Microsoft, y notificaciones por email. El único cambio necesario en el frontend será adaptar el Vuex store para hacer llamadas HTTP en lugar de manipular `localStorage`, configurar MSAL.js, y agregar un interceptor de Axios para inyectar el JWT.
