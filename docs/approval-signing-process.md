# Modelo de Procesos — Aprobación y Firmado de Crédito Comfaca

> Documento funcional que describe los procesos de negocio y técnicos desde que una solicitud es recibida por el equipo de validación hasta que el documento queda firmado digitalmente.
> Cubre: revisión por el asesor, gestión de firmantes, gestión de anexos (pagarés/cartas), envío a KIAI, polling de estado, notificaciones al solicitante y cancelación de procesos.
> Fuentes: `server/api/admin/solicitudes/[id]/*`, `server/api/admin/firmas/*`, `server/api/public/firma/[token]`, `server/api/validacion/codigo-firma.post.ts`, `server/services/admin/proceso-firmado-adm.service.ts`, `server/services/firma/kiai-firmado.mapper.ts`, `server/services/admin/firmar-anexos.service.ts`, `server/nohup/*`, `app/pages/admin/firmas/*`.

---

## Tabla de contenidos

1. [Visión general del proceso](#1-visión-general-del-proceso)
2. [Actores y prerrequisitos](#2-actores-y-prerrequisitos)
3. [Mapa de estados en esta fase](#3-mapa-de-estados-en-esta-fase)
4. [Subproceso A: Recepción y validación por el asesor](#4-subproceso-a-recepción-y-validación-por-el-asesor)
5. [Subproceso B: Gestión de firmantes](#5-subproceso-b-gestión-de-firmantes)
6. [Subproceso C: Carga de anexos (pagarés, cartas, oficios)](#6-subproceso-c-carga-de-anexos-pagarés-cartas-oficios)
7. [Subproceso D: Aprobación / Rechazo / Desestimación](#7-subproceso-d-aprobación--rechazo--desestimación)
8. [Subproceso E: Inicio del proceso de firma KIAI](#8-subproceso-e-inicio-del-proceso-de-firma-kiai)
9. [Subproceso F: Firma digital por el firmante (link público)](#9-subproceso-f-firma-digital-por-el-firmante-link-público)
10. [Subproceso G: Sincronización periódica con KIAI (worker nohup)](#10-subproceso-g-sincronización-periódica-con-kiai-worker-nohup)
11. [Subproceso H: Cancelación o descarte del proceso](#11-subproceso-h-cancelación-o-descarte-del-proceso)
12. [Diagrama BPMN del flujo completo](#12-diagrama-bpmn-del-flujo-completo)
13. [Notificaciones al solicitante](#13-notificaciones-al-solicitante)
14. [Reglas de negocio y validaciones](#14-reglas-de-negocio-y-validaciones)
15. [Tabla resumen de endpoints](#15-tabla-resumen-de-endpoints)
16. [Manejo de errores y casos extremos](#16-manejo-de-errores-y-casos-extremos)

---

## 1. Visión general del proceso

Una vez la solicitud es radicada por el solicitante (estado `ENVIADO_VALIDACION`, ver [`docs/process-model.md`](./process-model.md)), entra en una fase de **validación interna + firma digital externa**.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   ENVIADO_VALIDACION ──► APROBADA ──► PENDIENTE_FIRMADO ──► FIRMADO   │
│         │                  │              │                  │       │
│         ▼                  ▼              ▼                  ▼       │
│   Asesor revisa     Asesor confirma  KIAI polling     Solicitud     │
│   en admin          o rechaza       cada 5 min       lista para    │
│                                                   originación      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Tres roles clave:**

1. **Asesor / Administrador** — revisa, gestiona firmantes y anexos, inicia/cancela firma, aprobar/rechazar.
2. **Firmante (titular o codeudor)** — recibe invitación por correo, firma vía OTP en KIAI.
3. **Worker KIAI (nohup)** — polling de 5 minutos que sincroniza el estado externo.

---

## 2. Actores y prerrequisitos

### Actores

| Actor | Tipo | Capacidades |
|---|---|---|
| **Asesor / Administrador** | Usuario interno | Ver solicitud, gestionar firmantes, subir anexos, iniciar/cancelar firma, aprobar/rechazar |
| **Firmante (titular)** | Usuario natural vinculado a la solicitud | Recibir email con link de KIAI, autenticarse por OTP, firmar |
| **Firmante (codeudor)** | Usuario natural vinculado al titular | Igual que el titular pero entra después en la cadena secuencial |
| **KIAI** | Proveedor externo | Hospeda el documento, orquesta la firma, notifica eventos |
| **Worker nohup** | Proceso Node.js local | Polling cada 5 minutos, sincroniza estados y transiciones |

### Prerrequisitos para iniciar firma

Antes de `POST /api/admin/solicitudes/{id}/iniciar-firmado`, la solicitud debe cumplir:

1. **Estado:** `APROBADA` (transición documentada en [`docs/process-model.md`](./process-model.md)).
2. **PDF generado:** existe registro en `pdfs_generados` con archivo físico en storage.
3. **Firmantes:** al menos uno con email válido (KIAI requiere email para invitación).
4. **Sin proceso KIAI activo:** ningún `procesos_firma` previo con estado `DRAFT`, `PENDING`, `IN_PROGRESS` o `COMPLETED` (ver `procesoQueBloqueaEnvio`).

---

## 3. Mapa de estados en esta fase

| Estado | Orden | Descripción | Entrada / Salida |
|---|---|---|---|
| `ENVIADO_VALIDACION` | 6 | Asesor debe revisar | Entrada desde el flujo del solicitante |
| `APROBADA` | 7 | Asesor aprobó, lista para firmar | Salida desde `estado.put` con notificación |
| `RECHAZADA` | 8 | Asesor rechazó el crédito | Salida terminal |
| `DESESTIMADA` | 9 | Faltan requisitos | Salida terminal |
| `PENDIENTE_FIRMADO` | 4 | Proceso KIAI activo, firmando | Salida desde `iniciar-firmado.post.ts` |
| `FIRMADO` | 5 | KIAI notificó firma completada | Salida desde el worker nohup o `consultarEstado` |
| `APROBADA` (post-cancel) | 7 | KIAI cancelado, se puede reenviar | Salida desde `cancelar-firmado.post.ts` |

### Mapeo KIAI → estado de solicitud

Definido en `kiai-firmado.mapper.ts:141`:

| KIAI status | Estado solicitud destino | Detalle |
|---|---|---|
| `DRAFT` | (sigue en `PENDIENTE_FIRMADO`) | Proceso creado pero no enviado |
| `PENDING` | (sigue en `PENDIENTE_FIRMADO`) | Esperando que firmantes actúen |
| `IN_PROGRESS` | (sigue en `PENDIENTE_FIRMADO`) | Algún firmante ha firmado |
| `COMPLETED` | `FIRMADO` | "Todos los firmantes firmaron el documento en KIAI." |
| `DECLINED` | `RECHAZADA` | "Un firmante rechazó la firma del documento en KIAI." |
| `CANCELLED` | `APROBADA` | "El proceso de firma fue cancelado en KIAI; puede reenviarse a firma." |
| `EXPIRED` | `APROBADA` | "El proceso de firma venció en KIAI sin completarse; puede reenviarse a firma." |

---

## 4. Subproceso A: Recepción y validación por el asesor

### Flujo

```
1. Asesor abre /admin/solicitudes
   └─ GET /api/admin/solicitudes (lista solicitudes ENVIADO_VALIDACION, APROBADA, etc.)
        │
        ▼
2. Asesor selecciona una solicitud
   └─ GET /api/admin/solicitudes/{id} (detalle completo)
        │
        ▼
3. Asesor revisa:
   - Datos del solicitante (solicitud_solicitante)
   - Payload del formulario (solicitud_payload)
   - Documentos cargados (solicitud_documentos)
   - Timeline de eventos (solicitud_timeline)
   - PDF generado (pdfs_generados)
        │
        ▼
4. Asesor toma decisión:
   ├─ APROBADA  → continúa en §7 (gestión de firmantes)
   ├─ RECHAZADA → §7 (terminal)
   ├─ DESESTIMADA → §7 (terminal)
   └─ CANCELADA / DESISTE → §7 (terminal)
```

### Endpoints consultados

- `GET /api/admin/solicitudes` — listado paginado.
- `GET /api/admin/solicitudes/{id}` — detalle con relaciones eager-loaded.

> Ver archivos: `server/api/admin/solicitudes/index.get.ts`, `[id].get.ts`.

---

## 5. Subproceso B: Gestión de firmantes

Los firmantes se almacenan en `firmantes_solicitud` con orden explícito (`UNIQUE(solicitud_id, orden)`). KIAI firma en orden secuencial (`isSequential: true`).

### 5.1 Listado de firmantes

**Endpoint:** `GET /api/admin/solicitudes/{id}/firmantes`

Retorna todos los firmantes asociados a la solicitud, ordenados por `orden` ascendente.

### 5.2 Creación / reemplazo masivo

**Endpoint:** `PUT /api/admin/solicitudes/{id}/firmantes`

Body (Zod validado):
```ts
{
  firmantes: Array<{
    id?: string;             // opcional (presente si actualiza)
    orden: number;
    tipo: string;            // "1"=CC, "3"=NIT, etc.
    nombre_completo: string;
    numero_documento: string;
    email: string;           // REQUERIDO para KIAI
    rol: string;             // "Trabajador" | "Codeudor" | "Representante legal"
    telefono?: string;
    codigo_pais?: string;    // default "57" (Colombia)
  }>
}
```

**Validaciones del servicio:**

- Todos los firmantes deben tener email (KIAI no soporta sin email).
- Email se trimea y se valida formato.
- Teléfono se normaliza: si empieza con `codigo_pais`, se quita el prefijo.

### 5.3 Eliminación

**Endpoint:** `DELETE /api/admin/solicitudes/{id}/firmantes`

Elimina TODOS los firmantes de la solicitud. Antes verifica que no haya proceso KIAI bloqueante (`procesoQueBloqueaFirmantes`).

### 5.4 Bloqueos

```
procesos_firma en estado DRAFT, PENDING, IN_PROGRESS, COMPLETED
       │
       ▼
impiden:
   - DELETE /firmantes
   - POST /iniciar-firmado (ya iniciado)
   - POST /anexos
```

> Ver `proceso-firmado-adm.service.ts:38-50`.

---

## 6. Subproceso C: Carga de anexos (pagarés, cartas, oficios)

Los anexos son **documentos adicionales que el asesor envía a firmar**, además del PDF principal de la solicitud. Almacenados en `firmar_anexos` (renombrado desde `documentos_postulantes` en commit `5ff2be6`).

### 6.1 Endpoint

**`POST /api/admin/solicitudes/{id}/anexos`** (multipart/form-data)

```
multipart/form-data:
  archivo: <binary PDF>
  tipo_anexo: "pagare" | "carta_instrucciones" | "oficio" | ...
```

### 6.2 Flujo

```
1. Validar sesión y rol de admin
2. Verificar procesoKIAI no bloqueante (409 si activo)
3. Leer multipart:
   - archivo (binary)
   - tipo_anexo (form field)
4. Validar anexo (validator):
   - tipo_anexo en whitelist
   - archivo presente, MIME = application/pdf
5. Generar savedFilename = crypto.randomUUID() + ".pdf"
6. mkdir -p storage/anexos/{numero_solicitud}/
7. writeFile en disco
8. Calcular orden = (max(orden) WHERE activo) + 1
9. INSERT firmar_anexos
10. Retornar anexo creado
```

### 6.3 Whitelist de tipos

`validarAnexo()` valida contra un conjunto cerrado de tipos definidos en `server/services/firma/firmar-anexos.validator.ts`. Si el tipo no está permitido, retorna HTTP 400.

### 6.4 Listado y descarga

- `GET /api/admin/solicitudes/{id}/anexos` — lista los anexos activos.
- `GET /api/admin/solicitudes/{id}/anexos/{anexoId}/descargar` — descarga binaria.
- `DELETE /api/admin/solicitudes/{id}/anexos/{anexoId}` — soft-delete (`activo=false`).

> **Nota:** los anexos se almacenan como PDFs en disco y como metadatos en `firmar_anexos`. **No se incluyen automáticamente en el proceso KIAI**: el PDF principal (`pdfs_generados`) es el único documento que KIAI firma. Los anexos son solo referencia para el asesor y el firmante.

---

## 7. Subproceso D: Aprobación / Rechazo / Desestimación

### 7.1 Endpoint

**`PUT /api/admin/solicitudes/{id}/estado`**

Body (Zod):
```ts
{
  estado: string;             // requerido, sin whitelist (validación manual)
  descripcion?: string;       // nota libre del asesor
}
```

### 7.2 Lógica

```
1. Buscar solicitud por numero_solicitud
2. UPDATE solicitudes_credito SET estado = ?
3. INSERT solicitud_timeline:
   - estado: nuevo estado
   - detalle: MENSAJE_POR_ESTADO[estado] (+ descripcion si aplica)
   - usuario_username: asesor logueado
   - automatico: false
4. CREATE notification:
   - owner_username: solicitud.owner_username (solicitante)
   - type: "solicitud.estado.actualizado"
   - data: { titulo, solicitud_id, estado_anterior, estado_nuevo, mensaje, descripcion_admin, actualizado_por }
```

### 7.3 Mensajes predefinidos por estado

| Estado | Título notificación | Mensaje |
|---|---|---|
| `APROBADA` | "Solicitud aprobada" | "Tu solicitud de crédito ha sido aprobada." |
| `DESESTIMADA` | "Solicitud desestimada" | "Tu solicitud de crédito ha sido desestimada por falta de requisitos." |
| `RECHAZADA` | "Solicitud rechazada" | "Tu solicitud de crédito ha sido rechazada." |
| `CANCELADA` | "Solicitud cancelada" | "Tu solicitud de crédito ha sido cancelada." |
| `DESISTE` | "Has desistido de la solicitud" | "Has desistido de continuar con tu solicitud de crédito." |

### 7.4 Transiciones válidas

El endpoint `estado.put` **no valida transiciones** (no enforce de máquina de estados). Cualquier estado puede ir a cualquier otro. Esto es **una brecha de diseño** — ver §16.

### 7.5 Path a PENDIENTE_FIRMADO

Para que la solicitud pase a `PENDIENTE_FIRMADO`, el flujo correcto es:

```
APROBADA ──► (asesor ajusta firmantes) ──► (asesor sube anexos) ──► PENDIENTE_FIRMADO
                                  ▲                                       │
                                  │                                       ▼
                            DELETE/PUT firmantes                POST /iniciar-firmado
```

La transición a `PENDIENTE_FIRMADO` ocurre **explícitamente** en `iniciar-firmado.post.ts:135` (UPDATE del estado), no en `estado.put`.

---

## 8. Subproceso E: Inicio del proceso de firma KIAI

### 8.1 Endpoint

**`POST /api/admin/solicitudes/{id}/iniciar-firmado`**

Body:
```ts
{
  firmantes: FirmanteInput[]  // se reescriben TODOS los firmantes antes de iniciar
}
```

### 8.2 Flujo completo

```
1. Validar sesión
2. Validar que NO haya proceso KIAI bloqueante (procesoQueBloqueaEnvio)
   - 409 si existe proceso DRAFT/PENDING/IN_PROGRESS/COMPLETED
3. Leer firmantes del body
4. Validar que haya al menos 1 firmante
5. Reemplazar firmantes:
   - DELETE firmantes_solicitud WHERE solicitud_id = id
   - INSERT firmantes_solicitud (createMany con orden recalculado)
6. Llamar procesoFirmadoAdm.iniciarFirmado({ solicitudId })
   ↓ (ver §8.3)
7. UPDATE solicitudes_credito SET estado = "PENDIENTE_FIRMADO"
8. INSERT solicitud_timeline:
   - estado: PENDIENTE_FIRMADO
   - detalle: "Solicitud enviada para firma digital en {proveedor}. Proceso: {transaccion_id}"
   - usuario_username: asesor logueado
   - automatico: false (implícito)
9. Retornar { transaccion_id, estado, proveedor, expira_en }
```

### 8.3 Servicio `procesoFirmadoAdm.iniciarFirmado`

```
1. SELECT solicitud WHERE numero_solicitud = id
   INCLUDE firmantes_solicitud (orderBy: orden ASC)
   INCLUDE pdfs_generados
2. Validaciones:
   - Solicitud existe
   - firmantes_solicitud.length > 0
   - Todos los firmantes tienen email
   - pdfs_generados existe
3. documentoStorage.obtenerContenidoDesdePdfGenerado() → base64
   (lee el PDF del storage usando la ruta en pdfs_generados.path)
4. construirProcesoKiai() → payload KIAI
   ↓ (ver §8.4)
5. apiKiai.crearProceso(payload) → proceso KIAI con ID + status
6. INSERT procesos_firma:
   - solicitud_id
   - proveedor: "KIAI"
   - proceso_id: id devuelto por KIAI
   - estado: status de KIAI
   - simulado: flag (true si KIAI está en modo simulation)
   - expira_en: proceso.expiresAt
   - respuesta: snapshot completo
   - created_at, updated_at
7. Retornar { success, message, data: { transaccion_id, estado, proveedor, expira_en } }
```

### 8.4 Payload KIAI (`kiai-firmado.mapper.ts:72`)

```ts
{
  processName: "Solicitud de crédito {numero_solicitud}",
  processDescription: "Firma de la solicitud de crédito {numero_solicitud} - Comfaca",
  signatureMethod: "CLICK",
  authenticationMethodCode: "OTP_EMAIL",
  isSequential: true,                 // firma en orden
  deadlineDays: 7,                     // 7 días para completar
  isSendByEmail: true,               // KIAI envía invitación por email
  externalReference: numero_solicitud,
  base64Document: <PDF en base64>,
  documentFileName: <nombre>.pdf,
  signers: [
    {
      firstName, lastName: derivados de nombre_completo (4+ palabras → 2 nombres)
      email: trim(),
      signingOrder: orden (1-based después de sort por orden)
      identificationNumber: numero_documento
      identificationTypeCode: CC|NIT|CE|PA|PEP|PPT (mapeo desde tipo)
      phoneIndicative, phoneNumber: normalizado
    },
    ...
  ]
}
```

### 8.5 Reglas del mapper

| Campo | Regla |
|---|---|
| `firstName` / `lastName` | Si el nombre tiene 4+ palabras, las 2 primeras son firstName; las restantes lastName. Si 1 palabra, ambos son la misma. |
| `email` | `trim()` aplicado. |
| `signingOrder` | `index + 1` después de ordenar por `orden` ASC. |
| `phoneIndicative` | `+${codigo_pais || "57"}`. |
| `phoneNumber` | Si empieza con codigo_pais, se quita el prefijo. Si longitud < 7, se omite. |
| `identificationTypeCode` | Solo se envía si `tipo` está en el mapa SISU→KIAI (`1=CC, 3=NIT, 4=CE, 6=PA, 8=PEP, 14=PPT`). |

---

## 9. Subproceso F: Firma digital por el firmante (link público)

KIAI gestiona el flujo de firma end-to-end. Comfaca expone un endpoint público que valida un **token encriptado** para previsualizar la solicitud antes de firmar.

### 9.1 Endpoint público

**`GET /api/public/firma/{token}`** (sin auth requerida)

```
1. Leer token del path
2. Decodificar con API_FIRMA_KEY (AES via crypto.service):
   - decryptPayload(token, key) → { numero_solicitud, identificacion, exp }
3. Validar expiración:
   - isTokenExpired(payload) → 410 Gone si expirado
4. SELECT solicitud + solicitud_solicitante + firmantes_solicitud
5. Verificar coincidencia:
   - payload.identificacion === solicitud.solicitante.numero_documento
   - Si no coincide → 403 Forbidden
6. Retornar datos de la solicitud (sin datos sensibles):
   - numero_solicitud, valor, plazo, tasa, estado
   - solicitante (nombres, apellidos, tipo_doc, numero_doc)
   - firmantes (id, nombre, doc, email, tipo, orden, rol)
   - url_firma: null (se llena en frontend desde KIAI)
```

### 9.2 Flujo del firmante

```
1. KIAI envía email al firmante (gestionado por KIAI, fuera de Comfaca)
2. Firmante hace clic en el link de KIAI
3. KIAI autentica al firmante vía OTP (enviado al email)
4. Firmante revisa el PDF y firma (signatureMethod: CLICK)
5. Si quedan más firmantes en orden secuencial, KIAI notifica al siguiente
6. Al completar todos, KIAI marca el proceso como COMPLETED
7. KIAI envía webhook o el worker nohup lo detecta (ver §10)
```

> **Nota:** Comfaca no recibe webhook de KIAI explícitamente. La sincronización depende del worker nohup.

---

## 10. Subproceso G: Sincronización periódica con KIAI (worker nohup)

### 10.1 Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Proceso nohup (TSX, separado de Nitro)            │
│                                                                     │
│   while (!shuttingDown):                                            │
│     ↓                                                               │
│   ┌────────────────────────────────────────────────────────┐        │
│   │  Cada 5 minutos (INTERVAL_MS = 5*60*1000):             │        │
│   │                                                         │        │
│   │  1. Solicitudes PENDIENTE_FIRMADO con proceso KIAI:     │        │
│   │     - Si proceso.simulado → omitir                     │        │
│   │     - Si no hay proceso → warn (estado inconsistente)  │        │
│   │  2. getToken() de KIAI (OAuth2 client_credentials)     │        │
│   │  3. Por cada solicitud:                                 │        │
│   │     - Worker thread: apiKiai.consultarProceso(id)       │        │
│   │     - sincronizarProceso() → ver §10.2                  │        │
│   └────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Función `sincronizarProceso` (transaccional)

```
prisma.$transaction(async tx => {
  1. UPDATE procesos_firma:
     - estado = detalle.status
     - completado_en = detalle.completedAt
     - ultima_consulta = now
     - respuesta = snapshot completo

  2. Si mapEstadoSolicitud(detalle.status) retorna estado final:
     - UPDATE solicitudes_credito WHERE numero_solicitud = X AND estado = "PENDIENTE_FIRMADO"
       SET estado = estado_final, updated_at = now
     - Si la solicitud ya cambió de estado (count = 0) → no hace timeline (evita duplicados)
     - INSERT solicitud_timeline:
       - estado: estado_final
       - detalle: "{detalle}. Proceso: {detalle.id}"
       - automatico: true

  3. Si el estado no es final (PENDING, IN_PROGRESS) → solo actualiza el proceso, no la solicitud
})
```

### 10.3 Mapeo KIAI → solicitud (worker)

Aplicado por `mapEstadoSolicitud()` (idéntico al de la sección §3):

| KIAI status | Solicitud pasa a | Bitácora |
|---|---|---|
| `COMPLETED` | `FIRMADO` | "Todos los firmantes firmaron el documento en KIAI." |
| `DECLINED` | `RECHAZADA` | "Un firmante rechazó la firma del documento en KIAI." |
| `CANCELLED` | `APROBADA` | "El proceso de firma fue cancelado en KIAI; puede reenviarse a firma." |
| `EXPIRED` | `APROBADA` | "El proceso de firma venció en KIAI sin completarse; puede reenviarse a firma." |
| `DRAFT` / `PENDING` / `IN_PROGRESS` | (sigue en `PENDIENTE_FIRMADO`) | (no genera timeline) |

### 10.4 Manejo de simulaciones

Las solicitudes con `procesos_firma.simulado = true` se omiten en el polling (el KIAI no las tiene realmente). Si se quieren descartar, se usa `descartarSimulacion`.

### 10.5 Lifecycle del worker

- **Inicio:** `pnpm nohup:firmas` o `pnpm nohup:firmas:daemon` (este último con nohup + log a archivo).
- **Logs:** `storage/logs/nohup-firmas.log`.
- **Señales:** SIGINT y SIGTERM cierran limpiamente (`shutdown()`).
- **Concurrencia:** 1 worker thread por consulta (no simultáneo, secuencial).
- **Manejo de error:** si `getToken()` falla, se omite el ciclo completo y se reintenta en 5 min.

---

## 11. Subproceso H: Cancelación o descarte del proceso

### 11.1 Cancelar proceso KIAI real

**`POST /api/admin/solicitudes/{id}/cancelar-firmado`**

```
1. Validar body: { motivo?: string (max 500 chars) }
2. procesoFirmadoAdm.cancelarFirmado(id):
   - Si no hay proceso KIAI → 400
   - Si el proceso ya está en estado terminal (COMPLETED, DECLINED, EXPIRED, CANCELLED) → 400
   - Si !simulado → apiKiai.cancelarProceso(proceso_id) (DELETE en KIAI)
   - UPDATE procesos_firma SET estado = "CANCELLED"
3. prisma.$transaction:
   - UPDATE solicitudes_credito SET estado = "APROBADA"
     (la solicitud VUELVE a APROBADA — no se cancela el crédito)
   - INSERT solicitud_timeline:
     - estado: APROBADA
     - detalle: "Proceso de firma KIAI cancelado por el administrador.
                  Proceso: {id}. La solicitud puede reenviarse a firma. [Motivo: ...]"
     - usuario_username: asesor
4. Retornar { solicitud_id, estado_solicitud: APROBADA, transaccion_id }
```

### 11.2 Descartar simulación local

**`POST /api/admin/solicitudes/{id}/descartar-simulacion`**

Similar al anterior pero solo aplica a procesos con `simulado=true`. No llama a KIAI (el proceso no existe allí). Marca el proceso local como `CANCELLED`.

### 11.3 Diferencia semántica

| Acción | Proceso simulado | Proceso real (KIAI) |
|---|---|---|
| **Cancelar** (`cancelar-firmado`) | Aplica (cancela local) | Aplica (llama DELETE a KIAI) |
| **Descartar simulación** (`descartar-simulacion`) | Aplica solo a simulados | **Rechazado** (debe cancelarse, no descartarse) |

---

## 12. Diagrama BPMN del flujo completo

```
                ┌──────────────────────────┐
                │ Inicio: solicitud en     │
                │ ENVIADO_VALIDACION       │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Asesor revisa solicitud  │
                │ en /admin/solicitudes    │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ ¿Asesor aprueba?         │
                └────────────┬─────────────┘
        ┌────────────┬───────┴──────┬────────────┐
        │ sí         │ no           │ faltan reqs│
        ▼            ▼              ▼            ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐   ┌──────────┐
   │ APROBADA│  │RECHAZADA│   │DESESTIMADA│  │CANCELADA │
   └────┬────┘  └─────────┘   └──────────┘   └──────────┘
        │
        ▼
   ┌──────────────────────────────────────────────────┐
   │ Asesor configura firmantes                       │
   │ (PUT /firmantes)                                 │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │ Asesor sube anexos (opcional)                    │
   │ (POST /anexos)                                   │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │ Asesor inicia proceso KIAI                       │
   │ POST /iniciar-firmado                            │
   │   ├─ Validar no bloqueo (procesos_firma)         │
   │   ├─ Reemplazar firmantes                        │
   │   ├─ Construir payload KIAI                      │
   │   ├─ apiKiai.crearProceso()                      │
   │   └─ INSERT procesos_firma + UPDATE estado      │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │ Estado: PENDIENTE_FIRMADO                        │
   │ Notificación enviada al solicitante              │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │ KIAI envía emails a firmantes (secuencial)       │
   │ (gestionado por KIAI, fuera de Comfaca)          │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │ Cada firmante:                                   │
   │   1. Recibe email con link                       │
   │   2. GET /api/public/firma/{token} (preview)     │
   │   3. Autenticación OTP (gestionada por KIAI)      │
   │   4. Firma con CLICK                             │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │ Worker nohup (cada 5 min)                        │
   │   ├─ SELECT solicitudes PENDIENTE_FIRMADO        │
   │   ├─ Excluir simulados                           │
   │   ├─ apiKiai.consultarProceso() por cada una     │
   │   └─ sincronizarProceso()                        │
   │       ├─ UPDATE procesos_firma                   │
   │       └─ Si estado final:                        │
   │           ├─ UPDATE solicitudes_credito          │
   │           └─ INSERT solicitud_timeline           │
   └────────┬─────────────────────────────────────────┘
            │
   ┌────────┼────────────┬────────────────┐
   ▼        ▼            ▼                ▼
┌───────┐ ┌───────┐ ┌─────────┐    ┌─────────────┐
│FIRMADO│ │RECHAZ.│ │APROBADA │    │APROBADA     │
│       │ │       │ │(CANCEL.)│    │(EXPIRED)    │
└───┬───┘ └───┬───┘ └────┬────┘    └──────┬──────┘
    │         │          │                │
    ▼         ▼          ▼                ▼
┌──────────────────────────────────────────────────┐
│ Notificación final al solicitante:                │
│   - FIRMADO → "Documentos firmados"               │
│   - RECHAZADA → "Un firmante rechazó"             │
│   - APROBADA → "Proceso cancelado, puede reenviar"│
└──────────────────────────────────────────────────┘
```

---

## 13. Notificaciones al solicitante

### 13.1 Mecanismo

El sistema crea notificaciones en la tabla `notifications` con la siguiente estructura:

```ts
{
  id: uuid,
  type: "solicitud.estado.actualizado",
  notifiable_type: "App\\Models\\User",  // polimórfica
  notifiable_id: user.id,
  owner_username: solicitud.owner_username,
  data: {
    titulo: string,
    solicitud_id: string,
    estado_anterior: string,
    estado_nuevo: string,
    estado_nuevo_nombre: string,
    mensaje: string,
    descripcion_admin: string | null,
    actualizado_por: string
  },
  read_at: Date | null,
  created_at, updated_at
}
```

### 13.2 Eventos que disparan notificación

| Evento | Endpoint | Notificación |
|---|---|---|
| Aprobación | `PUT /api/admin/solicitudes/{id}/estado` con `APROBADA` | "Tu solicitud de crédito ha sido aprobada." |
| Rechazo | `PUT /api/admin/solicitudes/{id}/estado` con `RECHAZADA` | "Tu solicitud de crédito ha sido rechazada." |
| Desestimación | `PUT .../estado` con `DESESTIMADA` | "Tu solicitud de crédito ha sido desestimada por falta de requisitos." |
| Cancelación | `PUT .../estado` con `CANCELADA` | "Tu solicitud de crédito ha sido cancelada." |
| Desiste | `PUT .../estado` con `DESISTE` | "Has desistido de continuar con tu solicitud de crédito." |
| Inicio de firma | (implícito, no se crea notificación aquí — la solicitud pasa a `PENDIENTE_FIRMADO` sin `notifications` entry) | — |
| Firma completada | (worker nohup vía `sincronizarProceso`) | (no se crea — solo timeline) |
| Cancelación KIAI | `POST /api/admin/solicitudes/{id}/cancelar-firmado` | (no se crea — solo timeline + vuelve a APROBADA) |

> **Brecha detectada:** el inicio y finalización del proceso de firma **no notifican al solicitante**. Solo se actualiza el timeline. Ver §16.

### 13.3 Auto-procesamiento

El frontend hace polling (no se documenta aquí el intervalo exacto) del endpoint de notificaciones y muestra toasts en la UI.

---

## 14. Reglas de negocio y validaciones

1. **Estados terminales de KIAI que permiten reenvío:** `CANCELLED`, `EXPIRED`. Tras cualquiera, la solicitud vuelve a `APROBADA`.
2. **Firmantes requieren email:** KIAI no soporta firmantes sin email. Validado en `iniciarFirmado`.
3. **Firma secuencial:** `isSequential: true` en KIAI. El firmante de orden N solo recibe invitación tras firmar el de orden N-1.
4. **Deadline de 7 días:** KIAI notifica `EXPIRED` si no se completa en ese período. Configurable en `KIAI_DEADLINE_DAYS`.
5. **Bloqueo de modificación:** procesos en `DRAFT/PENDING/IN_PROGRESS/COMPLETED` bloquean: DELETE firmantes, POST iniciar-firmado, POST anexos.
6. **Reemplazo total de firmantes:** `PUT /firmantes` reemplaza TODOS los firmantes. No hay endpoint de creación/eliminación individual.
7. **PDF obligatorio para iniciar firma:** validado en `iniciarFirmado`.
8. **Token público con expiración:** el endpoint `GET /api/public/firma/{token}` valida expiración y coincidencia de identificación.
9. **Validación de documento de identificación:** token cifrado debe contener el `numero_documento` del solicitante; si no coincide → 403.
10. **Tipos de identificación KIAI:** solo 6 tipos mapeados (`1=CC, 3=NIT, 4=CE, 6=PA, 8=PEP, 14=PPT`). Los demás tipos no envían `identificationTypeCode`.
11. **Teléfono internacional:** se normaliza con código de país (default Colombia `57`); si longitud < 7 dígitos, se omite.
12. **Renombre de firmantes:** el nombre completo se divide en firstName/lastName según la regla 4+ palabras.

---

## 15. Tabla resumen de endpoints

| Método | Endpoint | Servicio | Auth | Rol requerido |
|---|---|---|---|---|
| `GET` | `/api/admin/solicitudes` | `solicitud.service` | sí | admin |
| `GET` | `/api/admin/solicitudes/{id}` | `solicitud.service` | sí | admin |
| `PUT` | `/api/admin/solicitudes/{id}` | inline | sí | admin |
| `PUT` | `/api/admin/solicitudes/{id}/estado` | inline + `notification.service` | sí | admin |
| `GET` | `/api/admin/solicitudes/{id}/firmantes` | inline | sí | admin |
| `PUT` | `/api/admin/solicitudes/{id}/firmantes` | inline | sí | admin |
| `DELETE` | `/api/admin/solicitudes/{id}/firmantes` | inline + `procesoFirmadoAdm` | sí | admin |
| `POST` | `/api/admin/solicitudes/{id}/iniciar-firmado` | `procesoFirmadoAdm` | sí | admin |
| `POST` | `/api/admin/solicitudes/{id}/cancelar-firmado` | `procesoFirmadoAdm` | sí | admin |
| `POST` | `/api/admin/solicitudes/{id}/descartar-simulacion` | `procesoFirmadoAdm` | sí | admin |
| `GET` | `/api/admin/solicitudes/{id}/procesos-firma` | inline | sí | admin |
| `GET` | `/api/admin/solicitudes/{id}/estado-firmado` | `procesoFirmadoAdm.consultarEstado` | sí | admin |
| `GET` | `/api/admin/solicitudes/{id}/anexos` | `firmarAnexosService.listar` | sí | admin |
| `POST` | `/api/admin/solicitudes/{id}/anexos` | `firmarAnexosService.crear` | sí | admin |
| `GET` | `/api/admin/solicitudes/{id}/anexos/{anexoId}/descargar` | inline | sí | admin |
| `DELETE` | `/api/admin/solicitudes/{id}/anexos/{anexoId}` | inline | sí | admin |
| `GET` | `/api/admin/firmas` | inline | sí | admin |
| `GET` | `/api/public/firma/{token}` | inline (crypto.service) | **no** | público (con token) |

---

## 16. Manejo de errores y casos extremos

### 16.1 Errores comunes en `iniciar-firmado`

| Error | HTTP | Causa |
|---|---|---|
| Sin sesión | 401 | Token JWT inválido |
| ID no proporcionado | 400 | Path param faltante |
| Proceso KIAI activo | 409 | Ya hay proceso `DRAFT/PENDING/IN_PROGRESS/COMPLETED` |
| Sin firmantes | 400 | Body sin firmantes |
| Firmantes sin email | 400 | Algún firmante sin `email` |
| Solicitud sin PDF | 400 | No hay registro en `pdfs_generados` |
| PDF no encontrado en storage | 400 | Archivo físico borrado |
| Error KIAI | 502 | Falla de comunicación con KIAI |

### 16.2 Brechas de diseño detectadas

1. **`PUT /estado` sin whitelist:** cualquier estado puede transicionar a cualquier otro. **Recomendación:** añadir Zod enum con estados permitidos.
2. **Sin notificación al iniciar firma:** la transición a `PENDIENTE_FIRMADO` no notifica al solicitante (solo el timeline). **Recomendación:** crear `notification` con `type: "solicitud.firma.iniciada"`.
3. **Sin notificación al completar firma:** el worker nohup crea timeline pero no `notification`. **Recomendación:** tras `sincronizarProceso` con estado final, crear notification.
4. **Worker nohup secuencial:** si hay N=50 solicitudes PENDIENTE_FIRMADO, el ciclo completo puede tardar varios minutos (1 consulta KIAI por solicitud). **Recomendación:** paralelizar con límite de concurrencia.
5. **Anexos no se incluyen en KIAI:** el PDF principal es el único que KIAI firma. Los anexos son referencia pero no se anexan al proceso. **Recomendación:** añadir `anexos` al payload KIAI o concatenar PDFs.
6. **Token público tiene `url_firma: null`:** el endpoint `GET /api/public/firma/{token}` retorna la URL de firma como `null`. **Recomendación:** generar la URL del proceso KIAI al momento del firmado.
7. **Worker nohup sin leader election:** si se despliegan múltiples instancias, todas harían polling simultáneo. **Recomendación:** implementar lock distribuido o filtrar por hostname.
8. **Cancelación no distingue "expirado naturalmente":** un proceso `EXPIRED` se trata igual que `CANCELLED` (vuelve a APROBADA). **Recomendación:** diferenciar el flujo (EXPIRED podría requerir regenerar PDF).

### 16.3 Logs y observabilidad

- **Endpoint:** todos los endpoints admin loguean a `storage/logs/*.log` con `loggerService()`.
- **Worker nohup:** logs en `storage/logs/nohup-firmas.log` con timestamps y contexto (solicitud, proceso, status).
- **Snapshots:** cada `procesos_firma` guarda el JSON completo de la respuesta KIAI en `respuesta` (auditoría completa).

---

## Apéndice A — Mapeo de campos: Comfaca → KIAI

| Campo Comfaca | Campo KIAI | Notas |
|---|---|---|
| `firmantes_solicitud.orden` | `signers[].signingOrder` | Index + 1 después de sort |
| `firmantes_solicitud.nombre_completo` | `signers[].firstName`, `signers[].lastName` | División 4+ palabras |
| `firmantes_solicitud.email` | `signers[].email` | Trim aplicado |
| `firmantes_solicitud.numero_documento` | `signers[].identificationNumber` | String |
| `firmantes_solicitud.tipo` | `signers[].identificationTypeCode` | Mapeo SISU→KIAI |
| `firmantes_solicitud.telefono` | `signers[].phoneNumber` | Normalizado |
| `firmantes_solicitud.codigo_pais` | `signers[].phoneIndicative` | Default `+57` |
| `solicitudes_credito.numero_solicitud` | `externalReference` | Mismo ID |
| `pdfs_generados.filename` | `documentFileName` | Nombre del PDF |
| `pdfs_generados.path` (storage) | `base64Document` | Codificado en base64 |

---

## Apéndice B — Estructura del worker nohup

```
server/nohup/
├── app.ts                        # Entry point del daemon
├── lib/
│   ├── config.ts                 # Carga config KIAI standalone (fuera de Nitro)
│   └── types.ts                  # Tipos del worker
├── workers/
│   └── consultar-firma.worker.ts # Worker thread: consulta proceso KIAI
└── README.md
```

**Scripts en `package.json`:**
```json
{
  "nohup:firmas": "tsx server/nohup/app.ts",
  "nohup:firmas:daemon": "nohup pnpm nohup:firmas >> storage/logs/nohup-firmas.log 2>&1 &"
}
```

**Flujo de ejecución:**
1. `nohup:firmas` ejecuta `tsx server/nohup/app.ts` en foreground.
2. `app.ts` inicia un loop con `INTERVAL_MS = 5*60*1000` (5 minutos).
3. Cada ciclo llama a `procesarSolicitudesPendientes()`:
   - Lee solicitudes en `PENDIENTE_FIRMADO` con `procesos_firma` no simulados.
   - Por cada una, lanza un **worker thread** que ejecuta `consultarProceso()`.
   - Almacena el resultado en `procesos_firma` y, si el estado es final, transiciona la solicitud.
4. Maneja señales `SIGINT`/`SIGTERM` con cierre limpio (desconecta Prisma).

---

## Apéndice C — Estados de KIAI en detalle

| Estado | Significado | Comfaca recibe | Acción |
|---|---|---|---|
| `DRAFT` | Proceso creado pero no enviado | (raro, normalmente se salta) | (sigue en PENDIENTE_FIRMADO) |
| `PENDING` | Esperando firmantes | sí | (sigue en PENDIENTE_FIRMADO) |
| `IN_PROGRESS` | Algún firmante ha firmado | sí | (sigue en PENDIENTE_FIRMADO) |
| `COMPLETED` | Todos firmaron | sí | → `FIRMADO` |
| `DECLINED` | Un firmante rechazó | sí | → `RECHAZADA` |
| `EXPIRED` | Deadline (7 días) vencido | sí | → `APROBADA` (reenviable) |
| `CANCELLED` | Cancelado por admin | sí | → `APROBADA` (reenviable) |

---

## Apéndice D — Configuración KIAI en `nuxt.config.ts`

```ts
kiai: {
  env: env.KIAI_ENV || "dev",
  simulation: env.KIAI_SIMULATION
    ? env.KIAI_SIMULATION === "true"
    : (env.KIAI_ENV || "dev") === "dev",  // default simulation=true en dev
  grant_type: env.KIAI_GRANT_TYPE || "client_credentials",
  api_url_pro: env.KIAI_API_URL_PRO || "",
  api_url_dev: env.KIAI_API_URL_DEV || "",
  client_id_pro: env.KIAI_CLIENT_ID_PRO || "",
  client_id_dev: env.KIAI_CLIENT_ID_DEV || "",
  secret_key_pro: env.KIAI_SECRET_KEY_PRO || "",
  secret_key_dev: env.KIAI_SECRET_KEY_DEV || ""
}
```

**Variables requeridas para producción:**

```bash
KIAI_ENV=pro
KIAI_API_URL_PRO=https://api.kiai.co
KIAI_CLIENT_ID_PRO=<oauth client>
KIAI_SECRET_KEY_PRO=<secret>
# KIAI_SIMULATION no debe estar o ser "false" en producción
```

Ver detalle de la integración KIAI en [`docs/architecture.md` §6.3](./architecture.md).