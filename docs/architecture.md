# Nuxt 4 Project Architecture

Credit management system for Caja de Compensación Familiar del Caquetá (Comfaca). Built with Nuxt 4, MySQL, Prisma, and Nitro/h3.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 4 (Vue 3 + Nitro) |
| Database | MySQL |
| ORM | Prisma |
| API | h3/Nitro server routes |
| Auth | nuxt-auth-utils + JWT |
| UI | @nuxt/ui |
| Styling | Tailwind CSS |

---

## Directory Structure

```
nuxt-creditos/
├── app/                    # Nuxt 4 frontend layer
│   ├── assets/            # Static assets (CSS, images)
│   ├── components/         # Vue components
│   ├── composables/       # Vue composables (useSession, useApi, etc.)
│   ├── config/            # App config (auth.config.ts)
│   ├── layouts/           # Vue layouts
│   ├── lib/               # Internal libraries
│   ├── middleware/         # Nuxt route middleware (auth.ts)
│   ├── pages/             # Vue page components
│   ├── plugins/           # Nuxt plugins
│   ├── app.vue            # Root Vue component
│   ├── app.config.ts      # App-level config
│   └── error.vue          # Error page
├── server/                # Nitro/h3 API layer
│   ├── api/               # API route handlers
│   ├── middleware/        # Server middleware (auth, admin, limit)
│   ├── services/          # Business logic services
│   └── utils/             # Server utilities
├── prisma/                # Database layer
│   ├── schema.prisma      # Prisma schema
│   ├── migrations/        # SQL migrations
│   ├── seeders/           # Database seeders
│   ├── seed-database.ts   # Seed entry point
│   └── generated/         # Generated Prisma client
├── shared/                # Shared code between server/client
│   ├── types/             # TypeScript interfaces
│   ├── utils/             # Shared utilities (jwt.ts)
│   └── auth.d.ts          # Auth type declarations
├── docs/                  # Documentation
├── public/                # Static public assets
├── storage/               # Runtime storage (documents, logs, uploads)
├── nuxt.config.ts         # Nuxt configuration
└── prisma.config.ts      # Prisma configuration
```

---

## app/ Layer (Frontend)

Nuxt 4 uses the `app/` directory as the main source directory (replacing the older `client/` pattern).

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `pages/` | File-based routing. Route groups: `(auth)`, `(public)`, `admin`, `dash`, `solicitud` |
| `layouts/` | Page layout wrappers |
| `components/` | Reusable Vue components |
| `composables/` | Vue composables (stateful logic) |
| `middleware/` | Route middleware (client-side navigation guards) |
| `plugins/` | Nuxt plugins (run on app startup) |
| `assets/` | Compiled/bundled assets (CSS, fonts) |

### Key Files

- **`app.vue`** — Root Vue component
- **`app.config.ts`** — Public app configuration (UI theme, colors)
- **`error.vue`** — Global error page

### Client Middleware

**`middleware/auth.ts`** — Client-side route guard:
- Checks authentication on navigation
- Validates JWT token with backend via `/api/auth/verify`
- Handles session expiration
- Validates role-based permissions via `auth.config.ts`

### Composables

| Composable | Purpose |
|------------|---------|
| `useSession()` | Session state management, token hydration, `validateToken()`, `clearSession()` |
| `useApi()` | HTTP client wrapper for API calls |
| `useStorage()` | Wrapper around Nuxt's `useStorage` for localStorage persistence |
| `usePermissions()` | Role/permission checks |
| `useNotifications()` | Notification state management |
| `useParametros()` / `useParametrosDetalles()` | Configuration parameters |
| `useHealthCheck()` | Health check polling |

---

## server/ Layer (Backend API)

Nitro/h3 server-side API. All routes are auto-imported and prefixed with `/api`.

### API Routes Structure

```
server/api/
├── health.get.ts              # GET /api/health
├── auth/
│   ├── login.post.ts          # POST /api/auth/login
│   ├── register.post.ts       # POST /api/auth/register
│   ├── logout.post.ts         # POST /api/auth/logout
│   ├── verify.get.ts          # GET /api/auth/verify
│   ├── adviser.post.ts        # POST /api/auth/adviser
│   └── recovery.post.ts       # POST /api/auth/recovery
├── user/
├── solicitudes/
│   ├── [id].get.ts           # GET /api/solicitudes/:id
│   ├── [id].delete.ts        # DELETE /api/solicitudes/:id
│   ├── guardar-solicitud.post.ts
│   ├── enviar-solicitud/
│   ├── estados-solicitud.get.ts
│   ├── mis-solicitudes.get.ts
│   └── numero-disponible.post.ts
├── configuraciones/
├── convenios/
├── lineas_credito/
├── notifications/
├── postulante/
└── admin/
```

