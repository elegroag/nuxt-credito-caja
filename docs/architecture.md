# Arquitectura del Sistema — Comfaca Créditos

> Documento técnico que describe la arquitectura del sistema de créditos en línea de la Caja de Compensación Familiar del Caquetá (Comfaca).
> Cubre: stack tecnológico, librerías, módulos Nuxt, capa de datos, capa de servidor, servicios externos, infraestructura, assets, auth/RBAC y ciclo de CI/CD.
> Fuentes: `nuxt.config.ts`, `package.json`, `prisma.config.ts`, `server/`, `app/`, `public/`, `shared/`, `.github/workflows/ci.yml`, `.env.template`.
> Documentos relacionados: [`docs/data-model.md`](./data-model.md) (modelo de datos) · [`docs/process-model.md`](./process-model.md) (proceso de creación de solicitud).

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Stack tecnológico por capa](#2-stack-tecnológico-por-capa)
3. [Módulos Nuxt y configuración](#3-módulos-nuxt-y-configuración)
4. [Capa de datos (Prisma + MySQL)](#4-capa-de-datos-prisma--mysql)
5. [Capa de servidor Nitro/h3 — estructura](#5-capa-de-servidor-nitroh3--estructura)
6. [Servicios externos e integraciones](#6-servicios-externos-e-integraciones)
7. [Almacenamiento local y remoto](#7-almacenamiento-local-y-remoto)
8. [Frontend (app/) — capas y componentes](#8-frontend-app--capas-y-componentes)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Assets estáticos y fuentes](#10-assets-estáticos-y-fuentes)
11. [Tipos compartidos (shared/)](#11-tipos-compartidos-shared)
12. [Configuración de entorno (runtimeConfig)](#12-configuración-de-entorno-runtimeconfig)
13. [Ciclo de vida de la aplicación](#13-ciclo-de-vida-de-la-aplicación)
14. [CI/CD y operación](#14-cicd-y-operación)
15. [Dependencias — detalle y propósito](#15-dependencias--detalle-y-propósito)
16. [Apéndices](#16-apéndices)

---

## 1. Visión general

El sistema es una **aplicación web monolítica Nuxt 4 full-stack** (Vue 3 + Nitro/h3) con persistencia en MySQL/MariaDB y múltiples integraciones externas (Sisu, KIAI, FirmaPlus, FlaskPDF, SFTP, SMTP, Mercurio).

```
┌────────────────────────────────────────────────────────────────────┐
│                          USUARIOS (Web)                            │
│              Navegador Vue 3 SSR / SPA hidratado                   │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                   NUXT 4 / NITRO SERVER                            │
│  ┌──────────────────────┐    ┌─────────────────────────┐           │
│  │  app/ (frontend)     │    │  server/ (API + svc)    │           │
│  │  Vue 3 + UI v4       │ ◄► │  h3 endpoints           │           │
│  │  Composables         │    │  Services (negocio)     │           │
│  └──────────────────────┘    └────────┬────────────────┘           │
└─────────────────────────────────────┼──────────────────────────────┘
                                      │
        ┌─────────────────────┬───────┼────────┬──────────────┐
        ▼                     ▼       ▼        ▼              ▼
  ┌──────────┐         ┌──────────┐ ┌─────┐ ┌──────┐    ┌──────────┐
  │ Prisma   │         │ Sisu     │ │KIAI │ │Firma │    │ SFTP     │
  │ → MariaDB│         │ (orig.)  │ │(firma│ │Plus │    │(remotos) │
  └──────────┘         └──────────┘ │ext.)│ └──────┘    └──────────┘
                                    └─────┘
                                    ┌──────────┐
                                    │ FlaskPDF │ ┌─────┐
                                    │ (PDF)    │ │ SMTP│
                                    └──────────┘ └─────┘
                                                  ┌─────────┐
                                                  │ Mercurio│
                                                  └─────────┘
```

**Modelo de despliegue:** Nitro `node-server` preset → proceso Node.js standalone.

### Directorio raíz

```
nuxt-creditos/
├── app/                    # Nuxt 4 frontend layer
├── server/                 # Nitro/h3 API layer
├── prisma/                 # Database layer
├── shared/                 # Shared code between server/client
├── docs/                   # Documentation
├── public/                 # Static public assets
├── storage/                # Runtime storage (documents, logs, uploads)
├── nuxt.config.ts          # Nuxt configuration
├── prisma.config.ts        # Prisma configuration
└── tests/                  # Vitest + Playwright
```

---

## 2. Stack tecnológico por capa

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| **Runtime** | Node.js | 22 (CI) | Ejecuta Nitro y servicios |
| **Framework** | Nuxt | ^4.5.1 | Framework full-stack |
| **UI engine** | Vue | ^3.5.41 | Renderizado reactivo |
| **Routing** | vue-router | ^5.2.0 | Navegación SPA/SSR |
| **Server** | Nitro / h3 | (incluido) | API server, endpoints |
| **ORM** | Prisma | ^7.9.1 | Acceso a datos tipado |
| **DB driver** | @prisma/adapter-mariadb | ^7.9.1 | Adaptador MariaDB |
| **DB** | MariaDB / MySQL | (compatible) | Persistencia |
| **Styling** | Tailwind CSS | ^4.3.3 | Utility-first CSS |
| **UI Kit** | @nuxt/ui | ^4.10.0 | 125+ componentes accesibles |
| **Componentes primitivos** | radix-vue | ^1.9.17 | Primitivos accesibles |
| **Iconos** | @nuxt/icon + @iconify-json/lucide + @iconify-json/simple-icons | ^2.4.1 / ^1.2.121 / ^1.2.93 | Lucide + Simple Icons |
| **Iconos legacy** | @heroicons/vue, @lucide/vue | ^2.2.0 / ^1.28.0 | Compatibilidad |
| **Imágenes** | @nuxt/image | 2.0.0 | Optimización y responsive |
| **Fuentes** | @nuxt/fonts | ^0.14.0 | Auto-carga de fuentes |
| **Auth** | nuxt-auth-utils | ^0.5.30 | JWT + sesión |
| **JWT** | jose | ^6.2.8 | Firmado/verificación JWT |
| **Validación** | zod | ^4.4.3 | Schemas runtime |
| **Formularios** | @vee-validate/nuxt + @vee-validate/zod | 4.15.1 | Validación declarativa |
| **Estilos utilitarios** | class-variance-authority, clsx, tw-animate-css | varios | Variantes de componentes |
| **Fechas** | @internationalized/date | 3.12.3 | Manipulación i18n de fechas |
| **Email** | nodemailer | ^8.0.11 | SMTP cliente |
| **SFTP** | ssh2-sftp-client | ^12.1.1 | Transferencia SSH |
| **QR** | qrcode | ^1.5.4 | Generación QR |
| **Excel** | exceljs | ^4.4.0 | Reportes XLSX |
| **Hashing** | bcryptjs | ^3.0.3 | Hash de passwords |
| **Drag & drop** | vuedraggable | 4.1.0 | Listas reordenables |
| **HTTP cliente** | ofetch | (transitivo Nuxt) | Fetch tipado |
| **Test runner** | vitest + @nuxt/test-utils + happy-dom + msw | ^4.1.10 | Tests unit/integration |
| **E2E** | @playwright/test | ^1.62.1 | Tests e2e |
| **Linter** | @nuxt/eslint + eslint-config-prettier | ^1.16.0 / ^10.1.8 | ESLint flat config |
| **TS runtime** | tsx (dev) + ts-node | ^4.23.7 / ^10.9.2 | Ejecutar TS sin compilar |
| **Formateo** | prettier | ^3.9.6 | Formateo código |
| **Tipos** | typescript + vue-tsc | ^6.0.3 / ^3.3.9 | Tipado estático |

---

## 3. Módulos Nuxt y configuración

### 3.1 Módulos registrados (`nuxt.config.ts:6`)

```ts
modules: [
  "@nuxt/eslint",             // ESLint flat config + reglas Nuxt
  "@nuxt/ui",                 // 125+ componentes UI accesibles
  "@nuxt/image",              // <NuxtImg>, <NuxtPicture>, optimización
  "@nuxt/icon",               // Iconos Iconify
  "@nuxt/fonts",              // Auto-carga de Google Fonts
  "nuxt-auth-utils",          // JWT + sesión server-side
  "@nuxt/test-utils/module",  // Helpers para tests integration
  "@vee-validate/nuxt"        // Formularios
]
```

### 3.2 Alias de paths

```ts
alias: {
  "@": "./app",
  "~": "./app",
  "@tests": "./tests/",
  "~~": "./",                                  // raíz del proyecto
  ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js"
}
```

### 3.3 Configuración de UI (`@nuxt/ui`)

- **Tema:** `dark` por defecto (en `app/app.config.ts`).
- **Colores:** `neutral: zinc`, `primary: indigo`.
- **Tokens de theme:** `["primary", "secondary", "accent", "destructive", "muted"]`.

### 3.4 Configuración de iconos

`clientBundle.scan = true` y **lista explícita de 13 iconos pre-empaquetados** (evita fetch en runtime):
`lucide:bell, home, calculator, shield, file-signature, users, share-2, list, bar-chart-3, building-2, settings, file-text, user, file-plus`.

### 3.5 Configuración Vite

- Aliases espejo de los de Nuxt (necesarios en SSR).
- `optimizeDeps.include` fuerza pre-bundle de: `@lucide/vue`, `@heroicons/vue/24/outline`, `class-variance-authority`, `clsx`, `radix-vue`, `zod`.
- `build.sourcemap` solo en `NODE_ENV=development`.

### 3.6 Route rules

```ts
"/dash/**": { isr: false }   // sin ISR (con auth dinámico)
```

### 3.7 Nitro

- Preset: `node-server` (proceso Node.js standalone).
- `experimental.asyncContext = true`.
- Prerender: `routes: []` y `ignore: ["/dashboard", "/admin/**", "/dash/**"]` (todo dinámico).

### 3.8 ESLint

```ts
eslint: {
  config: { stylistic: { commaDangle: "never", braceStyle: "1tbs" } }
}
```

### 3.9 veeValidate

Auto-imports activados; componentes renombrados: `VeeForm`, `VeeField`, `VeeFieldArray`, `VeeErrorMessage`.

### 3.10 App head

```ts
title: "Comfaca Creditos En Línea"
meta:
  description: "Solicita tu crédito online de manera rápida y segura."
  charset: utf-8
  viewport: "width=device-width, initial-scale=1"
```

### 3.11 Dev server

```ts
port: Number(process.env.NUXT_PORT) || 3000   // deseado
host: process.env.NUXT_HOST || "localhost"
```

---

## 4. Capa de datos (Prisma + MySQL)

| Aspecto | Valor |
|---|---|
| Schema | `prisma/schema.prisma` (546 líneas, 5 enums, 22 modelos) |
| Provider | `mysql` (MariaDB-compatible) |
| Output del cliente | `./generated/prisma` (custom, no `node_modules`) |
| Adapter runtime | `@prisma/adapter-mariadb` |
| Carga de `.env` | Manual vía `prisma.config.ts` con `import dotenv` |
| Migraciones | `pnpm db:migrate` (`prisma migrate dev`) |
| Seeder | `pnpm db:seed` ejecuta `tsx prisma/seeders/seed-database.ts` |
| Conexión | `DATABASE_ENV` selecciona entre `DATABASE_URL_DEV` y `DATABASE_URL_PRO` |

### 4.1 `prisma.config.ts`

```ts
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seeders/seed-database.ts"
  },
  datasource: {
    url: process.env.DATABASE_ENV === "pro"
      ? process.env.DATABASE_URL_PRO
      : process.env.DATABASE_URL_DEV
  }
});
```

> ⚠️ Prisma NO carga `.env` automáticamente — `prisma.config.ts` lo hace manualmente con `dotenv`.

### 4.2 Modelos principales (resumen)

| Modelo | Descripción |
|---|---|
| `users` | Usuarios del sistema (username, email, password_hash, roles JSON, PII) |
| `solicitudes_credito` | Solicitudes radicadas (PK = `numero_solicitud`) |
| `solicitud_solicitante` | Persona vinculada (titular o codeudor) |
| `solicitud_payload` | Payload completo del formulario (JSON versionado) |
| `solicitud_documentos` | Adjuntos cargados por el solicitante |
| `solicitud_timeline` | Bitácora de transiciones de estado |
| `firmantes_solicitud` | Lista ordenada de firmantes |
| `procesos_firma` | Procesos externos (KIAI, FirmaPlus) |
| `firmar_anexos` | Anexos a firmar (pagarés, cartas) |
| `estados_solicitud` | Catálogo de estados (11 estados con `orden` y `color`) |
| `empresas_convenio` | Empresas con convenio de libranza |
| `tipo_documentos` | Catálogo de tipos de documento requeridos |
| `numero_solicitudes` | Generador de radicados `000007-2026-03` |
| `configurations` | Pares clave-valor dinámicos |
| `notifications` | Notificaciones polimórficas |
| `pdfs_generados` | PDF final por solicitud (1:1, UNIQUE) |
| `usuarios_codeudores` | Vínculo N:M titular ↔ codeudor (con autorización) |
| `roles` / `permissions` / `role_permissions` / `module_permissions` / `route_permissions` | RBAC completo |
| `modules` | Menú dinámico jerárquico |
| `sessions` / `personal_access_tokens` | Sesiones server-side |

### 4.3 Enums

```prisma
enum solicitud_solicitante_tipo_persona { natural juridica }
enum solicitud_solicitante_genero       { M F O }
enum empresas_convenio_estado            { Activo Inactivo Suspendido Vencido }
enum rol_en_solicitud                    { T S C E }    // Trabajador, Solicitante, Codeudor, Empleador
enum usuarios_codeudores_estado          { pendiente autorizado rechazado expirado }
```

> Ver detalle completo de los 22 modelos en [`docs/data-model.md`](./data-model.md).

---

## 5. Capa de servidor Nitro/h3 — estructura

```
server/
├── api/                         # Endpoints HTTP
│   ├── admin/                   # Endpoints administrativos
│   ├── auth/                    # /api/auth/*
│   ├── cms/                     # CMS API
│   ├── codeudores/              # /api/codeudores/*
│   ├── configurations/          # /api/configurations/*
│   ├── convenios/               # /api/convenios/*
│   ├── firmas/                  # /api/firmas/*
│   ├── health.get.ts            # Health check
│   ├── lineas_credito/          # /api/lineas_credito/*
│   ├── mercurio/                # Integración Mercurio (firma digital)
│   ├── nav/                     # Menú dinámico (módulos RBAC)
│   ├── notifications/           # /api/notifications/*
│   ├── parametros/              # /api/parametros/*
│   ├── postulante/              # conyuge-trabajador.post.ts
│   ├── public/                  # Endpoints públicos
│   ├── solicitudes/             # 7 archivos + [id]/ (5 archivos)
│   ├── user/                    # /api/user/*
│   └── validacion/              # codigo-firma.post.ts
├── middleware/                  # Middleware Nitro
│   ├── admin.ts                  # Guards para rutas /admin/**
│   ├── auth.ts                  # Validación JWT
│   └── validateSolicitudLimit.ts # Rate limit por endpoint
├── nohup/                       # Worker background
│   ├── app.ts                   # Entry point (tsx server/nohup/app.ts)
│   ├── lib/
│   ├── workers/
│   │   └── consultar-firma.worker.ts # Polling KIAI
│   └── README.md
├── services/                    # Capa de negocio
│   ├── admin/                   # stats, firmar-anexos
│   ├── firma/                   # Validadores + mapper KIAI
│   ├── pdf/                     # pdf-payload, pdf-storage, pdf-flask-v2-adapter
│   ├── reports/                 # Generadores de reportes Excel
│   ├── shared/                  # sisuweb, parametros, sftp, smtp
│   ├── storage/
│   ├── api-firmaplus.ts         # Cliente FirmaPlus
│   ├── api-flaskpdf.ts          # Cliente FlaskPDF
│   ├── api-kiai.ts              # Cliente KIAI (firma externa)
│   ├── api-sisuweb.ts           # Cliente Sisu (originación)
│   ├── auth.service.ts          # Auth + JWT + role permissions
│   ├── codeudor.service.ts      # Vínculos titular-codeudor
│   ├── configurations.service.ts
│   ├── convenio.service.ts
│   ├── notification.service.ts
│   ├── postulacion-solicitud.service.ts # Workflow de radicación
│   ├── rbac.service.ts / rbac-admin.service.ts
│   ├── solicitud.service.ts     # CRUD + timeline de solicitudes
│   └── user.service.ts          # CRUD de usuarios
└── utils/                       # Utilidades transversales
    ├── CustomResponse.ts        # Wrapper de respuesta uniforme
    ├── logger.service.ts        # Logger con niveles
    └── ...
```

### 5.1 Patrón de respuesta uniforme

Todos los endpoints retornan `CustomResponse.success(data, msg)` o `CustomResponse.error(msg, label)`, lo que da una forma estable para el frontend:

```ts
{
  success: boolean,
  data: T | null,
  message: string,
  error?: string
}
```

### 5.2 Middleware Nitro

| Middleware | Función |
|---|---|
| `auth.ts` | Valida sesión JWT (cookie httpOnly) en cada request. Inyecta `event.context.user`. |
| `admin.ts` | Verifica rol administrador en rutas `/api/admin/**` |
| `validateSolicitudLimit.ts` | Rate-limit sobre endpoints sensibles |

**Rutas públicas excluidas del middleware `auth`:** `/api/auth/login`, `/api/auth/register`, `/api/auth/recovery`, `/api/auth/adviser`, `/api/auth/verify`, `/api/health`.

### 5.3 Worker en background (`server/nohup/`)

Proceso Node.js separado (no parte de Nitro), entry: `tsx server/nohup/app.ts` (script `pnpm nohup:firmas`).

Función: **polling de procesos de firma KIAI**. Consulta periódicamente el estado de los procesos `PENDING`/`IN_PROGRESS` en `procesos_firma` y sincroniza con `solicitud_timeline` cuando el proveedor externo notifica cambio.

---

## 6. Servicios externos e integraciones

### 6.1 Mapa de integraciones

| Sistema | Tipo | Protocolo | Servicio | Archivo de config |
|---|---|---|---|---|
| **Sisu** | Originación de crédito | REST/HTTP + OAuth2 | `api-sisuweb.ts` | `runtimeConfig.apiSISU` |
| **KIAI** | Firma digital externa | REST + OAuth2 (client_credentials) | `api-kiai.ts` | `runtimeConfig.kiai` |
| **FirmaPlus** | Firma digital (legacy) | REST + Bearer + Basic Auth | `api-firmaplus.ts` | `runtimeConfig.apiFIRMA` |
| **FlaskPDF** | Generación de PDFs | REST + HTTP Basic | `api-flaskpdf.ts` | `runtimeConfig.apiFLASKPDF` |
| **SMTP (Gmail)** | Correo transaccional | SMTP SSL/TLS | `smtp-mailer.service.ts` | `runtimeConfig.mail` |
| **SFTP** | Transferencia de archivos | SSH/SFTP | `sftp-client.service.ts` | `runtimeConfig.sftp` |
| **Mercurio** | Firma digital local | REST (interno) | `server/api/mercurio/*` | — |

### 6.2 Sisu — originación

- **Auth:** Bearer token + Basic Auth opcional (`client_id` + `password` o `basic_user` + `basic_password`).
- **URL:** `DATABASE_ENV` selecciona entre `API_SISU_URL_DEV` y `API_SISU_URL_PRO`.
- **Uso:** `GET /api/solicitudes/enviar-solicitud/{slug}` envía la solicitud aprobada al backend de originación.

### 6.3 KIAI — firma digital

- **Auth:** OAuth2 `client_credentials` con cache de token (TTL configurable; default 15 min).
- **URL auth:** `https://usuarios.kiai.co` (pro) / `https://usuarios-demo.kiai.co` (dev).
- **Métodos de firma soportados:** `CLICK`, `ADVANCED`, `HANDWRITTEN`.
- **Métodos de autenticación de firmante:** `OTP_EMAIL`, `OTP_SMS`, `OTP_WHATSAPP`.
- **Estados de proceso:** `DRAFT`, `PENDING`, `IN_PROGRESS`, `COMPLETED`, `DECLINED`, `EXPIRED`, `CANCELLED`.
- **Mock:** en modo `simulation=true` (dev) genera IDs/procesos ficticios sin llamar al proveedor.

### 6.4 FirmaPlus — firma (legacy)

- **Auth:** Bearer (`client_id`/`password`) + Basic (`basic_user`/`basic_password`).
- **Endpoints consumidos:** `signer`, `consultarsolicitud/{id}`, `cancelarsolicitud`.
- **Mock:** activa en `simulation=true`.
- **URL dev (template):** `https://firmaplus.co/FirmaPlusPruebas/api`
- **URL pro (template):** `https://firmaplus.co/Risk/api`

### 6.5 FlaskPDF — generación de PDF

- **Auth:** Basic Auth (`basic_user` + `basic_password`).
- **Modo:** autenticado o no según `opts.auth`.
- **Patrón:** POST JSON → recibe PDF binario o respuesta JSON con metadatos.
- **Almacenamiento:** los binarios se persisten vía `pdf-storage.service.ts`.

### 6.6 SMTP — correo transaccional

- **Provider:** Gmail (default) o cualquier SMTP estándar.
- **Default:** `smtp.gmail.com:465` (SSL) — configurable a `:587` (STARTTLS).
- **Credenciales Gmail:** requiere App Password (16 caracteres) con 2FA activado.
- **Pooling:** nodemailer gestiona conexión por envío (sin singleton).
- **TLS validation:** `reject_unauthorized=true` por defecto; **NUNCA desactivar en producción**.

### 6.7 SFTP — transferencia de archivos

- **Auth soportada:** clave privada RSA/ED25519 (preferida, en `SFTP_PRIVATE_KEY_BASE64`) o password simple (`SFTP_PASSWORD`).
- **Puerto:** 22 (default).
- **Singleton:** el servicio mantiene una conexión por instancia; llamar `disconnect()` al terminar.
- **Operaciones:** upload, download, list, mkdir, exists.

### 6.8 Mercurio — firma digital local

- **Endpoint:** `/api/mercurio/firma_digital_keys` — verifica si el usuario tiene firma digital local registrada.
- **Trigger:** opcional, controlado por config `firma_digital_local` (boolean).

---

## 7. Almacenamiento local y remoto

### 7.1 Estructura del filesystem

```
storage/
├── documents/          # PDFs finales por solicitud
├── logs/               # Logs de aplicación y nohup worker
├── temp/               # Archivos temporales (uploads parciales)
└── uploads/            # Documentos cargados por el solicitante
    └── {solicitud_id}/
        └── {uuid}.{ext}
```

Configurable vía `runtimeConfig.storage.*` (`STORAGE_DOCUMENTS_PATH`, `STORAGE_LOGS_PATH`, `STORAGE_UPLOADS_PATH`).

### 7.2 Convención de nombres de archivo

- **UUID v4** generado con `crypto.randomUUID()`.
- Extensión derivada del filename original (whitelist: `jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx`) o del MIME type.
- Path público: `/storage/uploads/{solicitud_id}/{uuid}.{ext}`.

### 7.3 Almacenamiento remoto (SFTP)

Para documentos que deben persistirse fuera del servidor de aplicación (oficios firmados, reportes a operadores), se usa el servicio `sftp-client.service.ts`. La ruta base remota es `SFTP_BASE_PATH` (default `/`).

---

## 8. Frontend (app/) — capas y componentes

### 8.1 Estructura

```
app/
├── app.vue                    # Root component
├── app.config.ts              # Config de UI (tema, colores)
├── error.vue                  # Manejo global de errores
├── assets/
│   └── css/
│       ├── main.css           # Estilos globales
│       └── admin-solicitudes.css
├── components/                # Componentes Vue reutilizables
│   ├── admin/
│   ├── auth/
│   ├── config/
│   ├── dash/
│   ├── dashboard/
│   ├── documentos/
│   ├── icons/
│   ├── notifications/
│   ├── public/
│   ├── shared/
│   ├── solicitud/
│   ├── solicitudes/
│   ├── ui/                    # Wrappers de @nuxt/ui
│   └── wizard/
├── composables/               # Lógica reutilizable
│   ├── solicitud/             # Composables del dominio solicitud
│   ├── admin/                 # useConfigurations, useUsers, etc.
│   ├── useApi.ts              # Cliente HTTP tipado
│   ├── useSession.ts          # Estado de sesión
│   ├── useStorage.ts          # Wrapper de useStorage Nuxt
│   ├── usePermissions.ts      # Verificación de permisos
│   ├── useNotifications.ts
│   ├── useParametros.ts / useParameterDetalles.ts
│   ├── useHealthCheck.ts
│   └── useSimuladorStorage.ts # Estado del simulador de crédito
├── config/
│   └── auth.config.ts         # Config de permisos por rol/ruta
├── layouts/                   # Layouts (auth, dash, admin, public)
├── lib/
│   ├── estados_firma_kiai.ts  # Mapeo de estados KIAI
│   ├── tipos_documento.ts     # Catálogo de tipos de documento
│   └── utils.ts
├── middleware/
│   └── auth.ts                # Route guard client-side
├── pages/                     # Rutas file-based
│   ├── index.vue
│   ├── (auth)/
│   ├── admin/
│   ├── dash/
│   ├── public/
│   └── solicitud/
├── plugins/                   # Plugins Nuxt
└── utils/                     # Utilidades
```

### 8.2 Composables críticos

| Composable | Propósito |
|---|---|
| `useWizardSolicitud` | Orquesta el wizard de 10 pasos, número provisional, generación de radicado |
| `useSolicitudCreditoForm` | Estado del formulario (valor, plazo, solicitante, etc.) |
| `useDocumentosSolicitud` | Carga, listado, eliminación de documentos por solicitud |
| `useResumenSolicitud` | Pantalla resumen + disparo de generación/envío |
| `useSolicitudValidation` | Validación Zod cliente |
| `useSession` | Estado de sesión, `validateToken`, `clearSession` |
| `useApi` | Wrapper de `ofetch` con manejo de auth |
| `useConfigurations` | Lectura del catálogo `configurations` |
| `useSimuladorStorage` | Persistencia del simulador en localStorage |
| `useFirmadoDigital` | Manejo del flujo de firma digital (KIAI, FirmaPlus) |

### 8.3 Cliente HTTP (`useApi`)

Wrapper sobre `ofetch` que:

- Inyecta token JWT automáticamente (`{ auth: true }`).
- Decodifica la estructura `CustomResponse` → expone `.data`, `.success`, `.message`.
- Captura errores 401 → limpia sesión + redirige a `/login`.

### 8.4 Route guard (`middleware/auth.ts`)

Verifica:

1. Existencia de token.
2. Validación contra `/api/auth/verify` (server-side).
3. Permisos por ruta (configurados en `app/config/auth.config.ts`).
4. Manejo de sesión expirada.

---

## 9. Authentication & Authorization

### 9.1 Flujo de autenticación

1. **Login** — `POST /api/auth/login` → valida credenciales → crea sesión + JWT.
2. **Sesión** — Almacenada vía `nuxt-auth-utils` `setUserSession()` (cookie server-side encriptada).
3. **JWT** — Creado vía `jwtManager` (utilidad compartida), contiene `{sub: userId, email, roles}`.
4. **Validación de token** — Cliente llama `useSession().validateToken()` que pega contra `/api/auth/verify`.
5. **Logout** — `POST /api/auth/logout` limpia la sesión.

### 9.2 Sesión cliente (`useSession`)

- Se hidrata desde `localStorage` al montar el cliente.
- Claves de almacenamiento separadas: `access_token`, `token_type`, `user`, `trabajador`.
- **Cache de validación de 5 minutos** para evitar llamadas excesivas al backend.
- `authHeader` computado para requests API: `{ Authorization: "Bearer <token>" }`.

### 9.3 Middleware de auth (server)

- Intercepta todas las rutas `/api/*`.
- Llama `getUserSession(event)` de `nuxt-auth-utils`.
- Inyecta `event.context.user` para los handlers.
- Rutas públicas bypasean el check (ver §5.2).

### 9.4 Permisos por rol

Definidos en `auth.service.ts`:

```typescript
const rolePermissions = {
  administrator:  ["users.*", "applications.*", "roles.manage", "system.admin"],
  adviser:        ["applications.*", "solicitudes.manage", "convenios.*", "firmas.*"],
  user_empresa:   ["applications.create", "applications.edit", "applications.view_own"],
  user_trabajador:["applications.*", "applications.view_own"]
};
```

> **Nota:** los roles permitidos para **crear** una solicitud de crédito son: `administrator`, `adviser`, `user_trabajador`, `user_empresa`, `empleador` (verificado en `server/api/solicitudes/guardar-solicitud.post.ts:112`).

### 9.5 Verificación de permisos por ruta

Configurada en `app/config/auth.config.ts`:

- `shouldApplyAuthMiddleware(path)` — determina si la ruta requiere auth.
- `hasPermissionForRoute(path, roles)` — verifica permisos del rol.

### 9.6 RBAC completo (server-side)

La BD persiste las reglas de RBAC en:

- `permissions` — slugs granulares (`solicitudes.create`, `firmas.cancelar`...).
- `roles` — roles del sistema (nombre + permisos JSON cache).
- `role_permissions` — pivote N:M rol↔permiso.
- `modules` — menú dinámico con auto-relación jerárquica.
- `module_permissions` — pivote módulo↔permiso.
- `route_permissions` — guards por prefijo de ruta.

Servicios que gestionan esto: `server/services/rbac.service.ts` y `rbac-admin.service.ts`.

---

## 10. Assets estáticos y fuentes

### 10.1 `public/` — assets públicos servidos por Nitro

```
public/
├── favicon.ico
├── robots.txt
├── img/
│   ├── compartir-firmas.png         # Promocional: compartir firmas
│   ├── credito-social.png           # Promocional: crédito social
│   ├── entidad-digital.png          # Promocional: entidad digital
│   ├── firmas.png                   # Promocional: módulo de firmas
│   ├── listado-de-tus-solicitudes.png # Promocional: listado
│   ├── simulador-credito.png        # Promocional: simulador
│   └── solicitud-de-credito.png     # Promocional: solicitud
└── storage/
    └── cms/                         # Assets del CMS
```

### 10.2 Fonts

- **`@nuxt/fonts`** detecta y precarga fuentes según el uso en componentes.
- **CSS global (`main.css`):** define `font-family` base; usa Tailwind v4 + tokens.

### 10.3 Iconos

- **Set principal:** `lucide` (Iconify) — 13 iconos pre-empaquetados en cliente.
- **Set secundario:** `simple-icons` (Iconify) — para logos de marcas.
- **Wrappers Vue:** `@lucide/vue`, `@heroicons/vue`.

### 10.4 Tailwind v4

- Plugin `tw-animate-css` para animaciones.
- Tokens de color del tema UI v4 (zinc/indigo).
- `@nuxt/image` para imágenes responsivas (`<NuxtImg>`, `<NuxtPicture>`).

---

## 11. Tipos compartidos (`shared/`)

El directorio `shared/` (auto-importado por Nuxt 4 en server y client) contiene definiciones de tipos que cruzan ambas capas.

```
shared/
├── auth.d.ts                     # Tipos de sesión/roles
├── types/
│   ├── admin-solicitudes.ts
│   ├── admin-usuarios.ts
│   ├── adviser.ts
│   ├── auth.ts
│   ├── cms.ts
│   ├── componentes.ts
│   ├── configuration.ts
│   ├── convenios.ts
│   ├── conyuges.ts
│   ├── credito.ts
│   ├── documento.ts
│   ├── entidad.ts
│   ├── enums.ts
│   ├── firmar-anexos.ts
│   ├── firmas.ts
│   ├── inicio.ts
│   ├── layout.ts
│   ├── linea-credito.ts
│   ├── nuxt.d.ts
│   ├── parametros.ts
│   ├── payload.ts
│   ├── perfil.ts
│   ├── postulacion.ts
│   ├── prisma.ts                 # Re-exports de tipos Prisma
│   ├── qrcode.d.ts
│   ├── reports/
│   ├── response.ts
│   ├── session.ts
│   ├── simulador.ts
│   ├── solicitante.ts
│   ├── solicitud-credito.ts
│   ├── solicitud.ts
│   ├── trabajador.ts
│   ├── users-session.ts          # UserSession interface
│   └── wizard.ts
└── utils/
    ├── formatters.ts             # Formateo de números, fechas, moneda
    ├── generales.ts
    ├── jwt.ts                    # JWT manager singleton
    └── rbac-rules.ts             # Reglas de permisos RBAC
```

### 11.1 Interfaz `UserSession` (`shared/types/users-session.ts`)

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

### 11.2 `shared/utils/jwt.ts` — JWT manager singleton

- `signJwt(payload)` — crea token.
- `verifyJwt(token)` — valida token.
- `extractBearerToken(header)` — parsea el header Authorization.

---

## 12. Configuración de entorno (`runtimeConfig`)

Toda la configuración del servidor se centraliza en `nuxt.config.ts → runtimeConfig`. Se selecciona entre dev y pro con sufijos `*_ENV`.

### 12.1 Tabla completa

| Sección | Vars ENV | Propósito |
|---|---|---|
| `public.environment` | `NODE_ENV` | `development` / `production` |
| `database.env` | `DATABASE_ENV` | `dev` / `pro` |
| `database.url_dev` | `DATABASE_URL_DEV` | Connection string MariaDB |
| `database.url_pro` | `DATABASE_URL_PRO` | Connection string MariaDB |
| `storage.*` | `STORAGE_*_PATH` | Rutas de storage local |
| `apiSISU.*` | `API_SISU_*` | Endpoint Sisu + OAuth |
| `apiFIRMA.*` | `API_FIRMA_*` | Endpoint FirmaPlus + auth |
| `kiai.*` | `KIAI_*` | Endpoint KIAI + OAuth2 |
| `apiFLASKPDF.*` | `API_FLASKPDF_*` | Endpoint FlaskPDF + Basic Auth |
| `mail.*` | `MAIL_*` | SMTP Gmail/otro |
| `sftp.*` | `SFTP_*` | SSH file transfer |
| `backendBaseUrl` | `NUXT_BACKEND_BASE_URL`, `NUXT_BACKEND_BASE_PORT` | URL del backend interno |
| `jwtSecret` | `NUXT_JWT_SECRET` | Secreto para JWT |

### 12.2 Selección dev/pro

```ts
const isPro = config.apiFIRMA.env === "pro";
const baseUrl = isPro ? config.apiFIRMA.url_pro : config.apiFIRMA.url_dev;
```

**Patrón consistente:** cada integración tiene `url_dev`, `url_pro`, `env`, y opcionalmente `simulation`. La convención se replica en `apiSISU`, `apiFIRMA`, `kiai`, `apiFLASKPDF`.

### 12.3 Modo simulación

- **KIAI** y **FirmaPlus:** si `simulation = true` (auto-true en `dev` salvo override), retornan respuestas mock sin llamar al proveedor.
- **Sisu:** no tiene simulación; se conecta a `API_SISU_URL_DEV` (default `http://127.0.0.1:5001`).

### 12.4 Variables de entorno (referencia)

| Variable | Propósito |
|---|---|
| `DATABASE_ENV` | Switch entre `dev`/`pro` database |
| `DATABASE_URL_PRO` / `DATABASE_URL_DEV` | Per-environment DB URLs |
| `API_SISU_ENV` | Switch SISU API environment |
| `API_FIRMA_ENV` | Switch FirmaPlus API environment |
| `NUXT_JWT_SECRET` | JWT signing secret |
| `NUXT_SESSION_PASSWORD` | Session encryption password |
| `STORAGE_DOCUMENTS_PATH` / `_LOGS_PATH` / `_UPLOADS_PATH` | File storage paths |
| `NUXT_BACKEND_BASE_URL` / `NUXT_BACKEND_BASE_PORT` | Internal backend URL |

### 12.5 `.env.template`

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

## 13. Ciclo de vida de la aplicación

### 13.1 Build

```bash
pnpm install                  # genera .nuxt/, instala deps
pnpm db:generate              # genera cliente Prisma → ./generated/prisma
pnpm build                    # nuxt build → .output/ (Nitro compilado)
```

### 13.2 Dev

```bash
pnpm dev                      # nuxt dev → Nitro dev server en :3000
pnpm nohup:firmas             # worker de polling KIAI (proceso paralelo)
pnpm nohup:firmas:daemon      # versión daemon con nohup + log a storage/logs/
```

### 13.3 Producción (Nitro `node-server`)

```bash
node .output/server/index.mjs
```

### 13.4 Postinstall

```json
"postinstall": "nuxt prepare"
```

Regenera `.nuxt/` con tipos y auto-imports.

---

## 14. CI/CD y operación

### 14.1 GitHub Actions (`.github/workflows/ci.yml`)

```yaml
name: ci
on: push
jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix: { node: [22] }
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with: { node-version: '22', cache: pnpm }
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run typecheck
```

**Triggers:** `push` a cualquier rama.
**Versión Node:** 22 (LTS).
**Verificaciones:** install + lint + typecheck.

> ⚠️ El workflow **no ejecuta tests ni build**. Para un pipeline más robusto, añadir `pnpm test:unit` y `pnpm build`.

### 14.2 Comandos de operación local

```bash
# Base de datos
pnpm db:generate     # genera cliente Prisma
pnpm db:migrate      # aplica migraciones
pnpm db:push         # sincroniza schema sin migraciones
pnpm db:reset        # reset completo
pnpm db:seed         # ejecuta seeders

# Calidad
pnpm lint            # ESLint
pnpm typecheck       # nuxt typecheck (vue-tsc)
pnpm test            # vitest watch
pnpm test:unit       # vitest run (todos)
pnpm test:unit:server # solo server
pnpm test:unit:client # solo client
pnpm test:integration # integración
pnpm test:e2e        # Playwright
pnpm test:coverage   # con reporte

# Verificación
pnpm build           # build de producción
pnpm preview         # preview del build
```

### 14.3 Umbrales de cobertura

Definidos en `vitest.config.ts`:

| Métrica | Mínimo |
|---|---|
| Líneas | ≥ 80% |
| Funciones | ≥ 80% |
| Ramas | ≥ 75% |
| Statements | ≥ 80% |

### 14.4 Workers en background

`server/nohup/` se ejecuta como proceso Node.js independiente (no parte de Nitro):

- **Entry:** `tsx server/nohup/app.ts`
- **Función:** `consultar-firma.worker.ts` — polling de procesos KIAI.
- **Logs:** `storage/logs/nohup-firmas.log`
- **Supervisión:** externa (no hay PM2/systemd en el repo).

---

## 15. Dependencias — detalle y propósito

### 15.1 Dependencias de producción (31 paquetes)

| Paquete | Versión | Propósito |
|---|---|---|
| `nuxt` | ^4.5.1 | Framework full-stack |
| `vue` | ^3.5.41 | UI reactiva |
| `vue-router` | ^5.2.0 | Routing |
| `@nuxt/ui` | ^4.10.0 | Kit UI accesible |
| `@nuxt/image` | 2.0.0 | Optimización de imágenes |
| `@nuxt/icon` | ^2.4.1 | Iconos Iconify |
| `@nuxt/fonts` | ^0.14.0 | Auto-carga de fuentes |
| `nuxt-auth-utils` | ^0.5.30 | Sesión JWT |
| `radix-vue` | ^1.9.17 | Primitivos accesibles |
| `@vee-validate/nuxt` | 4.15.1 | Formularios |
| `@prisma/client` | ^7.9.1 | Cliente ORM |
| `@prisma/adapter-mariadb` | ^7.9.1 | Driver MariaDB |
| `zod` | ^4.4.3 | Validación |
| `jose` | ^6.2.8 | JWT |
| `bcryptjs` | ^3.0.3 | Hash passwords |
| `nodemailer` | ^8.0.11 | SMTP |
| `@types/nodemailer` | ^8.0.1 | Tipos |
| `ssh2-sftp-client` | ^12.1.1 | SFTP |
| `@types/ssh2-sftp-client` | ^9.0.6 | Tipos |
| `qrcode` | ^1.5.4 | QR |
| `exceljs` | ^4.4.0 | Excel |
| `tailwindcss` | ^4.3.3 | CSS utility-first |
| `tw-animate-css` | ^1.4.0 | Animaciones Tailwind |
| `class-variance-authority` | ^0.7.1 | Variantes componentes |
| `clsx` | ^2.1.1 | Conditional className |
| `@internationalized/date` | 3.12.3 | Fechas i18n |
| `@iconify-json/lucide` | ^1.2.121 | Iconos Lucide |
| `@iconify-json/simple-icons` | ^1.2.93 | Iconos simple |
| `@heroicons/vue` | ^2.2.0 | Iconos Heroicons |
| `@lucide/vue` | ^1.28.0 | Iconos Lucide Vue |
| `vuedraggable` | 4.1.0 | Drag & drop |

### 15.2 Dependencias de desarrollo (21 paquetes)

| Paquete | Versión | Propósito |
|---|---|---|
| `@nuxt/eslint` | ^1.16.0 | Módulo ESLint |
| `@nuxt/test-utils` | ^4.1.0 | Helpers para tests |
| `@playwright/test` | ^1.62.1 | E2E |
| `vitest` | ^4.1.10 | Test runner |
| `@vitest/coverage-v8` | ^4.1.10 | Cobertura |
| `@vue/test-utils` | ^2.4.11 | Test de componentes |
| `happy-dom` | ^20.11.1 | DOM para tests |
| `msw` | ^2.15.0 | Mock service worker |
| `prisma` | ^7.9.1 | CLI Prisma |
| `typescript` | ^6.0.3 | Tipos |
| `vue-tsc` | ^3.3.9 | Type-check Vue |
| `tsx` | ^4.23.7 | Ejecutar TS en dev |
| `ts-node` | ^10.9.2 | Ejecutar TS en dev |
| `eslint` | ^10.8.0 | Linter |
| `eslint-config-prettier` | ^10.1.8 | Desactiva reglas conflicting con Prettier |
| `prettier` | ^3.9.6 | Formateo |
| `autoprefixer` | ^10.5.4 | Prefijos CSS |
| `dotenv` | ^17.4.2 | Carga .env (Prisma) |
| `@types/node` | ^25.9.5 | Tipos Node |
| `@vitejs/plugin-vue` | ^6.0.8 | Plugin Vue para Vite |
| `@vee-validate/zod` | ^4.15.1 | Adaptador Zod para vee-validate |

### 15.3 Resoluciones

```json
"resolutions": {
  "unimport": "6.1.0"
}
```

Forza una versión específica de `unimport` para evitar incompatibilidades con Nuxt 4.

### 15.4 onlyBuiltDependencies

```json
"onlyBuiltDependencies": ["esbuild", "@parcel/watcher"]
```

Paquetes con post-install scripts permitidos (necesarios para build).

---

## 16. Apéndices

### 16.1 Apéndice A — Mapa de páginas → endpoint → servicio

| Página (`pages/`) | Endpoint principal | Servicio |
|---|---|---|
| `/` (index) | (público) | — |
| `/(auth)/login` | `POST /api/auth/login` | `auth.service.ts` |
| `/dash/solicitud/index` | `GET /api/solicitudes/mis-solicitudes` | inline |
| `/dash/solicitud/edit/[id]` | `GET /api/solicitudes/{id}`, `POST /api/solicitudes/guardar-solicitud` | `postulacion-solicitud.service` |
| `/dash/solicitud/documentos/[id]` | `GET/POST /api/solicitudes/{id}/documentos` | inline |
| `/dash/solicitud/resumen/[id]` | `POST /api/solicitudes/{id}/cambiar-estado`, `POST /api/solicitudes/{id}/generar-pdf` | inline + PDF services |
| `/dash/solicitud/special_thanks/[id]` | (vista estática final) | — |
| `/dash/firmas/*` | `GET /api/firmas/*` | `services/firma/*` |
| `/dash/responsabilidades/[id]` | `GET /api/codeudores/responsabilidades/{id}` | `codeudor.service` |
| `/admin/solicitudes/show/[id]` | `GET /api/solicitudes/enviar-solicitud/{slug}` | `datos-api-sisuweb.service` |
| `/admin/usuarios/*` | `GET /api/user/*` | `user.service` |

### 16.2 Apéndice B — Key Files Reference

| Archivo | Propósito |
|---|---|
| `nuxt.config.ts` | Main Nuxt configuration, modules, runtime config, Nitro/Vite settings |
| `prisma/schema.prisma` | Database schema, models, relations, enums |
| `prisma.config.ts` | Prisma CLI configuration with env-aware datasource |
| `app/middleware/auth.ts` | Client-side route guard + token validation |
| `server/middleware/auth.ts` | Server-side API authentication |
| `server/services/auth.service.ts` | Auth business logic, role permissions |
| `app/composables/useSession.ts` | Client session management |
| `app/config/auth.config.ts` | Route-to-permission mapping |
| `shared/utils/jwt.ts` | JWT sign/verify utilities |

### 16.3 Apéndice C — Variables de entorno críticas (producción)

Lista de las variables que **deben** estar presentes en `.env` para producción. Referencia completa en `.env.template`.

```bash
# Base de datos
DATABASE_ENV=pro
DATABASE_URL_PRO=mysql://user:pass@host:3306/comfaca_creditos

# Auth
NUXT_JWT_SECRET=<64+ caracteres random>
NUXT_BACKEND_BASE_URL=http://localhost
NUXT_BACKEND_BASE_PORT=3000

# Sisu
API_SISU_ENV=pro
API_SISU_URL_PRO=https://...
API_SISU_CLIENT_ID=<oauth client>
API_SISU_PASSWORD=<oauth secret>

# KIAI
KIAI_ENV=pro
KIAI_API_URL_PRO=https://api.kiai.co
KIAI_CLIENT_ID_PRO=<client>
KIAI_SECRET_KEY_PRO=<secret>

# FirmaPlus
API_FIRMA_ENV=pro
API_FIRMA_URL_PRO=https://firmaplus.co/Risk/api
API_FIRMA_TYPE_AUTH=Bearer
API_FIRMA_CLIENT_ID=<client>
API_FIRMA_PASSWORD=<secret>

# FlaskPDF
API_FLASKPDF_ENV=pro
API_FLASKPDF_URL_PRO=https://...
API_FLASKPDF_USER=<basic user>
API_FLASKPDF_PASSWORD=<basic pass>

# Mail
MAIL_ENV=pro
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=<gmail account>
MAIL_PASSWORD=<16-char app password>
MAIL_FROM_NAME=Comfaca Créditos
MAIL_FROM_ADDRESS=noreply@comfaca.com

# SFTP (opcional)
SFTP_HOST=<host>
SFTP_PORT=22
SFTP_USER=<user>
SFTP_PASSWORD=<pass>
# o SFTP_PRIVATE_KEY_BASE64=<base64>
SFTP_BASE_PATH=/comfaca
```

### 16.4 Apéndice D — Decisiones arquitectónicas clave

1. **Nitro preset `node-server`:** proceso Node.js standalone (no Vercel/Cloudflare-specific), permite worker separado.
2. **Prisma con output custom:** `./generated/prisma` evita clutter en `node_modules` y permite cache de cliente por CI.
3. **MariaDB adapter:** mantiene compatibilidad con MySQL existente.
4. **JSON columns para payloads complejos:** `solicitud_payload.*` almacena el formulario completo en columnas JSON para flexibilidad sin migraciones constantes.
5. **Sesión JWT server-side con `nuxt-auth-utils`:** httpOnly cookies + secret compartido. Max age 8h.
6. **CustomResponse wrapper:** forma uniforme `{ success, data, message }` para todos los endpoints, simplifica el cliente HTTP.
7. **Modo simulación por entorno:** cada integración externa tiene `simulation=true/false` para trabajar offline en dev.
8. **Worker KIAI separado (nohup):** polling desacoplado del proceso Nitro principal; fallo del worker no afecta UI.
9. **Shared types en `shared/`:** auto-importados por Nuxt 4 en server y client; evita duplicar tipos.
10. **`useState` para estado compartido:** sin Pinia/Vuex explícito; `useState` de Nuxt provee reactividad cross-component.
11. **Pipeline de 11 estados:** la transición está cerrada en `estados_solicitud` (orden 1-11) y se gestiona en `solicitud_timeline` por servicio.
12. **Validación dual Zod:** schemas en frontend (`@vee-validate/zod`) y backend (zod puro) garantizan validación end-to-end.

### 16.5 Apéndice E — Hallazgos conocidos

1. **CI incompleto** (`§14.1`): el workflow ejecuta solo lint + typecheck; no hay `pnpm test` ni `pnpm build`. **Recomendación:** añadir ambos pasos.
2. **Brecha en `solicitud_timeline`** para transiciones manuales: el endpoint `POST /api/solicitudes/{id}/cambiar-estado` no inserta en `solicitud_timeline`. Solo las transiciones automáticas del servicio `postulacion-solicitud` quedan registradas. **Recomendación:** añadir `INSERT solicitud_timeline` dentro del endpoint.
3. **`guardarSolicitudCompleta()` sin transacción Prisma:** ejecuta 8 inserciones secuenciales sin rollback automático. Ver detalle en [`docs/process-model.md` §14](./process-model.md).
4. **Desfase de formato de vigencia:** `numero-disponible.post.ts` produce `YYYYMM` (ej. `202604`); `postulacion-solicitud.service.ts:113` produce `YYYY` (ej. `2026`). Ambos coexisten en `numero_solicitudes.vigencia` (`Int`). **Recomendación:** unificar la convención.
5. **Imágenes PNG en `public/img/`** sin referencia Vue explícita: los 7 assets promocionales existen pero no se encontraron imports directos en componentes. Probablemente usados vía SSR en `app.vue` o copy-paste manual.