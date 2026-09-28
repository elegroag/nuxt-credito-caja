# API de Firma Electrónica — KIAI

Documentación de referencia para integrar la firma electrónica de KIAI. Organizada a partir de la documentación entregada por KIAI; los puntos contradictorios o incompletos están marcados con **⚠ Por confirmar con KIAI** y resumidos en la sección [Pendientes por confirmar](#11-pendientes-por-confirmar-con-kiai).

## Contenido

1. [Resumen](#1-resumen)
2. [Entornos y URLs base](#2-entornos-y-urls-base)
3. [Credenciales](#3-credenciales)
4. [Autenticación](#4-autenticación)
5. [Flujo rápido: de cero a proceso firmado](#5-flujo-rápido-de-cero-a-proceso-firmado)
6. [Procesos de firma: endpoints](#6-procesos-de-firma-endpoints)
7. [Detalle de endpoints](#7-detalle-de-endpoints)
8. [Referencia de campos](#8-referencia-de-campos)
9. [Firma avanzada y campos en el PDF](#9-firma-avanzada-y-campos-en-el-pdf)
10. [Convertir un PDF a Base64](#10-convertir-un-pdf-a-base64)
11. [Pendientes por confirmar con KIAI](#11-pendientes-por-confirmar-con-kiai)

---

## 1. Resumen

- **Qué hace:** crea procesos de firma sobre un PDF, envía invitaciones a los firmantes (email, SMS o WhatsApp), verifica su identidad con OTP y devuelve el documento firmado con su certificado de auditoría.
- **Autenticación de integraciones:** OAuth2 `client_credentials` → token JWT en el header `Authorization: Bearer <access_token>`.
- **Scopes:** el token solo accede a las APIs de sus scopes: `firma.enviar`, `firma.consultar`.
- **Ciclo de vida de un proceso:** `DRAFT` → `IN_PROGRESS` → `COMPLETED`. Estados finales adicionales: `DECLINED`, `EXPIRED`, `CANCELLED` (ver [pendientes](#11-pendientes-por-confirmar-con-kiai)).

---

## 2. Entornos y URLs base

KIAI separa dos servicios: **GU** (gestión de usuarios / autenticación) y **Firmas** (procesos de firma).

| Servicio | Uso | URL (demo / pruebas) |
|---|---|---|
| GU — Usuarios | Token OAuth2, login, refresh | `https://usuarios-demo.kiai.co` |
| Firmas | Procesos de firma | `https://firmas-demo.kiai.co` |

> ⚠ **Por confirmar con KIAI:** la documentación original etiqueta `https://usuarios-demo.kiai.co` como "Production", pero es el servicio de autenticación del entorno demo. No se entregaron las URLs de producción de GU ni de Firmas. En la sección de credenciales aparece además `https://usuarios.kiai.co/api/oauth/token` (sin `-demo`), posiblemente el token de producción.

En los ejemplos de este documento:

```bash
GU_BASE="https://usuarios-demo.kiai.co"
API_BASE="https://firmas-demo.kiai.co"
```

---

## 3. Credenciales

Se obtienen en el portal de KIAI: **Mi Perfil → Integración API**.

| Dato | Descripción |
|---|---|
| Client ID | Identificador público de la integración (formato `kiai_live_...`). |
| Secret Key (client secret) | Secreto de la integración (formato `ksc_...`). **No versionar ni compartir.** |
| Redirect URI | `https://www.kiai.live/api/oauth/callback` (solo aplica a flujos OAuth con redirección; no se usa en `client_credentials`). |

> Las credenciales reales deben guardarse en `www/.env`, nunca en este documento.

---

## 4. Autenticación

### 4.1 Token de integración — OAuth2 `client_credentials` (recomendado)

Una sola llamada devuelve el `access_token` para autenticar las llamadas a la API de Firmas.

```http
POST {GU_BASE}/api/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "<client_id>",
  "client_secret": "<client_secret>"
}
```

Uso del token en cada petición:

```http
Authorization: Bearer <access_token>
```

- Cuando la API responda **401**, pedir un token nuevo con el mismo endpoint.
- Los scopes del token (`firma.enviar`, `firma.consultar`) determinan a qué APIs se puede acceder.

> ⚠ **Por confirmar con KIAI:** la vigencia del token aparece como **15 minutos** y también como **1 hora**.

### 4.2 Login de usuario (email y contraseña)

Autenticación con un usuario del portal, alternativa a `client_credentials`.

```http
POST {GU_BASE}/api/kiai-app/auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "MiContraseña123!"
}
```

- El token de GU dura **2 horas** (`expiresIn: 7200` segundos).
- La respuesta incluye un `refreshToken` con vigencia de **7 días**.

### 4.3 Renovar token (refresh)

Renueva el token de login sin volver a pedir credenciales.

```http
POST {GU_BASE}/api/kiai-app/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

- Respuesta: igual que `/login`, con un token nuevo y un `refreshToken` nuevo (rotación automática).
- El `refreshToken` anterior queda revocado.

---

## 5. Flujo rápido: de cero a proceso firmado

Tres llamadas: token → crear proceso (con el PDF en Base64) → (opcional) enviar.

### Paso 1 — Obtener el token

Ver [4.1](#41-token-de-integración--oauth2-client_credentials-recomendado). Guardar el `access_token` para los siguientes pasos.

### Paso 2 — Crear el proceso de firma

```http
POST {API_BASE}/api/SignatureProcess/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "processName": "Contrato de servicios",
  "signatureMethod": "CLICK",
  "authenticationMethodCode": "OTP_EMAIL",
  "isSequential": false,
  "isSendByEmail": true,
  "deadlineDays": 7,
  "base64Document": "<PDF_EN_BASE64>",
  "documentFileName": "contrato.pdf",
  "signers": [
    {
      "firstName": "Ana",
      "lastName": "García",
      "email": "ana@empresa.com",
      "signingOrder": 1
    }
  ]
}
```

- Con `isSendByEmail: true` el proceso pasa directamente a `IN_PROGRESS` y se envían las invitaciones.
- Sin `isSendByEmail: true` el proceso queda en `DRAFT`.

### Paso 3 — (Opcional) Enviar un proceso en `DRAFT`

```http
POST {API_BASE}/api/SignatureProcess/{id}/send
Authorization: Bearer <access_token>
```

Listo: el firmante recibe el email con el enlace para firmar.

### Script cURL completo

Sustituir los `<…>` por los valores reales. Requiere `curl` y `jq`.

```bash
API_BASE="https://firmas-demo.kiai.co"
GU_BASE="https://usuarios-demo.kiai.co"
CLIENT_ID="<client_id>"          # Mi Perfil → Integración API
CLIENT_SECRET="<client_secret>"

# 1) Token OAuth2 client_credentials
ACCESS_TOKEN=$(curl -fsSL -X POST "$GU_BASE/api/oauth/token" \
  -H "Content-Type: application/json" \
  -d "{\"grant_type\":\"client_credentials\",\"client_id\":\"$CLIENT_ID\",\"client_secret\":\"$CLIENT_SECRET\"}" | jq -r '.access_token')

# 2) PDF local a Base64 (Linux/Git Bash: -w0; macOS: -i)
PDF_B64=$(base64 -w0 contrato.pdf 2>/dev/null || base64 -i contrato.pdf)

# 3) Crear el proceso (IN_PROGRESS: envía el email automáticamente)
curl -fsSL -X POST "$API_BASE/api/SignatureProcess/create" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "processName":              "Contrato de servicios",
  "signatureMethod":          "CLICK",
  "authenticationMethodCode": "OTP_EMAIL",
  "isSequential":             false,
  "isSendByEmail":            true,
  "deadlineDays":             7,
  "base64Document":           "$PDF_B64",
  "documentFileName":         "contrato.pdf",
  "signers": [
    { "firstName": "Ana", "lastName": "García", "email": "ana@empresa.com", "signingOrder": 1 }
  ]
}
EOF

# 4) Consultar el estado más tarde
curl -fsSL "$API_BASE/api/SignatureProcess/by-company" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.[] | {id, processName, status}'
```

---

## 6. Procesos de firma: endpoints

Un proceso agrupa el PDF y sus firmantes. Todas las rutas son relativas a `{API_BASE}` y requieren `Authorization: Bearer <access_token>`.

| Método | Ruta | Descripción | Detalle |
|---|---|---|---|
| GET | `/api/SignatureProcess/by-company` | Lista los procesos de la empresa autenticada. | [7.1](#71-listar-procesos) |
| POST | `/api/SignatureProcess/create` | Crea un proceso. El PDF va en el body o viene de una plantilla. | [7.2](#72-crear-proceso) |
| GET | `/api/SignatureProcess/{id}` | Detalle completo: estado, firmantes, auditoría. | [7.3](#73-consultar-detalle-del-proceso) |
| GET | `/api/SignatureProcess/by-uuid/{uuid}` | Igual que el anterior, usando el UUID público del proceso. | — |
| POST | `/api/SignatureProcess/{id}/send` | Activa un proceso en `DRAFT` y envía las invitaciones. | [7.4](#74-enviar-proceso-draft--in_progress) |
| POST | `/api/SignatureProcess/{id}/cancel` | Cancela un proceso. No aplica si está en `COMPLETED`, `CANCELLED` o `EXPIRED`. | [7.5](#75-cancelar-proceso) |
| POST | `/api/SignatureProcess/{id}/reminders/send` | Envía un recordatorio manual a los firmantes pendientes (además del automático). | — |
| PUT | `/api/SignatureProcess/{id}/reminder-settings` | Configura los recordatorios automáticos. | [7.6](#76-configurar-recordatorios-automáticos) |
| GET | `/api/SignatureProcess/{id}/document` | Descarga el documento en Base64: el firmado si existe; si no, el original. | — |
| GET | `/api/SignatureProcess/{id}/document/original` | Descarga solo el PDF original, sin firmas. | — |
| GET | `/api/SignatureProcess/{id}/document/signed` | Descarga solo el PDF firmado (únicamente con `status = COMPLETED`). | — |
| GET | `/api/SignatureProcess/{id}/audit-trail-pdf` | Descarga el certificado de auditoría completo como PDF en Base64. | — |

> Los endpoints marcados con "—" no tienen ejemplo de petición ni de respuesta en la documentación entregada.

---

## 7. Detalle de endpoints

### 7.1 Listar procesos

```http
GET {API_BASE}/api/SignatureProcess/by-company
Authorization: Bearer <access_token>
```

Parámetros opcionales (query string):

| Parámetro | Descripción |
|---|---|
| `status` | `DRAFT` \| `PENDING` \| `IN_PROGRESS` \| `COMPLETED` \| `DECLINED` \| `EXPIRED` \| `CANCELLED` |
| `search` | Búsqueda por nombre del proceso. |
| `page` | Número de página (default: 1). |
| `pageSize` | Resultados por página (default: 20, máximo: 100). |
| `dateFrom` | Fecha de creación desde (ISO 8601). |
| `dateTo` | Fecha de creación hasta (ISO 8601). |

Ejemplo:

```http
GET {API_BASE}/api/SignatureProcess/by-company?status=IN_PROGRESS&page=1&pageSize=10
Authorization: Bearer <access_token>
```

Respuesta `200 OK`:

```json
[
  {
    "id": "b3f9a1c2-d847-4e12-9f83-2a1b5c6d7e89",
    "processName": "Contrato de servicios Q2-2026",
    "status": "IN_PROGRESS",
    "signatureMethod": "CLICK",
    "signersCount": 2,
    "expiresAt": "2026-05-13T14:30:00Z",
    "createdAt": "2026-05-06T14:30:00Z"
  },
  {
    "id": "a2e8b0c1-c736-4d01-8e72-1b0a4b5c6d78",
    "processName": "Acuerdo de confidencialidad",
    "status": "COMPLETED",
    "signatureMethod": "CLICK",
    "signersCount": 1,
    "expiresAt": "2026-05-10T09:00:00Z",
    "createdAt": "2026-05-03T09:00:00Z"
  }
]
```

> La respuesta es un arreglo plano, sin datos de paginación. ⚠ **Por confirmar con KIAI:** cómo saber el total de registros o si hay más páginas.

### 7.2 Crear proceso

El PDF va codificado en Base64 dentro del body. Con `isSendByEmail: true` el proceso pasa a `IN_PROGRESS` y envía las invitaciones; con `false` queda en `DRAFT` hasta llamar a `/send`.

```http
POST {API_BASE}/api/SignatureProcess/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "processName": "Contrato de servicios Q2-2026",
  "processDescription": "Contrato de prestación de servicios tecnológicos.",
  "signatureMethod": "CLICK",
  "authenticationMethodCode": "OTP_EMAIL",
  "isSequential": true,
  "deadlineDays": 7,
  "isSendByEmail": true,
  "isSendByWhatsApp": false,
  "messageEmail": "Por favor revisa y firma el documento adjunto.",
  "base64Document": "JVBERi0xLjQgJeLjz9MKMSAwIG9iag...",
  "documentFileName": "contrato-q2-2026.pdf",
  "signers": [
    {
      "firstName": "Carlos",
      "lastName": "López",
      "email": "carlos@cliente.com",
      "phoneIndicative": "+57",
      "phoneNumber": "3001234567",
      "identificationTypeCode": "CC",
      "identificationNumber": "1012345678",
      "signingOrder": 1
    },
    {
      "firstName": "María",
      "lastName": "Torres",
      "email": "maria@cliente.com",
      "signingOrder": 2
    }
  ],
  "fieldPlacements": [
    {
      "signerEmail": "carlos@cliente.com",
      "fieldType": "SIGNATURE",
      "label": "Firma del cliente",
      "page": 3,
      "xPct": 12.5,
      "yPct": 78.3,
      "widthPx": 200,
      "heightPx": 60
    },
    {
      "signerEmail": "maria@cliente.com",
      "fieldType": "SIGNATURE",
      "label": "Firma de aprobación",
      "page": 3,
      "xPct": 60.0,
      "yPct": 78.3,
      "widthPx": 200,
      "heightPx": 60
    }
  ],
  "ccEmails": ["gerencia@empresa.com"],
  "reminderEnabled": true,
  "reminderIntervalDays": 2
}
```

Respuesta `201 Created`:

```json
{
  "id": "b3f9a1c2-d847-4e12-9f83-2a1b5c6d7e89",
  "processName": "Contrato de servicios Q2-2026",
  "processDescription": "Contrato de prestación de servicios tecnológicos.",
  "status": "IN_PROGRESS",
  "signatureMethod": "CLICK",
  "isSequential": true,
  "deadlineDays": 7,
  "expiresAt": "2026-05-13T14:30:00Z",
  "signersCount": 2,
  "templateId": null,
  "createdAt": "2026-05-06T14:30:00Z",
  "signers": [
    { "order": 1, "fullName": "Carlos López", "email": "carlos@cliente.com" },
    { "order": 2, "fullName": "María Torres", "email": "maria@cliente.com" }
  ]
}
```

Campos del body: ver [8.1](#81-body-de-creación-de-proceso) y [8.2](#82-objeto-signer).

### 7.3 Consultar detalle del proceso

```http
GET {API_BASE}/api/SignatureProcess/{id}
Authorization: Bearer <access_token>
```

Respuesta `200 OK`:

```json
{
  "id": "b3f9a1c2-d847-4e12-9f83-2a1b5c6d7e89",
  "processName": "Contrato de servicios Q2-2026",
  "status": "IN_PROGRESS",
  "signatureMethod": "CLICK",
  "isSequential": true,
  "deadlineDays": 7,
  "expiresAt": "2026-05-13T14:30:00Z",
  "completedAt": null,
  "hasDocument": true,
  "documentFileName": "contrato-q2-2026.pdf",
  "hashOriginal": "sha256:e3b0c44298fc1c149afb...",
  "hashSigned": null,
  "hashAlgorithm": "SHA256",
  "reminderSettings": {
    "enabled": true,
    "intervalDays": 2,
    "reminderMessage": null,
    "lastReminderAt": null,
    "nextReminderAt": "2026-05-08T14:30:00Z"
  },
  "signers": [
    {
      "id": "d4e5f6a7-b8c9-4d01-ef12-345678901abc",
      "firstName": "Carlos",
      "lastName": "López",
      "email": "carlos@cliente.com",
      "phoneNumber": "3001234567",
      "status": "SIGNED",
      "signingOrder": 1,
      "signatoryType": "SIGNER",
      "signedAt": "2026-05-06T16:20:00Z",
      "declinedAt": null,
      "declineReason": null,
      "notificationsSent": 1,
      "lastNotificationAt": "2026-05-06T14:30:00Z"
    },
    {
      "id": "e5f6a7b8-c9d0-4e12-f123-456789012bcd",
      "firstName": "María",
      "lastName": "Torres",
      "email": "maria@cliente.com",
      "phoneNumber": null,
      "status": "PENDING",
      "signingOrder": 2,
      "signatoryType": "SIGNER",
      "signedAt": null,
      "declinedAt": null,
      "declineReason": null,
      "notificationsSent": 0,
      "lastNotificationAt": null
    }
  ],
  "auditTrail": [
    {
      "eventCode": "PROCESS_CREATED",
      "eventLabel": "Proceso creado",
      "occurredAt": "2026-05-06T14:30:00Z",
      "actorEmail": "admin@empresa.com",
      "detail": null,
      "hash": null,
      "ipAddress": "190.24.120.45",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "eventCode": "INVITATION_SENT",
      "eventLabel": "Invitación enviada",
      "occurredAt": "2026-05-06T14:30:05Z",
      "actorEmail": null,
      "detail": "carlos@cliente.com",
      "hash": null,
      "ipAddress": null,
      "userAgent": null
    },
    {
      "eventCode": "DOCUMENT_SIGNED",
      "eventLabel": "Documento firmado",
      "occurredAt": "2026-05-06T16:20:00Z",
      "actorEmail": "carlos@cliente.com",
      "detail": null,
      "hash": "e3b0c44298fc1c149afb4c8996fb92427ae41e4649b934ca495991b7852b855",
      "ipAddress": "181.55.42.10",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "reminderHistory": [],
  "createdAt": "2026-05-06T14:30:00Z"
}
```

Estados del firmante que aparecen en el ejemplo: `SIGNED`, `PENDING`. Eventos de auditoría: `PROCESS_CREATED`, `INVITATION_SENT`, `DOCUMENT_SIGNED`.

### 7.4 Enviar proceso (`DRAFT` → `IN_PROGRESS`)

```http
POST {API_BASE}/api/SignatureProcess/{id}/send
Authorization: Bearer <access_token>
```

Respuesta `200 OK`:

```json
{
  "message": "Proceso enviado. Los firmantes han sido notificados."
}
```

### 7.5 Cancelar proceso

```http
POST {API_BASE}/api/SignatureProcess/{id}/cancel
Authorization: Bearer <access_token>
```

Respuesta `200 OK`:

```json
{
  "message": "Proceso cancelado correctamente."
}
```

Error `400 Bad Request` si el proceso ya está en un estado final (`COMPLETED`, `CANCELLED`, `EXPIRED`):

```json
{
  "message": "El proceso ya está en un estado final y no puede cancelarse."
}
```

### 7.6 Configurar recordatorios automáticos

```http
PUT {API_BASE}/api/SignatureProcess/{id}/reminder-settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "enabled": true,
  "intervalDays": 3,
  "reminderMessage": "Recuerda firmar el contrato antes del viernes."
}
```

Respuesta `200 OK`:

```json
{
  "enabled": true,
  "intervalDays": 3,
  "reminderMessage": "Recuerda firmar el contrato antes del viernes.",
  "lastReminderAt": null,
  "nextReminderAt": "2026-05-09T14:30:00Z"
}
```

---

## 8. Referencia de campos

### 8.1 Body de creación de proceso

`Req.`: **sí** = obligatorio · **no** = opcional · **cond.** = obligatorio según otros campos.

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `processName` | string | sí | Nombre del proceso. Es el asunto del email de invitación y lo ve el firmante en el portal. |
| `processDescription` | string | no | Descripción opcional. |
| `signatureMethod` | enum | sí | `CLICK`: aceptación con clic (recomendado para integraciones). `ADVANCED`: firma digital criptográfica con certificado. `HANDWRITTEN`: firma en una posición específica del PDF (usa `fieldPlacements`). Para trazo manuscrito en canvas usar `isHandWritten: true`. |
| `authenticationMethodCode` | enum | no | Verificación de identidad antes de firmar. `OTP_EMAIL` (default), `OTP_SMS`, `OTP_WHATSAPP`. SMS y WhatsApp requieren `phoneIndicative` + `phoneNumber` en el firmante. |
| `isSequential` | boolean | no | `true`: los firmantes reciben la invitación en orden de `signingOrder` (el siguiente solo cuando el anterior firmó). `false`: todos a la vez. Default: `false`. |
| `deadlineDays` | number | no | Días de plazo para completar el proceso; al vencer pasa a `EXPIRED`. Default: 7. Mínimo 1, máximo 365. |
| `isSendByEmail` | boolean | no | `true`: pasa a `IN_PROGRESS` y envía invitaciones por email al crear. `false`: queda en `DRAFT` (enviar con `POST /{id}/send`). Default: `false`. |
| `isSendByWhatsApp` | boolean | no | Enviar invitaciones por WhatsApp al crear. Default: `false`. |
| `isSendBySms` | boolean | no | Enviar invitaciones por SMS al crear. Requiere `phoneIndicative` + `phoneNumber` en cada firmante. Default: `false`. |
| `messageEmail` | string | no | Mensaje personalizado para los firmantes en el email y el portal. |
| `externalReference` | string | no | ID interno propio (p. ej. número de solicitud). Se devuelve en los webhooks y en las consultas. Máximo 255 caracteres. |
| `base64Document` | string | cond. | PDF en Base64. Requerido si no se usa `templateId` ni `documents`. Excluyente con `documents`. Tamaño típico: de 20 KB a pocos MB. |
| `documentFileName` | string | no | Nombre del archivo que ve el firmante (con `.pdf`) cuando se usa `base64Document`. Default: `"documento.pdf"`. |
| `documents` | array | cond. | Varios PDFs en un proceso; se fusionan en uno en el orden del arreglo. Cada elemento: `{ "fileName": string, "base64String": string }`. Excluyente con `base64Document`. Los `fieldPlacements` referencian páginas del PDF fusionado. |
| `templateId` | number | cond. | ID de plantilla. Requerido si no se envía `base64Document` ni `documents`. |
| `signers` | array | sí | Firmantes. Mínimo 1. Ver [8.2](#82-objeto-signer). |
| `fieldPlacements` | array | no | Posiciones de los campos de firma en el PDF. Ver [8.3](#83-objeto-fieldplacement). |
| `ccEmails` | array | no | Correos en copia que reciben la invitación. |
| `reminderEnabled` | boolean | no | Activa los recordatorios automáticos a firmantes pendientes. |
| `reminderIntervalDays` | number | no | Frecuencia en días de los recordatorios. Mínimo 1, máximo 30. Requiere `reminderEnabled: true`. |
| `callbackUrl` | string | no | URL del servidor propio que recibe un HTTP POST (webhook) en cada cambio de estado del proceso o de un firmante. |
| `callbackSecret` | string | no | Secreto HMAC-SHA256 para verificar el webhook. El hash llega en el header `X-Kiai-Signature: sha256=<hmac>`. Requiere `callbackUrl`. |
| `callbackHeaders` | string | no | JSON (como string) con headers adicionales que KIAI envía al `callbackUrl`. Ej: `{"Authorization":"Bearer token","X-App-Id":"mi-app"}`. Requiere `callbackUrl`. |
| `isHandWritten` | boolean | no | Firma manuscrita trazada en canvas. Ver [9](#9-firma-avanzada-y-campos-en-el-pdf). |
| `requiresPhotographicEvidence` | boolean | no | Exige evidencia fotográfica (selfie) del firmante. Ver [9](#9-firma-avanzada-y-campos-en-el-pdf). |

### 8.2 Objeto `signer`

Campos que aparecen en los ejemplos de la documentación:

| Campo | Tipo | Descripción |
|---|---|---|
| `firstName` | string | Nombres del firmante. |
| `lastName` | string | Apellidos del firmante. |
| `email` | string | Correo al que se envía la invitación. |
| `phoneIndicative` | string | Indicativo del país, p. ej. `"+57"`. Requerido con `OTP_SMS`, `OTP_WHATSAPP` o `isSendBySms`. |
| `phoneNumber` | string | Número de celular. Requerido en los mismos casos que `phoneIndicative`. |
| `identificationTypeCode` | string | Tipo de documento, p. ej. `"CC"`. |
| `identificationNumber` | string | Número de documento. |
| `signingOrder` | number | Orden de firma, empieza en 1. Solo tiene efecto con `isSequential: true`. |

> ⚠ **Por confirmar con KIAI:** cuáles campos del firmante son obligatorios y qué valores admite `identificationTypeCode`.

### 8.3 Objeto `fieldPlacement`

| Campo | Tipo | Descripción |
|---|---|---|
| `signerEmail` | string | Email del firmante al que pertenece el campo (debe existir en `signers`). |
| `fieldType` | string | Tipo de campo. Valores vistos: `"SIGNATURE"`, `"firma"`. |
| `label` | string | Etiqueta visible del campo. |
| `page` | number | Página del PDF (en procesos con `documents`, página del PDF fusionado). |
| `xPct` / `yPct` | number | Posición horizontal / vertical relativa a la página. |
| `widthPx` / `heightPx` | number | Tamaño del campo en píxeles. |

> ⚠ **Por confirmar con KIAI:** `xPct`/`yPct` aparecen como porcentaje (`12.5`, `78.3`) en un ejemplo y como fracción (`0.55`, `0.80`) en otro; y `fieldType` como `"SIGNATURE"` y como `"firma"`.

---

## 9. Firma avanzada y campos en el PDF

Combinación completa: certificado digital + trazo manuscrito + selfie.

```json
{
  "signatureMethod": "ADVANCED",
  "isHandWritten": true,
  "requiresPhotographicEvidence": true,
  "fieldPlacements": [
    {
      "signerEmail": "firmante@empresa.co",
      "fieldType": "firma",
      "label": "Firma",
      "page": 1,
      "xPct": 0.55,
      "yPct": 0.80,
      "widthPx": 200,
      "heightPx": 80
    }
  ]
}
```

- `signatureMethod: "ADVANCED"`: firma criptográfica con certificado.
- `isHandWritten: true`: el firmante traza su firma en un canvas.
- `requiresPhotographicEvidence: true`: se exige una selfie como evidencia.

---

## 10. Convertir un PDF a Base64

**Node.js**

```js
const fs = require("fs");
const base64Document = fs.readFileSync("contrato.pdf").toString("base64");
```

**Python**

```python
import base64

with open("contrato.pdf", "rb") as f:
    base64Document = base64.b64encode(f.read()).decode("utf-8")
```

**Bash**

```bash
# Linux / Git Bash (una sola línea, sin saltos)
base64 -w0 contrato.pdf

# macOS
base64 -i contrato.pdf
```

**Windows (PowerShell)**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\contrato.pdf"))
```

---

## 11. Pendientes por confirmar con KIAI

| # | Tema | Detalle |
|---|---|---|
| 1 | URLs de producción | Solo se entregaron URLs demo (`usuarios-demo`, `firmas-demo`). Aparece `usuarios.kiai.co` en el token, sin confirmar si es producción; falta la URL de Firmas en producción. |
| 2 | Vigencia del token OAuth | La documentación indica 15 minutos y también 1 hora. |
| 3 | Estados del proceso | El ciclo de vida muestra `DRAFT → IN_PROGRESS → COMPLETED`, pero el filtro admite además `PENDING`, `DECLINED`, `EXPIRED`, `CANCELLED`. Falta el significado de `PENDING` y las transiciones a cada estado. |
| 4 | Paginación del listado | `by-company` acepta `page`/`pageSize` pero responde un arreglo sin total ni indicador de más páginas. |
| 5 | Posición de campos | `xPct`/`yPct` como porcentaje (`12.5`) o fracción (`0.55`). |
| 6 | `fieldType` | Valores válidos: `"SIGNATURE"` o `"firma"`. |
| 7 | Objeto `signer` | Campos obligatorios y valores válidos de `identificationTypeCode`. |
| 8 | Webhooks | Falta el formato del payload enviado al `callbackUrl`, la lista de eventos y la política de reintentos. |
| 9 | Endpoints sin ejemplo | `by-uuid`, `reminders/send`, `document`, `document/original`, `document/signed`, `audit-trail-pdf`: faltan ejemplos de respuesta. |
| 10 | Plantillas | Cómo se crean y consultan las plantillas (`templateId`). |
| 11 | Errores | Formato general de errores y códigos HTTP posibles, además del `400` al cancelar. |