### Server Middleware

| File | Purpose |
|------|---------|
| `middleware/auth.ts` | Global API authentication guard. Validates session on all `/api/*` routes except public ones. Injects `event.context.user` for downstream handlers. |
| `middleware/admin.ts` | Admin role restriction |
| `middleware/validateSolicitudLimit.ts` | Request limit validation |

**Public routes excluded from auth:**
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/recovery`
- `/api/auth/adviser`
- `/api/auth/verify`
- `/api/health`

### Services

Located in `server/services/`:

| Service | Purpose |
|---------|---------|
| `auth.service.ts` | Authentication, login, register, JWT creation, permission mapping |
| `user.service.ts` | User CRUD operations via Prisma |
| `solicitud.service.ts` | Credit application business logic |
| `convenio.service.ts` | Company agreement operations |
| `configurations.service.ts` | System configuration management |
| `notification.service.ts` | Notification handling |
| `postulacion-solicitud.service.ts` | Application submission workflow |
| `api-sisuweb.ts` | External SISU API client |
| `api-firmaplus.ts` | FirmaPlus API client for digital signatures |
| `api-flaskpdf.ts` | PDF generation service client |

### Server Utilities

`server/utils/` — Shared server utilities (formatting, validation helpers, etc.)

---

## prisma/ Layer (Database)

### Schema Overview

**Provider:** MySQL  
**Output:** `./generated/prisma` (custom Prisma client location)

### Key Models

| Model | Description |
|-------|-------------|
| `users` | System users (username, email, roles as JSON, password_hash) |
| `solicitudes_credito` | Credit applications (numero_solicitud, estado, valor_solicitud) |
| `solicitud_solicitante` | Applicant personal info (persona natural/juridica) |
| `solicitud_payload` | Application form data (laboral, económica, referencias) |
| `solicitud_documentos` | Uploaded documents per application |
| `solicitud_timeline` | Status change history |
| `firmantes_solicitud` | Signers for applications |
| `estados_solicitud` | Status definitions with order and color |
| `empresas_convenio` | Companies with active agreements |
| `documentos_postulantes` | User-uploaded documents |
| `configurations` | Key-value system configuration |
| `notifications` | User notifications |
| `roles` | Role definitions with JSON permissions |
| `modules` | Navigation modules (hierarchical) |
| `tipo_documentos` | Document type catalog |
| `numero_solicitudes` | Sequence tracking for application numbers |
| `personal_access_tokens` | API tokens |
| `sessions` | Server-side sessions |

### Enums

```prisma
enum solicitud_solicitante_tipo_persona { natural juridica }
enum empresas_convenio_estado { Activo Inactivo Suspendido Vencido }
enum solicitud_solicitante_genero { M F O }
enum rol_en_solicitud { T S C E }  // Trabajador, Solicitante, Codeudor, Empleador
```

### Prisma Configuration (`prisma.config.ts`)

Environment-aware datasource selection:
```typescript
datasource: {
  url: process.env.DATABASE_ENV === "pro"
    ? process.env.DATABASE_URL_PRO
    : process.env.DATABASE_URL_DEV
}
```

---

## Runtime Config & Environment Pattern

### nuxt.config.ts runtimeConfig

```typescript
runtimeConfig: {
  public: {
    environment: env.NODE_ENV || "development"
  },
  database: {
    env: env.DATABASE_ENV || "dev",
    url_pro: env.DATABASE_URL_PRO || "",
    url_dev: env.DATABASE_URL_DEV || ""
  },
  storage: {
    documentsPath: resolve(__dirname, env.STORAGE_DOCUMENTS_PATH || "storage/"),
    logs: resolve(__dirname, env.STORAGE_LOGS_PATH || "storage/"),
    uploads: resolve(__dirname, env.STORAGE_UPLOADS_PATH || "storage/")
  },
  apiSISU: {
    env: env.API_SISU_ENV || "dev",
    url_pro: env.API_SISU_URL_PRO || "",
    url_dev: env.API_SISU_URL_DEV || "",
    client_id: env.API_SISU_CLIENT_ID || "",
    password: env.API_SISU_PASSWORD || "",
    type_auth: env.API_SISU_TYPE_AUTH || "Bearer",
    basic_user: env.API_SISU_BASIC_USER || "",
    basic_password: env.API_SISU_BASIC_PASSWORD || ""
  },
  apiFIRMA: { /* FirmaPlus config */ },
  apiFLASKPDF: { /* Flask PDF service config */ },
  backendBaseUrl: env.NUXT_BACKEND_BASE_URL + ":" + env.NUXT_BACKEND_BASE_PORT,
  jwtSecret: env.NUXT_JWT_SECRET || ""
}
```

### Environment Variable Pattern

| Variable | Purpose |
|----------|---------|
| `DATABASE_ENV` | Switch between `dev`/`pro` database |
| `DATABASE_URL_PRO` / `DATABASE_URL_DEV` | Per-environment DB URLs |
| `API_SISU_ENV` | Switch SISU API environment |
| `API_FIRMA_ENV` | Switch FirmaPlus API environment |
| `NUXT_JWT_SECRET` | JWT signing secret |
| `NUXT_SESSION_PASSWORD` | Session encryption password |
| `STORAGE_DOCUMENTS_PATH` / `_LOGS_PATH` / `_UPLOADS_PATH` | File storage paths |
| `NUXT_BACKEND_BASE_URL` / `NUXT_BACKEND_BASE_PORT` | Internal backend URL |

### Environment File (.env.template)

```bash
STAGE=dev
NUXT_PORT=4000
DATABASE_ENV=dev
NODE_ENV=development
NUXT_SESSION_PASSWORD=
NITRO_PRESET=node

