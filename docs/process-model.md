# Modelo de Procesos — Creación de Solicitud de Crédito Comfaca

> Documento funcional que describe los procesos de negocio y técnicos del flujo de creación de una solicitud de crédito en el sistema Comfaca.
> Cubre: simulación previa, captura del wizard, asignación de codeudores, carga de documentos, generación/envío de PDF, y transiciones de estado hasta la entrega al área de validación.
> Fuentes: `server/api/solicitudes/*`, `server/api/codeudores/*`, `server/api/validacion/*`, `app/composables/solicitud/useWizardSolicitud.ts`, `server/services/postulacion-solicitud.service.ts`, `prisma/seeders/estados-solicitud.seed.ts`.

---

## Tabla de contenidos

1. [Visión general del proceso](#1-visión-general-del-proceso)
2. [Actores y roles](#2-actores-y-roles)
3. [Subprocesos previos: Simulación y autenticación](#3-subprocesos-previos-simulación-y-autenticación)
4. [Subproceso A: Generación de radicado](#4-subproceso-a-generación-de-radicado)
5. [Subproceso B: Wizard de captura (10 pasos)](#5-subproceso-b-wizard-de-captura-10-pasos)
6. [Subproceso C: Asignación de codeudores](#6-subproceso-c-asignación-de-codeudores)
7. [Subproceso D: Persistencia transaccional de la solicitud](#7-subproceso-d-persistencia-transaccional-de-la-solicitud)
8. [Subproceso E: Carga de documentos](#8-subproceso-e-carga-de-documentos)
9. [Subproceso F: Validación de firma local (opcional)](#9-subproceso-f-validación-de-firma-local-opcional)
10. [Subproceso G: Envío para validación + generación de PDF](#10-subproceso-g-envío-para-validación--generación-de-pdf)
11. [Subproceso H: Integración con Sisu (backend externo)](#11-subproceso-h-integración-con-sisu-backend-externo)
12. [Diagrama BPMN del flujo completo](#12-diagrama-bpmn-del-flujo-completo)
13. [Transiciones de estado](#13-transiciones-de-estado)
14. [Manejo de errores y rollback](#14-manejo-de-errores-y-rollback)
15. [Tabla resumen de endpoints](#15-tabla-resumen-de-endpoints)

---

## 1. Visión general del proceso

El proceso de creación de una solicitud de crédito recorre **3 macro-actividades**:

| # | Macro-actividad | Producto generado |
|---|---|---|
| 1 | **Simulación previa** (opcional) | Línea de crédito elegida + cuota calculada |
| 2 | **Radicación** | Solicitud persistida + firmantes + payload JSON + radicado único |
| 3 | **Formalización** | Documentos cargados + PDF generado + solicitud enviada a validación |

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│ Simulación  │ →  │  Wizard 10  │ →  │  Codeudores  │ →  │  Documentos +  │
│ (opcional)  │    │   pasos     │    │  (opcional)  │    │  PDF + envío   │
└─────────────┘    └─────────────┘    └──────────────┘    └────────────────┘
   Cotización        Radicación        Vínculos N:M       Formalización
```

---

## 2. Actores y roles

| Actor | Tipo | Capacidades |
|---|---|---|
| **Solicitante (trabajador)** | Usuario natural afiliado a Comfaca | Simular, diligenciar wizard, cargar documentos, firmar digitalmente |
| **Codeudor** | Usuario natural vinculado al titular | Recibir código de autorización, confirmar/rechazar vínculo |
| **Asesor (adviser)** | Usuario interno | Acompañar al solicitante (no ejecuta el flujo en su lugar) |
| **Administrador** | Usuario interno | Ver, editar, forzar transiciones |
| **Sistema Sisu** | Backend externo | Recepción de solicitudes para originación |
| **Sistema KIAI** | Proveedor de firma externa | Firma de pagarés y cartas |
| **Sistema FlaskPDF** | Microservicio | Generación del PDF del oficio |

**Roles permitidos para crear una solicitud** (`server/api/solicitudes/guardar-solicitud.post.ts:112`):
```
administrator | adviser | user_trabajador | user_empresa | empleador
```

---

## 3. Subprocesos previos: Simulación y autenticación

### 3.1 Simulación de crédito (opcional, recomendado)

Realizado en una sesión previa a la radicación. Permite al usuario comparar líneas de crédito, plazos y cuotas.

**Producto:** objeto `SimuladorData` que se persiste en `localStorage` con clave del simulador y se inyecta al wizard en `useWizardSolicitud.loadDataWizard()`.

**Datos del simulador que se acarrean:**
- `valorSolicitud`, `plazoMeses`, `cuotaMensual`, `tasaInteres`, `totalIntereses`, `totalPagar`.
- `lineaCredito` (con `tipcre`, `modxml4`, `detalle`, `numcuo`, `estado`, `auxest`, `estcre`, `pagseg`, `repdcr`, `tipfin`, `codeudores`).

### 3.2 Autenticación

Cualquier ruta `/dash/**` requiere JWT válido (`server/middleware/auth.ts`). El usuario debe tener al menos uno de los roles listados en §2. La información del usuario y de su empresa/empleado (en `session.user.trabajador`) se hidrata desde la sesión.

---

## 4. Subproceso A: Generación de radicado

**Endpoint:** `POST /api/solicitudes/numero-disponible`

**Trigger:** al montar el componente wizard, cada 30 segundos se refresca el radicado provisional (`useWizardSolicitud.iniciarConsultaRecurrente`).

**Lógica del backend** (`server/api/solicitudes/numero-disponible.post.ts`):

```
entrada:  { linea_credito: "03" }
↓
SELECT * FROM numero_solicitudes
  WHERE linea_credito = ?
  ORDER BY numeric_secuencia DESC
  LIMIT 1
↓
nueva_secuencia = max(secuencia) + 1
vigencia = parseInt(YYYYMM del now)
↓
radicado = pad(nueva_secuencia, 6) + "-" + vigencia + "-" + linea_credito
↓
salida: "000007-202604-03"
```

> ⚠️ **Nota:** existe un desfase de versión: `numero-disponible.post.ts` usa formato `YYYYMM` (`202604`), mientras que `postulacion-solicitud.service.ts:113` usa `YYYY` (`2026`). Ambos se almacenan en `numero_solicitudes.vigencia` (`Int`) y conviven en la BD.

**Importante:** el radicado devuelto es **provisional** (no se persiste en `numero_solicitudes` hasta que se ejecute el subproceso D). Sirve para evitar duplicados visuales mientras el usuario diligencia el wizard.

---

## 5. Subproceso B: Wizard de captura (10 pasos)

**Composable:** `app/composables/solicitud/useWizardSolicitud.ts`
**Estado persistente:** `useState` para índice actual + `localStorage` para la clave del paso (`comfaca_credito_solicitud_current_step`).

### Pasos (en orden base)

| # | `key` | Título | Propósito |
|---|---|---|---|
| 1 | `solicitud` | Solicitud | Valor, plazo, línea de crédito (prellenado desde simulador) |
| 2 | `solicitante` | Datos del solicitante | Datos demográficos + laborales (prellenado desde `session.user.trabajador`) |
| 3 | `conyuge` | Datos del cónyuge (opcional) | Toggle dinámico según `useConyugeComposable` |
| 4 | `laboral` | Información laboral | Empresa, fecha de ingreso, tipo de contrato |
| 5 | `ingresos` | Ingresos y descuentos | Salario, subsidio transporte, salud/pensión |
| 6 | `economica` | Información económica | Gastos, otros créditos, capacidad de pago |
| 7 | `propiedades` | Propiedades | Lista dinámica (vehículos, inmuebles) |
| 8 | `deudas` | Deudas | Lista dinámica |
| 9 | `referencias` | Referencias | Familiares + personales |
| 10 | `revision` | Revisión y generación | Confirmación y disparo del guardado |

### Paso especial: Codeudores (intercalado entre 9 y 10)

Se inserta **solo si `lineaCredito.codeudores > 0`** (regla de negocio, evaluada en `buildWizardSteps`):

```
[1, 2, 3, 4, 5, 6, 7, 8, 9, codeudores, 10]
```

Si no requiere codeudores: el paso se omite y se salta del 9 al 10.

### Prellenado automático desde sesión

`loadDataWizard()` ejecuta:
1. Lee `localStorage.comfaca_credito_solicitud_current_step` para restaurar el paso actual.
2. Lee `localStorage` del simulador (`comfaca_credito_simulador`) → copia monto, plazo, cuota, línea.
3. Lee `localStorage.comfaca_credito_trabajador` (o `session.user.trabajador`):
   - Mapeo de campos del backend Sisu a campos del formulario:
     `coddoc→tipo_documento`, `cedtra→numero_documento`, `prinom/segnom→nombres`, `priape/segape→apellidos`, `fecnac→fecha_nacimiento`, `sexo→genero`, `estciv→estado_civil`, `nivedu→nivel_educativo`, `cargo→profesion`, `email`, `telefono`, `direccion`, `barrio`, `codciu→ciudad`, `departamento`, `salario`, `codcat→codigo_categoria`, `nit→empresa_nit`, `razsoc→empresa_razon_social`, etc.
4. Carga configuraciones (`useConfigurations`) para inyectar `auxilio_transporte` por defecto.

### Validación por paso

`useSolicitudValidation` se ejecuta antes de permitir `next()` o `guardarSolicitud()`. Los campos requeridos por paso se evalúan contra Zod schemas equivalentes en backend.

### Acción final del wizard

**Función:** `useWizardSolicitud.guardarSolicitud(payloadForm)`

```
payloadForm (con sections: solicitud, solicitante, linea_credito, etc.)
        │
        ▼
mezcla con datos del simulador en localStorage
        │
        ▼
POST /api/solicitudes/guardar-solicitud
        │
        ▼
si OK → modal de éxito con 2 botones:
        ├── "Ir a documentos" → /dash/solicitud/documentos/{numero_solicitud}
        └── "Inicio" → / (limpia wizard)
si ERROR → toast con mensaje del backend
```

---

## 6. Subproceso C: Asignación de codeudores

Solo se ejecuta si la línea de crédito requiere N codeudores (campo `lineaCredito.codeudores` > 0).

**Endpoints:**
- `POST /api/codeudores` — crea vínculo `usuarios_codeudores` (titular → codeudor, `pendiente`).
- `GET /api/codeudores` — lista codeudores del titular.
- `POST /api/codeudores/{id}/confirmar` — codeudor confirma con código OTP.
- `POST /api/codeudores/{id}/reenviar-codigo` — reenvía código al correo del codeudor.

**Flujo:**

```
1. Wizard paso "codeudores"
   └─ Usuario captura: tipo_doc, número_doc, nombre, email, teléfono
        │
        ▼
2. POST /api/codeudores
   ├─ Genera codigo_autorizacion (UUID + hash)
   ├─ Persiste en usuarios_codeudores con estado = "pendiente"
   ├─ Envía correo al codeudor con el código
   └─ Devuelve el registro creado
        │
        ▼
3. Codeudor recibe correo → abre vista de confirmación
   └─ Ingresa código → POST /api/codeudores/{id}/confirmar
        │
        ▼
4. Si OK → estado = "autorizado", autorizado_at = now()
   Si expirado (24h) → estado = "expirado"
   Si falla → estado = "rechazado"
```

**Cuando se guarda la solicitud** (subproceso D), los codeudores confirmados se duplican en `firmantes_solicitud` con `orden = 2, 3, ...` (el titular es siempre `orden = 1`).

---

## 7. Subproceso D: Persistencia transaccional de la solicitud

**Endpoint:** `POST /api/solicitudes/guardar-solicitud`
**Servicio:** `server/services/postulacion-solicitud.service.ts → guardarSolicitudCompleta()`

**Validación Zod del body** (`server/api/solicitudes/guardar-solicitud.post.ts`):

```ts
{
  solicitud: SolicitudSchema,           // valor, plazo, tasa, estado, producto_tipo...
  solicitante: SolicitanteSchema,       // tipo_persona, documento, nombres...
  linea_credito: any,
  conyuge: any,
  informacion_laboral: any,
  ingresos_descuentos: any,
  informacion_economica: any,
  propiedades: any,
  deudas: any,
  referencias: any,
  codeudores_asignados?: Array<{       // opcional
    vinculo_id, user_id, tipo_documento, numero_documento,
    nombre_completo, email, telefono?
  }>
}
```

**Pasos internos del servicio** (todos secuenciales; ⚠️ **sin transacción Prisma explícita**, ver §14):

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. Estado inicial:                                                   │
│    SELECT * FROM estados_solicitud WHERE activo=true ORDER BY orden  │
│    → estadoInicial.id (ej. "POSTULADO")                              │
├──────────────────────────────────────────────────────────────────────┤
│ 2. Radicado:                                                         │
│    if solicitud.numero_solicitud enviado:                            │
│      ├─ existe en BD? → generar uno nuevo                            │
│      └─ no existe? → registrar en numero_solicitudes                 │
│    else:                                                             │
│      └─ generar uno nuevo con guardarNumeroSolicitud()               │
├──────────────────────────────────────────────────────────────────────┤
│ 3. INSERT solicitudes_credito (estado = estadoInicial.id)            │
├──────────────────────────────────────────────────────────────────────┤
│ 4. UPDATE solicitudes_credito SET numero_comprobante = pad(radicado) │
├──────────────────────────────────────────────────────────────────────┤
│ 5. INSERT solicitud_payload (JSON versionado "1.0")                  │
├──────────────────────────────────────────────────────────────────────┤
│ 6. INSERT solicitud_solicitante (titular)                            │
├──────────────────────────────────────────────────────────────────────┤
│ 7. INSERT solicitud_timeline (estado = POSTULADO, automatico=true)   │
├──────────────────────────────────────────────────────────────────────┤
│ 8. INSERT firmantes_solicitud (createMany):                          │
│    - orden 1 = titular                                               │
│    - orden 2..N = codeudores_asignados                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Retorno:**

```json
{
  "numero_solicitud": "000007-2026-03",
  "solicitud": { /* objeto Prisma creado */ },
  "payload": { /* eco del payload original */ },
  "firmantes_solicitante": 1,
  "firmantes_codeudores": 2
}
```

**Efectos secundarios:**
- Se persiste `numero_solicitudes` con `radicado` UNIQUE.
- El campo `rol_en_solicitud` se setea en `T` (titular) por defecto.
- El campo `moneda` se setea en `COP` por defecto.
- El campo `fecha_radicado` se setea con `new Date()`.

---

## 8. Subproceso E: Carga de documentos

**Pantalla:** `/dash/solicitud/documentos/{id}`
**Composable:** `app/composables/solicitud/useDocumentosSolicitud.ts`

### 8.1 Listado de documentos requeridos

Se obtiene vía `useDocumentos(id)` desde el backend (origen: catálogo `tipo_documentos` + reglas por línea de crédito).

### 8.2 Subida individual

**Endpoint:** `POST /api/solicitudes/{id}/documentos`

```
multipart/form-data:
  documento: <binary>
  documento_requerido_id: string
        │
        ▼
1. Validar sesión y propiedad: solicitud.owner_username == session.user.username
2. Generar uuidFilename = crypto.randomUUID()
3. Determinar extensión del filename o mime
4. mkdir -p storage/uploads/{solicitudId}
5. writeFile(storage/uploads/{solicitudId}/{uuidFilename}.{ext}, buffer)
6. INSERT solicitud_documentos:
   - solicitud_id
   - documento_uuid
   - documento_requerido_id
   - nombre_original, saved_filename
   - tipo_mime, tamano_bytes
   - ruta_archivo = "/storage/uploads/{solicitudId}/{saved_filename}"
   - activo = true
7. SELECT solicitud_documentos WHERE solicitud_id = ? AND activo=true ORDER BY created_at DESC
8. RETURN documentos mapeados al frontend
```

### 8.3 Listado, eliminación y descarga

- `GET /api/solicitudes/{id}/documentos` — lista los documentos activos.
- `DELETE /api/solicitudes/{id}/documentos/{docId}` — soft-delete (`activo=false`, `deleted_at=now()`).
- `GET /api/solicitudes/{id}/documentos/{docId}/descargar` — envía el archivo físico.

### 8.4 Reglas de validación

- **Tamaño máximo**: controlado por la config del servidor web (Nitro default 50MB).
- **Extensiones permitidas**: `jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx`.
- **Sesgo a PDF**: si el mime type no se reconoce, se asume `application/pdf`.

---

## 9. Subproceso F: Validación de firma local (opcional)

**Trigger:** si la configuración `firma_digital_local = true` y el usuario presiona "Enviar a validación".

**Función:** `useResumenSolicitud.verificarFirmaDigital()`

```
GET /api/mercurio/firma_digital_keys
        │
        ▼
¿tiene_firma = true?
   ├── sí → enviarGenerarOficio()
   └── no → showCapturaModal = true
              │
              ▼
          usuario captura código
              │
              ▼
          POST /api/validacion/codigo-firma
              { codigo, solicitud_id }
              │
              ▼
          ¿éxito?
             ├── sí → cerrar modal → enviarGenerarOficio()
             └── no → mostrar capturaError
```

---

## 10. Subproceso G: Envío para validación + generación de PDF

**Endpoint destino:** `/dash/solicitud/resumen/{id}`
**Composable:** `app/composables/solicitud/useResumenSolicitud.ts → enviarGenerarOficio()`

### Pasos

```
1. POST /api/solicitudes/{id}/cambiar-estado
   { estado: "ENVIADO_VALIDACION" }
        │
        ▼
   Valida que el estado sea uno de: DOCUMENTOS_CARGADOS, POSTULADO, ENVIADO_VALIDACION
   Valida que solicitud.owner_username == session.user.username
   UPDATE solicitudes_credito SET estado = "ENVIADO_VALIDACION"
        │
        ▼
2. POST /api/solicitudes/{id}/generar-pdf
   { fecha_envio, firma_digital_local, tiene_firma }
        │
        ▼
   Llama al microservicio FlaskPDF (server/services/pdf/*)
   Genera el PDF del oficio de crédito
   INSERT/UPDATE pdfs_generados (UNIQUE por solicitud_id)
        │
        ▼
3. Navegación a /dash/solicitud/special_thanks/{id}
   (pantalla de éxito final)
```

> ⚠️ **Hallazgo:** `cambiar-estado.post.ts` NO inserta en `solicitud_timeline`. Esto es una brecha en la auditoría (ver §13).

---

## 11. Subproceso H: Integración con Sisu (backend externo)

**Endpoint:** `GET /api/solicitudes/enviar-solicitud/{slug}`
**Servicio:** `server/services/shared/datos-api-sisuweb.service.ts`

Este endpoint se ejecuta **manualmente** desde la vista de administración (`/admin/solicitudes/show/{id}`) para enviar la solicitud al backend externo de originación Sisu.

```
1. SELECT solicitudes_credito WHERE numero_solicitud = {slug}
   INCLUDE solicitud_documentos, solicitud_payload, solicitud_solicitante
        │
        ▼
2. Mapear campos del modelo Prisma al payload de Sisu:
   documento, fecha, ofiafi, usuario, numdoc, codcat, forpag, pigsub, sueldo,
   otring, otrcre, cappag, numcue, tipcue, codcue, mancat, tipcre, perpag,
   facfin, nocts, nitseg, facseg, valcre, tipapr, tipinv, estado, fecrec,
   usuest, fecest, acta, modrec, valapr, nota, migrado, operacion, numcre,
   cancelado, aprseg, documentos (JSON de IDs de documentos requeridos)
        │
        ▼
3. POST a la API Sisu (URL según STAGE/API_SISU_ENV)
        │
        ▼
4. Si OK → continuar con originación en Sisu
   Si ERROR → 502 Bad Gateway
```

**Estados objetivo en Sisu:** `PENDIENTE` (inicial), luego `APROBADA`, `RECHAZADA`, etc. según análisis crediticio externo.

---

## 12. Diagrama BPMN del flujo completo

```
                ┌─────────────────────┐
                │  Inicio: Usuario    │
                │  autenticado        │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  ¿Tiene datos del   │
                │  simulador?         │
                └──────────┬──────────┘
              ┌────────────┴────────────┐
              │ sí                      │ no
              ▼                         ▼
   ┌──────────────────┐       ┌──────────────────┐
   │ Prellenar        │       │ Capturar monto,  │
   │ monto, plazo,    │       │ plazo, línea en  │
   │ línea desde      │       │ paso "solicitud" │
   │ localStorage     │       └──────────────────┘
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │   Wizard 10 pasos (prellenado desde sesión)  │
   │   1. Solicitud → 2. Solicitante → ... →      │
   │   9. Referencias → [10. Codeudores] →        │
   │   11. Revisión                                │
   └────────┬─────────────────────────────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ Validar formulario  │
   │ (Zod schemas)       │
   └────────┬────────────┘
            │
            ▼
   ┌─────────────────────────────────────────────┐
   │ POST /api/solicitudes/guardar-solicitud     │
   │ → INSERT solicitudes_credito                │
   │ → INSERT solicitud_payload                  │
   │ → INSERT solicitud_solicitante              │
   │ → INSERT solicitud_timeline                 │
   │ → INSERT firmantes_solicitud                │
   └────────┬────────────────────────────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ Modal de éxito      │
   │ "Ir a documentos"   │
   └────────┬────────────┘
            │
            ▼
   ┌─────────────────────────────────────────────┐
   │ POST /api/solicitudes/{id}/documentos       │
   │ → Guardar archivo en storage/uploads/{id}/  │
   │ → INSERT solicitud_documentos               │
   │ (repetir por cada documento requerido)      │
   └────────┬────────────────────────────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ ¿Todos los docs     │
   │ obligatorios listos?│
   └────────┬────────────┘
        sí │
            ▼
   ┌─────────────────────┐
   │ POST cambiar-estado │ estado = DOCUMENTOS_CARGADOS
   └────────┬────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ Pantalla resumen    │
   │ Botón "Enviar a     │
   │ validación"         │
   └────────┬────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ ¿firma_digital_local│
   │ habilitada?         │
   └────────┬────────────┘
     sí     │              no
            ▼              │
   ┌──────────────────┐    │
   │ Verificar firma  │    │
   │ ¿tiene_firma?    │    │
   └────┬─────────┬───┘    │
   sí   │     no   │       │
        ▼     ▼   │       │
   ┌─────┐ ┌────────────┐  │
   │conti│ │Modal OTP   │  │
   │nuar │ │validar     │  │
   └──┬──┘ └─────┬──────┘  │
      │       │            │
      │       ▼              ▼
      │  ┌─────────────────────────┐
      │  │ POST /validacion/       │
      │  │   codigo-firma          │
      │  └─────────┬───────────────┘
      │            │ OK
      │            ▼
      └────────────┐
                   ▼
   ┌─────────────────────────────────────────────┐
   │ POST cambiar-estado → ENVIADO_VALIDACION    │
   │ POST /generar-pdf                           │
   │   → INSERT/UPDATE pdfs_generados            │
   └────────┬────────────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────────────┐
   │ Navegar a /dash/solicitud/special_thanks    │
   │ (vista final del solicitante)               │
   └────────┬────────────────────────────────────┘
            │
            ▼ (administrador)
   ┌─────────────────────────────────────────────┐
   │ GET /api/solicitudes/enviar-solicitud/{slug}│
   │ → POST a Sisu (backend externo)             │
   │ → Sisu responde APROBADA/RECHAZADA          │
   └─────────────────────────────────────────────┘
```

---

## 13. Transiciones de estado

| Desde | Hacia | Trigger | Endpoint / Acción | ¿Bitácora? |
|---|---|---|---|---|
| (ninguno) | `POSTULADO` | Creación inicial de la solicitud | `POST /api/solicitudes/guardar-solicitud` | ✅ Sí (servicio) |
| `POSTULADO` | `DOCUMENTOS_CARGADOS` | Todos los documentos obligatorios cargados | `POST /api/solicitudes/{id}/cambiar-estado` | ❌ **No** (brecha) |
| `POSTULADO` o `DOCUMENTOS_CARGADOS` | `ENVIADO_VALIDACION` | Usuario presiona "Enviar a validación" | `POST /api/solicitudes/{id}/cambiar-estado` | ❌ **No** (brecha) |
| `ENVIADO_VALIDACION` | `PENDIENTE_FIRMADO` | Inicio del flujo de firma externa (KIAI) | servicio `server/services/firma/*` | ✅ Sí |
| `PENDIENTE_FIRMADO` | `FIRMADO` | KIAI notifica firma completada | servicio `server/services/firma/*` | ✅ Sí |
| `FIRMADO` | `ENVIADO_PENDIENTE_APROBACION` | Asesor envía a aprobación | servicio admin | ✅ Sí |
| `ENVIADO_PENDIENTE_APROBACION` | `APROBADA` | Analista aprueba | servicio admin | ✅ Sí |
| `ENVIADO_PENDIENTE_APROBACION` | `RECHAZADA` | Analista rechaza | servicio admin | ✅ Sí |
| (cualquiera) | `DESESTIMADA` | Falta de requisitos | servicio admin | ✅ Sí |
| (cualquiera) | `CANCELADA` | Solicitante cancela | servicio admin | ✅ Sí |
| (cualquiera) | `DESISTE` | Solicitante desiste | servicio admin | ✅ Sí |

**Brecha detectada:** el endpoint `cambiar-estado.post.ts` no escribe en `solicitud_timeline`. Las transiciones manuales desde la UI no quedan registradas en la bitácora, solo las automáticas del servicio. **Recomendación:** añadir `INSERT solicitud_timeline` dentro de `cambiar-estado.post.ts`.

---

## 14. Manejo de errores y rollback

### 14.1 Estrategia actual

El servicio `guardarSolicitudCompleta()` ejecuta las inserciones **secuencialmente sin transacción Prisma explícita**. Si una inserción falla a mitad del proceso, las anteriores quedan persistidas sin rollback automático.

**Tabla de fallos posibles:**

| Paso | Fallo | Estado de la BD |
|---|---|---|
| 1-2 (estado/radicado) | Error DB | Nada persistido (clean) |
| 3 (solicitud) | Error DB | Nada persistido |
| 4 (numero_comprobante update) | Error DB | Solicitud sin `numero_comprobante` (inconsistencia leve) |
| 5 (payload) | Error DB | Solicitud + numero_comprobante OK, sin payload |
| 6 (solicitante) | Error DB | Solicitud + payload OK, sin solicitante |
| 7 (timeline) | Error DB | Solicitud OK sin bitácora inicial |
| 8 (firmantes) | Error DB | Solicitud OK sin firmantes |

### 14.2 Recomendación

Migrar el servicio a `prisma.$transaction([...])` o a `prisma.solicitudes_credito.create({ include: { ... } })` con `createMany` anidado, garantizando atomicidad.

### 14.3 Manejo de errores HTTP

Todos los endpoints devuelven `CustomResponse.error(...)` con códigos:

| Código | Significado |
|---|---|
| 400 | Datos faltantes o inválidos (Zod fail) |
| 401 | Sin sesión activa |
| 403 | Permiso denegado (rol insuficiente, no es dueño) |
| 404 | Solicitud/recurso no encontrado |
| 502 | Error conectando con backend externo (Sisu, KIAI, FlaskPDF) |

---

## 15. Tabla resumen de endpoints

| Método | Endpoint | Servicio | Auth | Rol requerido |
|---|---|---|---|---|
| `POST` | `/api/solicitudes/numero-disponible` | inline | sí | autenticado |
| `POST` | `/api/solicitudes/guardar-solicitud` | `postulacion-solicitud.service` | sí | administrator, adviser, user_trabajador, user_empresa, empleador |
| `GET` | `/api/solicitudes/mis-solicitudes` | inline | sí | autenticado |
| `GET` | `/api/solicitudes/{id}` | inline | sí | autenticado |
| `DELETE` | `/api/solicitudes/{id}` | inline | sí | autenticado + dueño |
| `POST` | `/api/solicitudes/{id}/cambiar-estado` | inline | sí | dueño + estado permitido |
| `GET` | `/api/solicitudes/{id}/documentos` | inline | sí | autenticado |
| `POST` | `/api/solicitudes/{id}/documentos` | inline | sí | dueño |
| `GET` | `/api/solicitudes/enviar-solicitud/{slug}` | `datos-api-sisuweb.service` | sí | administrador |
| `POST` | `/api/solicitudes/{id}/generar-pdf` | servicio PDF | sí | autenticado |
| `GET` | `/api/solicitudes/{id}/descargar-pdf` | servicio PDF | sí | autenticado |
| `GET` | `/api/solicitudes/{id}/estado-pdf` | servicio PDF | sí | autenticado |
| `POST` | `/api/codeudores` | `codeudor.service` | sí | autenticado |
| `GET` | `/api/codeudores` | `codeudor.service` | sí | autenticado |
| `POST` | `/api/codeudores/{id}/confirmar` | `codeudor.service` | sí | codeudor |
| `POST` | `/api/codeudores/{id}/reenviar-codigo` | `codeudor.service` | sí | codeudor |
| `POST` | `/api/validacion/codigo-firma` | servicio validación | sí | autenticado |
| `GET` | `/api/mercurio/firma_digital_keys` | servicio mercurio | sí | autenticado |

---

## Apéndice A — Mapeo de campos frontend ↔ backend Sisu ↔ Prisma

| Concepto | Campo frontend | Campo Sisu | Campo Prisma |
|---|---|---|---|
| Cédula trabajador | `solicitante.numero_documento` | `numdoc` | `solicitud_solicitante.numero_documento` |
| Categoría | `solicitante.codigo_categoria` | `codcat` | `solicitud_solicitante.codigo_categoria` |
| Salario | `solicitante.salario` | `sueldo` | `solicitud_solicitante.salario` |
| Valor crédito | `solicitud.valor_solicitud` | `cappag`, `valcre` | `solicitudes_credito.valor_solicitud` |
| Línea crédito | `linea_credito.tipcre` | `tipcre`, `mancat` | `solicitudes_credito.tipo_credito`, `producto_tipo` |
| Plazo | `solicitud.plazo_meses` | `perpag`, `nocts` | `solicitudes_credito.plazo_meses` |
| Tasa | `linea_credito.tasa_interes` | `facfin` (factor = tasa/100) | `solicitudes_credito.tasa_interes` |
| Estado | `solicitud.estado` | `estado` | `solicitudes_credito.estado` (FK) |
| Fecha radicado | `solicitud.fecha_radicado` | `fecha`, `fecrec`, `fecest` | `solicitudes_credito.fecha_radicado` |
| Documentos requeridos | array de IDs | `documentos` (JSON) | `solicitud_documentos.documento_requerido_id` |

---

## Apéndice B — Reglas de negocio extraídas del código

1. **Codeudores solo si `lineaCredito.codeudores > 0`**: el paso del wizard se inserta dinámicamente.
2. **Máximo de firmantes**: titular + N codeudores confirmados. Sin límite duro en BD, pero `UNIQUE(solicitud_id, orden)` lo previene.
3. **Estados permitidos para cambio manual** (en `cambiar-estado.post.ts:13`): `DOCUMENTOS_CARGADOS`, `POSTULADO`, `ENVIADO_VALIDACION`. Otros estados requieren rol de administrador (vía servicio admin, no este endpoint).
4. **Email opcional en `solicitante`**: Zod schema lo permite vacío (`.email().optional().or(z.literal(""))`).
5. **Cuota mensual se calcula en frontend** (`autocalcularIngresos`) pero se persiste sin validación de server (acepta cualquier número).
6. **El payload JSON es la fuente de verdad de la estructura completa**; `solicitud_solicitante` solo guarda campos normalizados para consultas rápidas.
7. **Codeudores del wizard se persisten en `firmantes_solicitud`** con `orden = 2..N`, NO se replican en `usuarios_codeudores` (esa tabla es para invitaciones previas, opcional).
8. **El PDF se regenera** (no se acumula): `pdfs_generados.solicitud_id` es UNIQUE. Cada generación hace UPDATE o DELETE+INSERT.
9. **Documentos admiten soft-delete** (`activo=false`, `deleted_at=now()`). El cascade FK no se activa mientras `activo=true`.
10. **El radicado provisional se refresca cada 30 segundos** mientras el usuario está en el wizard, para evitar duplicados si dos sesiones simultáneas intentan crear solicitudes.