API_SISU_ENV=pro
API_SISU_URL_PRO="http://"
API_SISU_URL_DEV="http://"

API_FIRMA_ENV=dev
API_FIRMA_URL_PRO="https://firmaplus.co/Risk/api"
API_FIRMA_URL_DEV="https://firmaplus.co/FirmaPlusPruebas/api"

NUXT_BACKEND_BASE_URL="http://localhost"
NUXT_BACKEND_BASE_PORT=5001
NUXT_JWT_SECRET=
```

---

## Authentication & Authorization

### Authentication Flow

1. **Login** — `POST /api/auth/login` → validates credentials → creates session + JWT
2. **Session** — Stored via `nuxt-auth-utils` `setUserSession()` (server-side encrypted cookie)
3. **JWT** — Created via `jwtManager` (shared utility), contains `{sub: userId, email, roles}`
4. **Token Validation** — Client calls `useSession().validateToken()` which hits `/api/auth/verify`
5. **Logout** — `POST /api/auth/logout` clears session

### Client Session (useSession)

- Hydrates from localStorage on client mount
- Separate storage keys: `access_token`, `token_type`, `user`, `trabajador`
- 5-minute validation cache to avoid excessive backend calls
- `authHeader` computed for API requests: `{ Authorization: "Bearer <token>" }`

### Server Auth Middleware

- Intercepts all `/api/*` routes
- Calls `getUserSession(event)` from nuxt-auth-utils
- Injects `event.context.user` for handlers
- Public routes bypass check

### Role-Based Permissions

Roles defined in `auth.service.ts`:
```typescript
const rolePermissions = {
  administrator: ["users.*", "applications.*", "roles.manage", "system.admin"],
  adviser: ["applications.*", "solicitudes.manage", "convenios.*", "firmas.*"],
  user_empresa: ["applications.create", "applications.edit", "applications.view_own"],
  user_trabajador: ["applications.*", "applications.view_own"]
}
```

Route permission checks via `config/auth.config.ts`:
- `shouldApplyAuthMiddleware(path)` — determines if route needs auth
- `hasPermissionForRoute(path, roles)` — checks role permissions

---

## shared/ Layer

Shared TypeScript types and utilities used by both server and client.

### shared/types/

TypeScript interfaces in `shared/types/` (e.g., `users-session.ts`):
```typescript
interface UserSession {
  id: string
  username: string
  name: string
  email: string
  roles: string[]
  trabajador: Trabajador | null
  adviser: Adviser | null
}
```

### shared/utils/

**`jwt.ts`** — JWT manager singleton:
- `signJwt(payload)` — create token
- `verifyJwt(token)` — validate token
- `extractBearerToken(header)` — parse Authorization header

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Main Nuxt configuration, modules, runtime config, Nitro/Vite settings |
| `prisma/schema.prisma` | Database schema, models, relations, enums |
| `prisma.config.ts` | Prisma CLI configuration with env-aware datasource |
| `app/middleware/auth.ts` | Client-side route guard + token validation |
| `server/middleware/auth.ts` | Server-side API authentication |
| `server/services/auth.service.ts` | Auth business logic, role permissions |
| `app/composables/useSession.ts` | Client session management |
| `app/config/auth.config.ts` | Route-to-permission mapping |
| `shared/utils/jwt.ts` | JWT sign/verify utilities |

---

## Nuxt Modules Used

| Module | Purpose |
|--------|---------|
| `@nuxt/eslint` | Linting |
| `@nuxt/ui` | UI component library |
| `@nuxt/image` | Image optimization |
| `@nuxt/icon` | Icon components |
| `@nuxt/fonts` | Font optimization |
| `nuxt-auth-utils` | Session management |
| `@nuxt/test-utils/module` | Testing utilities |