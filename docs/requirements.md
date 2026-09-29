# Especificación de Requerimientos y Casos de Uso — Comfaca Créditos

> Documento funcional que describe los requerimientos funcionales (RF) y no funcionales (RNF), y los casos de uso (CU) del sistema de créditos en línea de la Caja de Compensación Familiar del Caquetá (Comfaca).
> Fuentes documentales: `docs/data-model.md`, `docs/process-model.md`, `docs/approval-signing-process.md`, `docs/architecture.md`, `docs/configurations.md`, `docs/conventions.md`.
> Audiencia: equipo de desarrollo, producto, calidad, gestión de proyectos y auditoría.

---

## Tabla de contenidos

**PARTE I — VISIÓN GENERAL**

1. [Propósito del documento](#1-propósito-del-documento)
2. [Glosario y definiciones](#2-glosario-y-definiciones)
3. [Actores del sistema](#3-actores-del-sistema)
4. [Arquitectura funcional de alto nivel](#4-arquitectura-funcional-de-alto-nivel)

**PARTE II — REQUERIMIENTOS FUNCIONALES**

5. [Catálogo de requerimientos funcionales](#5-catálogo-de-requerimientos-funcionales)
   - RF-01 — Registro y autenticación
   - RF-02 — Simulación de crédito
   - RF-03 — Radicación de solicitud
   - RF-04 — Vinculación de codeudores
   - RF-05 — Carga de documentos
   - RF-06 — Envío a validación
   - RF-07 — Aprobación / rechazo / desestimación
   - RF-08 — Gestión de firmantes
   - RF-09 — Carga de anexos
   - RF-10 — Inicio del proceso de firma digital
   - RF-11 — Firma digital por el firmante
   - RF-12 — Sincronización con KIAI
   - RF-13 — Cancelación / descarte
   - RF-14 — Listado y consulta de solicitudes
   - RF-15 — Generación de PDF
   - RF-16 — Integración con Sisu (cartera)
   - RF-17 — Notificaciones
   - RF-18 — Administración y RBAC

**PARTE III — REQUERIMIENTOS NO FUNCIONALES**

6. [Catálogo de requerimientos no funcionales](#6-catálogo-de-requerimientos-no-funcionales)
   - RNF-01 — Rendimiento
   - RNF-02 — Seguridad
   - RNF-03 — Disponibilidad
   - RNF-04 — Auditabilidad
   - RNF-05 — Portabilidad y ambientes
   - RNF-06 — Mantenibilidad
   - RNF-07 — Internacionalización y localización
   - RNF-08 — Compatibilidad

**PARTE IV — CASOS DE USO**

7. [Catálogo de casos de uso](#7-catálogo-de-casos-de-uso)
8. [Matriz actor × caso de uso](#8-matriz-actor--caso-de-uso)
9. [Diagramas de casos de uso](#9-diagramas-de-casos-de-uso)
10. [Especificación detallada de casos de uso](#10-especificación-detallada-de-casos-de-uso)
    - CU-001 — Iniciar sesión
    - CU-002 — Simular crédito
    - CU-003 — Radicar solicitud de crédito
    - CU-004 — Vincular codeudor
    - CU-005 — Cargar documentos de soporte
    - CU-006 — Enviar solicitud a validación
    - CU-007 — Aprobar / rechazar / desestimar solicitud
    - CU-008 — Gestionar firmantes
    - CU-009 — Cargar anexos
    - CU-010 — Iniciar proceso de firma KIAI
    - CU-011 — Firmar digitalmente (firmante)
    - CU-012 — Sincronizar estado KIAI (worker)
    - CU-013 — Cancelar proceso de firma
    - CU-014 — Listar mis solicitudes (solicitante)
    - CU-015 — Listar solicitudes pendientes (administrador)
    - CU-016 — Generar PDF de la solicitud
    - CU-017 — Sincronizar con Sisu
    - CU-018 — Recibir notificación de estado

**PARTE V — TRAZABILIDAD**

11. [Matriz de trazabilidad RF × CU × Endpoint](#11-matriz-de-trazabilidad-rf--cu--endpoint)
12. [Reglas de negocio transversales](#12-reglas-de-negocio-transversales)

---

## 1. Propósito del documento

Este documento es la **fuente de verdad funcional** del sistema Comfaca Créditos. Su objetivo es:

- Servir como contrato funcional entre producto y desarrollo.
- Proveer una especificación de casos de uso que oriente las pruebas funcionales.
- Permitir trazabilidad desde un requerimiento hasta el endpoint que lo implementa.
- Documentar reglas de negocio aplicables a múltiples procesos.

### 1.1 Alcance

Cubre las funcionalidades relacionadas con:

- **Solicitudes de crédito:** creación, simulación, radicación, envío.
- **Codeudores:** vinculación, autenticación OTP.
- **Documentos:** carga por solicitante, gestión de anexos por el asesor.
- **Validación interna:** revisión, aprobación, rechazo por el asesor.
- **Firma digital:** integración con KIAI, gestión de firmantes, polling de estado.
- **Generación de PDF:** documento contractural de la solicitud.
- **Integraciones externas:** Sisu (cartera), KIAI (firma), FirmaPlus (respaldo).

### 1.2 Fuera de alcance

- **Desembolso:** no implementado en este sistema.
- **Cobranza:** gestionada externamente.
- **Administración de productos, tasas, líneas:** catalogada en sistema externo (Mercurio).
- **CRM comercial:** solo se registran datos básicos del solicitante.

### 1.3 Documentos relacionados

| Documento | Relación |
|---|---|
| [`docs/data-model.md`](./data-model.md) | Modelo de datos (22 modelos Prisma, 5 enums) |
| [`docs/process-model.md`](./process-model.md) | Proceso de creación de solicitud (wizard, radicado) |
| [`docs/approval-signing-process.md`](./approval-signing-process.md) | Proceso de aprobación y firma digital |
| [`docs/architecture.md`](./architecture.md) | Arquitectura técnica (stack, capas, dependencias) |
| [`docs/configurations.md`](./configurations.md) | Configuración runtime (env vars, runtimeConfig) |
| [`docs/conventions.md`](./conventions.md) | Convenciones de código (estilo, naming, errores) |

---

## 2. Glosario y definiciones

| Término | Definición |
|---|---|
| **Acreditado** | Persona afiliada a Comfaca con derecho a solicitar crédito. |
| **Anexo** | Documento adicional que el asesor sube como referencia (pagaré, carta de instrucciones). No lo firma KIAI automáticamente. |
| **Asesor / Administrador** | Usuario interno de Comfaca con rol `admin`. Gestiona solicitudes, firmantes y procesos de firma. |
| **Codeudor** | Persona natural que respalda el crédito del titular. Comparte responsabilidad crediticia. |
| **Documentos de soporte** | Archivos cargados por el solicitante: cédula, desprendibles, recibos, etc. |
| **Envío a validación** | Transición de la solicitud desde el solicitante al equipo de revisión interna. |
| **Estado** | Valor cualitativo que indica la fase actual del ciclo de vida de la solicitud. Ver pipeline en `data-model.md` §4. |
| **Expiración (EXPIRED)** | Estado KIAI cuando han pasado 7 días sin completar la firma. |
| **Firmante** | Persona (titular o codeudor) que firma digitalmente la solicitud vía KIAI. |
| **FirmaPlus** | Proveedor alterno de firma digital (respaldo o por proceso). |
| **KIAI** | Proveedor principal de firma digital externa. Plataforma SaaS. |
| **OTP (One-Time Password)** | Contraseña de un solo uso enviada por email/SMS para autenticar al firmante. |
| **Payload** | Datos completos del formulario de la solicitud, serializados en JSON. |
| **PDF generado** | Versión imprimible de la solicitud. Se incluye en el proceso KIAI. |
| **Pipeline de estados** | Secuencia de 11 estados por los que pasa una solicitud desde `BORRADOR` hasta `VIGENTE`. |
| **Polling** | Sondeo periódico al API de KIAI (cada 5 minutos) para sincronizar estados. |
| **Proceso KIAI** | Instancia de un workflow de firma creado en KIAI. Registrado en `procesos_firma`. |
| **Radicado** | Identificador único de la solicitud generado al guardar. Formato `000007-2026-03`. |
| **Sisu** | Sistema de cartera de Comfaca (origen). Recibe la solicitud tras aprobación. |
| **Solicitante** | Persona natural que radica la solicitud. Generalmente el titular acreditado. |
| **Timeline** | Bitácora de eventos de la solicitud, registrada en `solicitud_timeline`. |
| **Token público** | Cadena cifrada que identifica al firmante sin requerir login. |

---

## 3. Actores del sistema

### 3.1 Actores primarios

| Actor | Descripción | Tipo |
|---|---|---|
| **Solicitante** | Persona natural que solicita un crédito. Generalmente acreditado a Comfaca. | Externo (autenticado) |
| **Asesor / Administrador** | Funcionario de Comfaca que gestiona solicitudes, firmantes y firma. | Interno (autenticado) |
| **Codeudor** | Persona natural que respalda al titular. Puede firmar la solicitud. | Externo (autenticado vía OTP) |
| **Firmante** | Persona (titular o codeudor) que firma digitalmente. | Externo (autenticado vía KIAI) |
| **Sistema** | Procesos automatizados (worker nohup, batch). | Sistema (automatizado) |

### 3.2 Actores secundarios (sistemas externos)

| Actor | Descripción | Tipo |
|---|---|---|
| **KIAI** | Plataforma externa de firma digital. | Servicio web externo |
| **Sisu** | Sistema de cartera de Comfaca. | Servicio web interno |
| **FirmaPlus** | Proveedor alterno de firma digital. | Servicio web externo |
| **FlaskPDF** | Microservicio de generación de PDF. | Servicio web interno |
| **SMTP** | Servidor de correo saliente (notificaciones). | Servicio de correo |
| **Mercurio** | Sistema de administración de productos y afiliados. | Servicio web externo |
| **SFTP** | Almacenamiento remoto de documentos firmados. | Servicio de archivos |

---

## 4. Arquitectura funcional de alto nivel

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Capa de presentación                            │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │ /solicitar-credito   │  │ /dash                │  │ /admin       │ │
│  │ - Simulador          │  │ - Wizard solicitud   │  │ - Cola       │ │
│  │ - Captura datos      │  │ - Mis solicitudes    │  │ - Detalle    │ │
│  │ - Publico            │  │ - Documentos         │  │ - Firmantes  │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Capa de API (Nitro / H3)                            │
│                                                                        │
│  /api/auth/*  /api/solicitudes/*  /api/codeudores/*  /api/admin/*      │
│  /api/public/*  /api/validacion/*  /api/notifications/*                │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Capa de servicios de negocio                           │
│                                                                        │
│  postulacion-solicitud  codigo-firma  kiai-firmado                     │
│  api-sisu  api-firmaplus  api-flaskpdf  smtp-mailer  sftp-client       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Capa de persistencia (Prisma + MariaDB)                │
│                                                                        │
│  22 modelos Prisma en ./generated/prisma                               │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Worker de polling (Nohup)                          │
│                                                                        │
│  server/nohup/app.ts — sincroniza KIAI cada 5 minutos                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## PARTE II — REQUERIMIENTOS FUNCIONALES

## 5. Catálogo de requerimientos funcionales

### RF-01 — Registro y autenticación

**Descripción:** El sistema debe permitir a los usuarios autenticarse y mantener una sesión segura.

**Detalle:**

- **RF-01.1 — Login con email + contraseña:** Los usuarios (solicitantes y administradores) se autentican con `email` y `password`. La contraseña se valida contra bcrypt/argon2.
- **RF-01.2 — Sesión JWT con maxAge de 8 horas:** El servidor emite un JWT firmado con `NUXT_JWT_SECRET`. La sesión expira automáticamente.
- **RF-01.3 — Renovación silenciosa:** Si la sesión es válida, el servidor la renueva en cada request sin invalidar.
- **RF-01.4 — Logout:** El endpoint `DELETE /api/auth/session` invalida el JWT cliente.
- **RF-01.5 — Codeudor OTP:** Los codeudores NO tienen usuario en el sistema. Reciben un OTP por email/SMS y se autentican vía token efímero.
- **RF-01.6 — Middleware server-side:** Toda ruta `/api/admin/*` valida la sesión y rol; toda ruta `/api/public/*` solo valida token (cuando aplique).

**Criterios de aceptación:**

- CA-1: Usuario registrado puede iniciar sesión con credenciales válidas y recibe JWT.
- CA-2: Credenciales inválidas devuelven HTTP 401 con mensaje genérico.
- CA-3: Solicitud a `/api/admin/*` sin sesión válida devuelve HTTP 401.
- CA-4: Codeudor recibe OTP y puede autenticarse por token.

**Endpoints:** `POST /api/auth/authenticate`, `GET /api/auth/session`, `DELETE /api/auth/session`, `POST /api/auth/codeudor/otp`.

**Modelos:** `usuarios`, `sessions`, `usuarios_codeudores`, `codeudor_otp`.

---

### RF-02 — Simulación de crédito

**Descripción:** El sistema debe permitir a usuarios no autenticados simular un crédito antes de iniciar el proceso formal.

**Detalle:**

- **RF-02.1 — Inputs:** Tipo de crédito (Consumo/Microcrédito/Educativo), monto, plazo (meses), fecha de nacimiento (para prueba de vida), ingresos mensuales, egresos mensuales.
- **RF-02.2 — Cálculo:** Cuota mensual, total a pagar, tasa de interés efectiva, valor total del seguro (si aplica).
- **RF-02.3 — Catálogo de productos:** Las tasas y plazos válidos se cargan desde el sistema externo Mercurio.
- **RF-02.4 — Sin persistencia:** El resultado NO se guarda en BD. Es solo informativo.

**Criterios de aceptación:**

- CA-1: El simulador devuelve cuota, plazo, tasa y total a pagar en <500 ms.
- CA-2: Si los inputs son inválidos (plazo > máximo, monto > máximo), retorna 400 con detalle.

**Endpoint:** `POST /api/solicitudes/simular`.

**Modelo:** Ninguno (solo lectura de productos).

---

### RF-03 — Radicación de solicitud

**Descripción:** El sistema debe permitir a un solicitante registrado crear y guardar una solicitud de crédito.

**Detalle:**

- **RF-03.1 — Wizard de 10 pasos:** Simulación → tipo crédito → datos personales → datos del crédito → confirmación → documentos → revisión → envío.
- **RF-03.2 — Pre-llenado de datos:** Los datos personales del solicitante se prellenan desde su perfil de usuario.
- **RF-03.3 — Generación de radicado:** Al guardar, se genera un identificador único formato `000007-2026-03` (6 dígitos + año + secuencia del mes).
- **RF-03.4 — Inserción transaccional:** La solicitud, el solicitante, los datos del crédito, los documentos y el payload se insertan como un bloque consistente.
- **RF-03.5 — Estados iniciales:** La solicitud queda en `DOCUMENTOS_CARGADOS` tras la primera carga completa; al enviar pasa a `ENVIADO_VALIDACION`.
- **RF-03.6 — Adjunto:** Los solicitantes pueden guardar borradores (estado `FORMULARIO` o `BORRADOR`) y volver más tarde.

**Criterios de aceptación:**

- CA-1: El solicitante puede recorrer el wizard completo y enviar la solicitud.
- CA-2: Cada paso valida con Zod antes de avanzar.
- CA-3: El radicado es único y se muestra al solicitante al enviar.
- CA-4: El wizard soporta retroceso sin pérdida de datos (state machine).

**Endpoints:** `POST /api/solicitudes/numero-disponible`, `POST /api/solicitudes/guardar-solicitud`, `POST /api/solicitudes/actualizar-solicitud`, `POST /api/solicitudes/enviar-solicitud/{slug}`.

**Modelos:** `solicitudes_credito`, `solicitud_solicitante`, `solicitud_datos_credito`, `solicitud_payload`, `solicitud_timeline`, `numero_solicitudes`.

---

### RF-04 — Vinculación de codeudores

**Descripción:** El sistema debe permitir al solicitante vincular uno o varios codeudores a su solicitud.

**Detalle:**

- **RF-04.1 — Datos del codeudor:** Tipo y número de documento, nombre completo, parentesco, email, teléfono.
- **RF-04.2 — Autenticación OTP:** El codeudor recibe un código de 6 dígitos por email/SMS; tras validarlo, queda vinculado.
- **RF-04.3 — Código de firma:** Una vez vinculado, el codeudor recibe un código único de firma.
- **RF-04.4 — Replicación de datos:** Si el codeudor completa su perfil, sus datos personales se replican a la solicitud.
- **RF-04.5 — Eliminación:** El solicitante puede desvincular un codeudor antes del envío a validación.

**Criterios de aceptación:**

- CA-1: El solicitante puede vincular hasta N codeudores (N configurable, default 3).
- CA-2: El OTP expira a los 15 minutos.
- CA-3: El codeudor puede consultar su perfil tras autenticarse con OTP.

**Endpoints:** `POST /api/codeudores`, `DELETE /api/codeudores/{id}`, `POST /api/codeudores/{id}/confirmar`, `GET /api/codeudores/{id}/responsabilidades`.

**Modelos:** `usuarios_codeudores`, `codeudor_otp`.

---

### RF-05 — Carga de documentos

**Descripción:** El sistema debe permitir al solicitante cargar los documentos de soporte requeridos para la solicitud.

**Detalle:**

- **RF-05.1 — Tipos de documento:** Cédula frontal/posterior, desprendible de pago, recibo de servicio público, certificado laboral, etc. Lista cerrada por tipo de crédito.
- **RF-05.2 — Validación:** Tamaño máximo (10 MB), MIME válido (PDF/JPG/PNG), nombre de archivo seguro.
- **RF-05.3 — Almacenamiento:** Los archivos se guardan en `storage/documents/{numero_solicitud}/{uuid}.{ext}`.
- **RF-05.4 — Metadatos:** Cada archivo guarda en `solicitud_documentos`: tipo, nombre original, ruta, tamaño, mime, hash.
- **RF-05.5 — Soft-delete:** Los documentos se marcan `deleted_at` sin borrar el archivo físico.
- **RF-05.6 — Documentos obligatorios:** El sistema impide el envío a validación si faltan documentos obligatorios.

**Criterios de aceptación:**

- CA-1: El solicitante puede subir, listar y eliminar sus documentos.
- CA-2: El sistema rechaza archivos > 10 MB o con MIME no permitido.
- CA-3: El sistema marca documentos faltantes antes del envío.

**Endpoints:** `POST /api/solicitudes/{id}/documentos`, `GET /api/solicitudes/{id}/documentos`, `DELETE /api/solicitudes/{id}/documentos/{docId}`.

**Modelo:** `solicitud_documentos`.

---

### RF-06 — Envío a validación

**Descripción:** El sistema debe permitir al solicitante enviar su solicitud al equipo de validación interna una vez completada.

**Detalle:**

- **RF-06.1 — Pre-condiciones:** Documentos obligatorios cargados, codeudor(es) vinculado(s) (si aplica), formulario completo.
- **RF-06.2 — Generación de PDF:** Antes del envío, se genera el PDF de la solicitud vía FlaskPDF.
- **RF-06.3 — Transición de estado:** La solicitud pasa de `DOCUMENTOS_CARGADOS` a `ENVIADO_VALIDACION`.
- **RF-06.4 — Bloqueo de edición:** Tras el envío, no se permite editar el formulario ni los documentos.
- **RF-06.5 — Notificación:** Se notifica al solicitante del envío exitoso.

**Criterios de aceptación:**

- CA-1: El sistema impide el envío si faltan pre-condiciones.
- CA-2: El PDF generado se almacena en `pdfs_generados` con ruta accesible.
- CA-3: La transición de estado se registra en `solicitud_timeline`.

**Endpoint:** `GET /api/solicitudes/enviar-solicitud/{slug}`.

**Modelos:** `solicitudes_credito`, `pdfs_generados`, `solicitud_timeline`.

---

### RF-07 — Aprobación / rechazo / desestimación

**Descripción:** El sistema debe permitir al administrador tomar decisiones sobre las solicitudes recibidas.

**Detalle:**

- **RF-07.1 — Estados terminales posibles:** `APROBADA`, `RECHAZADA`, `DESESTIMADA`, `CANCELADA`, `DESISTE`.
- **RF-07.2 — Validación de transición:** El sistema valida que el estado actual permita la transición (ver §12).
- **RF-07.3 — Comentarios:** El administrador puede añadir un comentario libre al cambiarlo.
- **RF-07.4 — Notificación:** El solicitante recibe una notificación por cada cambio de estado.
- **RF-07.5 — Timeline:** Cada cambio se registra con `usuario_username`, `automatico: false`, descripción.

**Criterios de aceptación:**

- CA-1: Solo usuarios con rol `admin` pueden cambiar el estado.
- CA-2: Transiciones inválidas devuelven HTTP 400.
- CA-3: El solicitante es notificado en cada transición.

**Endpoint:** `PUT /api/admin/solicitudes/{id}/estado`.

**Modelos:** `solicitudes_credito`, `solicitud_timeline`, `notifications`.

---

### RF-08 — Gestión de firmantes

**Descripción:** El sistema debe permitir al administrador configurar la lista de firmantes que firmarán digitalmente la solicitud.

**Detalle:**

- **RF-08.1 — Datos del firmante:** Tipo y número de documento, nombre completo, email (obligatorio), teléfono, orden, rol.
- **RF-08.2 — Orden explícito:** Cada firmante tiene un `orden` único dentro de la solicitud; KIAI firma en ese orden (secuencial).
- **RF-08.3 — Reemplazo total:** El endpoint PUT reemplaza TODOS los firmantes en una sola operación.
- **RF-08.4 — Eliminación:** El endpoint DELETE elimina todos los firmantes (no hay eliminación individual).
- **RF-08.5 — Bloqueo si proceso activo:** Si hay un proceso KIAI en `DRAFT/PENDING/IN_PROGRESS/COMPLETED`, no se permite modificar firmantes.

**Criterios de aceptación:**

- CA-1: Todos los firmantes tienen email válido.
- CA-2: El orden es secuencial sin saltos.
- CA-3: La operación retorna HTTP 409 si hay proceso KIAI activo.

**Endpoints:** `GET /api/admin/solicitudes/{id}/firmantes`, `PUT /api/admin/solicitudes/{id}/firmantes`, `DELETE /api/admin/solicitudes/{id}/firmantes`.

**Modelo:** `firmantes_solicitud`.

---

### RF-09 — Carga de anexos

**Descripción:** El sistema debe permitir al administrador subir documentos adicionales (anexos) como referencia para el firmante.

**Detalle:**

- **RF-09.1 — Tipos permitidos:** Pagaré, carta de instrucciones, oficio, autorización. Whitelist cerrada.
- **RF-09.2 — Validación:** Solo PDF, max 10 MB, tipo válido.
- **RF-09.3 — Almacenamiento:** `storage/anexos/{numero_solicitud}/{uuid}.pdf`.
- **RF-09.4 — Orden implícito:** El orden se calcula como max(orden) + 1 entre los activos.
- **RF-09.5 — Soft-delete:** Los anexos se marcan inactivos sin eliminar el archivo.
- **RF-09.6 — NO se incluyen en KIAI:** Los anexos NO se anexan al proceso KIAI. Son referencia.

**Criterios de aceptación:**

- CA-1: El asesor puede subir, listar, descargar y eliminar anexos.
- CA-2: El sistema rechaza tipos de anexo no permitidos.
- CA-3: Los anexos NO afectan al proceso KIAI.

**Endpoints:** `GET /api/admin/solicitudes/{id}/anexos`, `POST /api/admin/solicitudes/{id}/anexos`, `GET /api/admin/solicitudes/{id}/anexos/{anexoId}/descargar`, `DELETE /api/admin/solicitudes/{id}/anexos/{anexoId}`.

**Modelo:** `firmar_anexos`.

---

### RF-10 — Inicio del proceso de firma digital

**Descripción:** El sistema debe permitir al administrador enviar la solicitud aprobada a firma digital vía KIAI.

**Detalle:**

- **RF-10.1 — Pre-condiciones:** Solicitud en estado `APROBADA`, con PDF generado y al menos un firmante con email.
- **RF-10.2 — Sin proceso KIAI activo:** No debe existir proceso en `DRAFT/PENDING/IN_PROGRESS/COMPLETED`.
- **RF-10.3 — Construcción del payload:** Mapeo de Comfaca → KIAI (ver Apéndice A de `approval-signing-process.md`).
- **RF-10.4 — Creación en KIAI:** Llamada a `POST /api/processes` con autenticación OAuth2 client_credentials.
- **RF-10.5 — Registro local:** INSERT en `procesos_firma` con snapshot completo.
- **RF-10.6 — Transición de estado:** La solicitud pasa a `PENDIENTE_FIRMADO`.
- **RF-10.7 — Timeline:** Se registra con detalle `transaccion_id` y proveedor (`KIAI` o `FirmaPlus`).
- **RF-10.8 — Deadline de 7 días:** KIAI expira automáticamente el proceso a los 7 días.

**Criterios de aceptación:**

- CA-1: El sistema rechaza el inicio si hay proceso KIAI activo (HTTP 409).
- CA-2: El sistema rechaza si no hay PDF o no hay firmantes con email.
- CA-3: El timeline registra el `transaccion_id` de KIAI.

**Endpoint:** `POST /api/admin/solicitudes/{id}/iniciar-firmado`.

**Modelos:** `procesos_firma`, `firmantes_solicitud`, `solicitudes_credito`, `solicitud_timeline`.

---

### RF-11 — Firma digital por el firmante

**Descripción:** El sistema debe permitir al firmante revisar la solicitud y firmarla digitalmente.

**Detalle:**

- **RF-11.1 — Link público:** KIAI envía un email con un link al firmante.
- **RF-11.2 — Autenticación OTP:** El firmante se autentica con un OTP enviado a su email.
- **RF-11.3 — Revisión del PDF:** El firmante ve el PDF antes de firmar.
- **RF-11.4 — Firma con CLICK:** Tipo de firma "click-to-sign" (no requiere certificado digital del firmante).
- **RF-11.5 — Secuencial:** Si hay N firmantes, el de orden N+1 solo es invitado tras firmar el N.
- **RF-11.6 — Endpoint público Comfaca:** El firmante puede previsualizar la solicitud vía `GET /api/public/firma/{token}` (sin login, con token cifrado).

**Criterios de aceptación:**

- CA-1: El token público expira a los 7 días (configurable).
- CA-2: El endpoint público valida la coincidencia del número de identificación.
- CA-3: Tras la firma, KIAI notifica al siguiente firmante (secuencial).

**Endpoints:** `GET /api/public/firma/{token}`, lógica interna KIAI.

**Modelos:** `solicitudes_credito`, `firmantes_solicitud`, `solicitud_solicitante`.

---

### RF-12 — Sincronización con KIAI

**Descripción:** El sistema debe consultar periódicamente el estado de los procesos KIAI y sincronizarlos con el estado local.

**Detalle:**

- **RF-12.1 — Worker en background:** Proceso `nohup` ejecutado en paralelo con Nitro.
- **RF-12.2 — Intervalo de 5 minutos:** El ciclo consulta todas las solicitudes en `PENDIENTE_FIRMADO` cada 5 min.
- **RF-12.3 — Exclusión de simulaciones:** Los procesos con `simulado=true` se omiten.
- **RF-12.4 — Worker thread por solicitud:** Cada consulta se ejecuta en un worker thread independiente.
- **RF-12.5 — Transacción:** La actualización de `procesos_firma` + `solicitudes_credito` + `solicitud_timeline` es transaccional.
- **RF-12.6 — Mapeo KIAI → solicitud:** COMPLETED→FIRMADO, DECLINED→RECHAZADA, CANCELLED→APROBADA, EXPIRED→APROBADA.

**Criterios de aceptación:**

- CA-1: El worker nohup inicia con `pnpm nohup:firmas` y se mantiene vivo.
- CA-2: Tras KIAI marcar un proceso como `COMPLETED`, la solicitud local pasa a `FIRMADO` en menos de 5 minutos.
- CA-3: Si hay fallo de red con KIAI, el worker reintenta en el siguiente ciclo.

**Endpoint:** `pnpm nohup:firmas` (no es un endpoint HTTP, es un proceso de larga duración).

**Modelos:** `procesos_firma`, `solicitudes_credito`, `solicitud_timeline`.

---

### RF-13 — Cancelación / descarte

**Descripción:** El sistema debe permitir al administrador cancelar un proceso de firma en curso o descartar una simulación.

**Detalle:**

- **RF-13.1 — Cancelar proceso KIAI real:** `POST /cancelar-firmado` cancela el proceso en KIAI (DELETE) y localmente.
- **RF-13.2 — Descartar simulación:** `POST /descartar-simulacion` solo aplica a procesos `simulado=true`.
- **RF-13.3 — Estado tras cancelar:** La solicitud vuelve a `APROBADA`, lista para reenviar a firma.
- **RF-13.4 — Motivo:** El administrador puede añadir un motivo de cancelación (max 500 chars).
- **RF-13.5 — Bloqueo:** No se puede cancelar un proceso ya terminal (`COMPLETED`, `DECLINED`, `EXPIRED`, `CANCELLED`).

**Criterios de aceptación:**

- CA-1: El sistema devuelve HTTP 400 si el proceso ya está terminal.
- CA-2: La cancelación registra el motivo en `solicitud_timeline`.
- CA-3: Tras cancelar, la solicitud puede iniciar un nuevo proceso de firma.

**Endpoints:** `POST /api/admin/solicitudes/{id}/cancelar-firmado`, `POST /api/admin/solicitudes/{id}/descartar-simulacion`.

**Modelos:** `procesos_firma`, `solicitudes_credito`, `solicitud_timeline`.

---

### RF-14 — Listado y consulta de solicitudes

**Descripción:** El sistema debe permitir consultar solicitudes por solicitante y por administrador con distintos filtros.

**Detalle:**

- **RF-14.1 — Listado por solicitante:** `/dash/solicitudes` muestra solo las solicitudes del solicitante autenticado.
- **RF-14.2 — Listado por administrador:** `/admin/solicitudes` muestra todas las solicitudes con paginación y filtros.
- **RF-14.3 — Filtros disponibles:** Estado, fecha de creación, solicitante (solo admin), tipo de crédito.
- **RF-14.4 — Detalle de solicitud:** Vista detallada con solicitante, datos del crédito, documentos, timeline, firmantes, procesos de firma.
- **RF-14.5 — Paginación:** Límite configurable (default 25), offset para navegación.

**Criterios de aceptación:**

- CA-1: El solicitante ve solo sus solicitudes.
- CA-2: El administrador ve todas las solicitudes con paginación.
- CA-3: Los filtros son combinables.

**Endpoints:** `GET /api/solicitudes/mis-solicitudes`, `GET /api/admin/solicitudes`, `GET /api/admin/solicitudes/{id}`.

**Modelos:** `solicitudes_credito`, `solicitud_solicitante`, `firmantes_solicitud`, `procesos_firma`.

---

### RF-15 — Generación de PDF

**Descripción:** El sistema debe generar un PDF de la solicitud con los datos completos para anexar al proceso KIAI.

**Detalle:**

- **RF-15.1 — Microservicio FlaskPDF:** Servicio Python que recibe HTML + datos y retorna PDF binario.
- **RF-15.2 — Plantilla:** HTML configurable con marcadores para datos dinámicos.
- **RF-15.3 — Almacenamiento:** El PDF se guarda en `storage/pdfs/{numero_solicitud}/{uuid}.pdf`.
- **RF-15.4 — Registro:** INSERT en `pdfs_generados` con `solicitud_id`, `filename`, `path`, `mime`, `size`.
- **RF-15.5 — Codificación:** El PDF se codifica en base64 para enviarse a KIAI.
- **RF-15.6 — Re-generación:** El sistema puede regenerar el PDF si los datos cambian (mientras no esté en `PENDIENTE_FIRMADO`).

**Criterios de aceptación:**

- CA-1: El PDF se genera en <5 segundos.
- CA-2: El PDF contiene todos los datos del solicitante y del crédito.
- CA-3: La ruta del PDF se mantiene en `pdfs_generados.path`.

**Endpoint:** `POST /api/admin/pdf/generar` (interno, llamado desde enviar-solicitud e iniciar-firmado).

**Modelos:** `pdfs_generados`.

---

### RF-16 — Integración con Sisu (cartera)

**Descripción:** El sistema debe sincronizar la solicitud con el sistema de cartera Sisu una vez aprobada y firmada.

**Detalle:**

- **RF-16.1 — Envío a Sisu:** Tras `FIRMADO`, se llama a Sisu con los datos de la solicitud.
- **RF-16.2 — Autenticación:** OAuth2 client_credentials con Sisu.
- **RF-16.3 — Payload:** Mapeo de campos Comfaca → Sisu (ver `process-model.md` §9).
- **RF-16.4 — Estados Sisu:** `RADICADA`, `EN_ESTUDIO`, `APROBADA`, `NEGADA`, `DESISTIDA`, `LEGALIZADA`.
- **RF-16.5 — Webhooks:** Sisu puede llamar de vuelta para actualizar el estado local (si está implementado).
- **RF-16.6 — Modo simulación:** En dev, el envío a Sisu se simula retornando éxito inmediato.

**Criterios de aceptación:**

- CA-1: El envío se registra en `solicitud_timeline`.
- CA-2: La solicitud Sisu mantiene el `numero_solicitud` Comfaca como `externalReference`.

**Endpoint:** `GET /api/solicitudes/enviar-solicitud/{slug}` (tras enviar a Sisu genera PDF final).

**Modelo:** Ninguno local (Sisu mantiene el registro).

---

### RF-17 — Notificaciones

**Descripción:** El sistema debe notificar a los solicitantes sobre eventos relevantes de su solicitud.

**Detalle:**

- **RF-17.1 — Tabla `notifications`:** Polimórfica con `notifiable_type`, `notifiable_id`, `type`, `data` JSON, `read_at`.
- **RF-17.2 — Eventos que disparan notificaciones:**
  - Cambio de estado (`PUT /api/admin/solicitudes/{id}/estado`).
  - Vinculación de codeudor.
  - Firma completada (en algunos casos).
  - Cancelación.
- **RF-17.3 — Lectura desde frontend:** Polling al endpoint de notificaciones.
- **RF-17.4 — Marcar como leída:** `PATCH /api/notifications/{id}` actualiza `read_at`.

**Criterios de aceptación:**

- CA-1: Toda transición de estado genera una notificación.
- CA-2: El solicitante puede marcar notificaciones como leídas.

**Endpoints:** `GET /api/notifications`, `PATCH /api/notifications/{id}`.

**Modelo:** `notifications`.

---

### RF-18 — Administración y RBAC

**Descripción:** El sistema debe permitir a los administradores gestionar solicitudes y roles.

**Detalle:**

- **RF-18.1 — Roles disponibles:** `admin`, `user` (solicitante), `guest` (sin sesión). Ver `data-model.md` §3.
- **RF-18.2 — Permisos por rol:**
  - `admin`: acceso total a `/admin/*`, ve todas las solicitudes.
  - `user`: solo `/dash/*`, ve sus propias solicitudes.
  - `guest`: solo rutas públicas (`/`, `/solicitar-credito`).
- **RF-18.3 — Middleware:** `server/middleware/auth.ts` valida sesión; `server/middleware/admin.ts` valida rol.
- **RF-18.4 — Catálogos:** Los roles están en el enum `roles_enum` y se asignan en `usuarios.rol_id`.

**Criterios de aceptación:**

- CA-1: Toda ruta `/api/admin/*` requiere rol `admin` (HTTP 403 si no).
- CA-2: Toda ruta `/api/dash/*` requiere sesión válida.

**Endpoints:** middleware-level (no son endpoints específicos).

**Modelos:** `roles`, `usuarios`.

---

## PARTE III — REQUERIMIENTOS NO FUNCIONALES

## 6. Catálogo de requerimientos no funcionales

### RNF-01 — Rendimiento

| ID | Descripción | Métrica |
|---|---|---|
| RNF-01.1 | Tiempo de respuesta API p95 | <500 ms |
| RNF-01.2 | Tiempo de respuesta wizard step save | <800 ms |
| RNF-01.3 | Tiempo de generación de PDF | <5 s |
| RNF-01.4 | Tiempo de carga inicial (TTFB) | <1.5 s |
| RNF-01.5 | Consultas Prisma con JOIN | <100 ms (tablas <10K filas) |
| RNF-01.6 | Polling KIAI por ciclo | <30 s (50 solicitudes) |
| RNF-01.7 | Carga de documentos | <2 s (archivo 5 MB) |

### RNF-02 — Seguridad

| ID | Descripción | Implementación |
|---|---|---|
| RNF-02.1 | Contraseñas hasheadas | bcrypt o argon2 (configurado en `docs/configurations.md`) |
| RNF-02.2 | Sesiones JWT firmadas | `NUXT_JWT_SECRET` (HS256 o RS256) |
| RNF-02.3 | HTTPS obligatorio | Configurado en proxy (Nginx/Traefik) |
| RNF-02.4 | CORS restrictivo | Solo orígenes permitidos en `runtimeConfig.cors` |
| RNF-02.5 | Rate limiting | `server/middleware/validateSolicitudLimit.ts` |
| RNF-02.6 | Validación de inputs | Zod en todos los endpoints |
| RNF-02.7 | Variables secretas | `[REDACTED]` en `.env`, NO se commitean |
| RNF-02.8 | SQL injection | Prisma ORM (consultas parametrizadas) |
| RNF-02.9 | Tokens públicos cifrados | AES con `API_FIRMA_KEY` |
| RNF-02.10 | Auditoría | `solicitud_timeline` con `automatico`, `usuario_username` |

### RNF-03 — Disponibilidad

| ID | Descripción | Métrica |
|---|---|---|
| RNF-03.1 | Uptime objetivo | 99.5% (sistema auxiliar; Sisu es sistema core) |
| RNF-03.2 | Recovery time (RTO) | <30 minutos |
| RNF-03.3 | Recovery point (RPO) | <5 minutos (logs y BD) |
| RNF-03.4 | Worker nohup auto-restart | systemd o supervisor |
| RNF-03.5 | Graceful shutdown | SIGINT/SIGTERM cierran limpiamente |

### RNF-04 — Auditabilidad

| ID | Descripción | Implementación |
|---|---|---|
| RNF-04.1 | Bitácora de cambios de estado | `solicitud_timeline` |
| RNF-04.2 | Bitácora de carga de documentos | `solicitud_documentos.created_at` |
| RNF-04.3 | Bitácora de creación de procesos KIAI | `procesos_firma.created_at` + `respuesta` snapshot |
| RNF-04.4 | Bitácora de cancelación | `procesos_firma.cancelado_en`, `motivo_cancelacion` |
| RNF-04.5 | Logs estructurados | `loggerService` con contexto |
| RNF-04.6 | Snapshots KIAI completos | `procesos_firma.respuesta` JSON |

### RNF-05 — Portabilidad y ambientes

| ID | Descripción | Notas |
|---|---|---|
| RNF-05.1 | Tres ambientes | dev, stage, pro |
| RNF-05.2 | Configuración por env | `STAGE` + `DATABASE_ENV`, `API_SISU_ENV`, `API_FIRMA_ENV`, `API_FLASKPDF_ENV`, `KIAI_ENV` |
| RNF-05.3 | URLs dev vs pro | Patrón `_dev`/`_pro` en cada API |
| RNF-05.4 | Simulación | `KIAI_SIMULATION=true` en dev, `false` en pro |
| RNF-05.5 | Node version | 22.x (definido en `.github/workflows/ci.yml`) |
| RNF-05.6 | Package manager | pnpm (lockfile commiteado) |

### RNF-06 — Mantenibilidad

| ID | Descripción | Implementación |
|---|---|---|
| RNF-06.1 | Cobertura de tests | lines ≥80%, functions ≥80%, branches ≥75%, statements ≥80% |
| RNF-06.2 | Lint | ESLint con `stylistic` config |
| RNF-06.3 | Type-check | `pnpm typecheck` ejecuta `tsc --noEmit` |
| RNF-06.4 | Convenciones | `docs/conventions.md` |
| RNF-06.5 | Nomenclatura | snake_case en BD, camelCase en código |
| RNF-06.6 | Comentarios | en inglés, mensajes de commit en español |
| RNF-06.7 | Estructura modular | `server/services/*` separados por dominio |
| RNF-06.8 | Documentación | 7 archivos markdown en `docs/` |

### RNF-07 — Internacionalización y localización

| ID | Descripción | Notas |
|---|---|---|
| RNF-07.1 | Idioma de interfaz | Español (es-CO) |
| RNF-07.2 | Idioma de logs y mensajes de error | Español |
| RNF-07.3 | Idioma del código (variables, funciones) | Inglés |
| RNF-07.4 | Zona horaria | America/Bogota (UTC-5) |
| RNF-07.5 | Formato de fecha | DD/MM/YYYY (UI), ISO 8601 (API) |
| RNF-07.6 | Moneda | COP, separador de miles con `.`, decimales con `,` |

### RNF-08 — Compatibilidad

| ID | Descripción | Notas |
|---|---|---|
| RNF-08.1 | Navegadores | Chrome 100+, Firefox 100+, Safari 15+, Edge 100+ |
| RNF-08.2 | Dispositivos | Desktop y tablet (responsive, mobile no prioritario) |
| RNF-08.3 | Resolución mínima | 1280x720 |
| RNF-08.4 | Runtime | Nuxt 4 + Vue 3.5 + Node 22 |
| RNF-08.5 | Base de datos | MariaDB 10.5+ (compatible con MySQL 8) |
| RNF-08.6 | OS soportado | Linux (pro), Mac/Windows (dev) |

---

## PARTE IV — CASOS DE USO

## 7. Catálogo de casos de uso

| CU | Título | Actor principal | RF |
|---|---|---|---|
| CU-001 | Iniciar sesión | Solicitante, Asesor | RF-01 |
| CU-002 | Simular crédito | Visitante, Solicitante | RF-02 |
| CU-003 | Radicar solicitud de crédito | Solicitante | RF-03 |
| CU-004 | Vincular codeudor | Solicitante, Codeudor | RF-04 |
| CU-005 | Cargar documentos de soporte | Solicitante | RF-05 |
| CU-006 | Enviar solicitud a validación | Solicitante | RF-06 |
| CU-007 | Aprobar / rechazar / desestimar solicitud | Asesor | RF-07 |
| CU-008 | Gestionar firmantes | Asesor | RF-08 |
| CU-009 | Cargar anexos | Asesor | RF-09 |
| CU-010 | Iniciar proceso de firma KIAI | Asesor | RF-10 |
| CU-011 | Firmar digitalmente (firmante) | Firmante | RF-11 |
| CU-012 | Sincronizar estado KIAI (worker) | Sistema | RF-12 |
| CU-013 | Cancelar proceso de firma | Asesor | RF-13 |
| CU-014 | Listar mis solicitudes (solicitante) | Solicitante | RF-14 |
| CU-015 | Listar solicitudes pendientes (administrador) | Asesor | RF-14 |
| CU-016 | Generar PDF de la solicitud | Sistema | RF-15 |
| CU-017 | Sincronizar con Sisu | Sistema | RF-16 |
| CU-018 | Recibir notificación de estado | Solicitante | RF-17 |

---

## 8. Matriz actor × caso de uso

| Caso de uso | Solicitante | Asesor | Codeudor | Firmante | Sistema | Visitante |
|---|---|---|---|---|---|---|
| CU-001 Iniciar sesión | X | X | | | | |
| CU-002 Simular crédito | X | | | | | X |
| CU-003 Radicar solicitud | X | | | | | |
| CU-004 Vincular codeudor | X | | X | | | |
| CU-005 Cargar documentos | X | | | | | |
| CU-006 Enviar a validación | X | | | | | |
| CU-007 Aprobar / rechazar | | X | | | | |
| CU-008 Gestionar firmantes | | X | | | | |
| CU-009 Cargar anexos | | X | | | | |
| CU-010 Iniciar firma KIAI | | X | | | | |
| CU-011 Firmar digitalmente | | | | X | | |
| CU-012 Sincronizar KIAI | | | | | X | |
| CU-013 Cancelar firma | | X | | | | |
| CU-014 Listar mis solicitudes | X | | | | | |
| CU-015 Listar solicitudes admin | | X | | | | |
| CU-016 Generar PDF | | | | | X | |
| CU-017 Sincronizar Sisu | | | | | X | |
| CU-018 Recibir notificación | X | | | | | |

---

## 9. Diagramas de casos de uso

```
                            ┌─────────────────────────────────┐
                            │        Sistema Comfaca          │
                            │         Créditos                │
                            └─────────────────────────────────┘
                                       │
   ┌─────────────────┐                 │                  ┌──────────────────┐
   │   Solicitante   │─CU-001──────────┼──────────────────│     Asesor       │
   │                 │─CU-002──────────┼─CU-007───────────│                  │
   │                 │─CU-003──────────┼─CU-008───────────│                  │
   │                 │─CU-005──────────┼─CU-009───────────│                  │
   │                 │─CU-006──────────┼─CU-010───────────│                  │
   │                 │─CU-014──────────┼─CU-013───────────│                  │
   │                 │─CU-018──────────┼─CU-015───────────│                  │
   └─────────────────┘                 │                  └──────────────────┘
                                       │
                                       │
   ┌─────────────────┐                 │                  ┌──────────────────┐
   │   Codeudor      │─CU-004──────────┼─CU-011───────────│   Firmante       │
   │                 │                 │                  │   (KIAI)         │
   └─────────────────┘                 │                  └──────────────────┘
                                       │
   ┌─────────────────┐                 │                  ┌──────────────────┐
   │   Visitante     │─CU-002──────────┼─CU-012───────────│    Sistema       │
   │                 │                 │─CU-016───────────│   (worker)       │
   │                 │                 │─CU-017───────────│                  │
   └─────────────────┘                 │                  └──────────────────┘
                                       │
                                       └─CU-018...─► (notificaciones a Solicitante)
```

---

## 10. Especificación detallada de casos de uso

Cada caso de uso se documenta con la plantilla: **actor, precondiciones, postcondiciones, flujo principal, flujos alternativos, excepciones, RF asociados, endpoints, modelos**.

---

### CU-001 — Iniciar sesión

**Actor:** Solicitante / Asesor

**Descripción:** El usuario inicia sesión con email y contraseña para acceder al sistema.

**Precondiciones:**
- El usuario está registrado en `usuarios`.
- La contraseña está hasheada en BD.

**Postcondiciones:**
- El usuario tiene sesión JWT válida por 8 horas.
- El usuario puede acceder a rutas según su rol.

**Flujo principal:**

1. El usuario navega a `/login`.
2. Ingresa email y contraseña.
3. El sistema valida credenciales con `POST /api/auth/authenticate`.
4. Si son válidas, el sistema crea un JWT y lo retorna.
5. El frontend guarda el JWT en cookie `auth-token`.
6. Redirige a `/dash` (solicitante) o `/admin` (asesor).

**Flujos alternativos:**

- 4a. Credenciales inválidas → mostrar error genérico "Email o contraseña incorrectos".

**Excepciones:**

- E1: Cuenta bloqueada → HTTP 423 Locked.
- E2: Email no registrado → HTTP 401 con mensaje genérico (no filtra existencia).

**RF asociados:** RF-01

**Endpoints:** `POST /api/auth/authenticate`, `GET /api/auth/session`, `DELETE /api/auth/session`.

---

### CU-003 — Radicar solicitud de crédito

**Actor:** Solicitante

**Descripción:** El solicitante recorre un wizard de 10 pasos y genera una solicitud radicada con identificador único.

**Precondiciones:**
- El solicitante está autenticado.
- El solicitante tiene datos personales completos en su perfil.

**Postcondiciones:**
- Existe un registro en `solicitudes_credito` con `radicado` único.
- Existen registros relacionados en `solicitud_solicitante`, `solicitud_datos_credito`, `solicitud_payload`.
- El timeline tiene al menos 2 entradas: creación y radicación.

**Flujo principal:**

1. El solicitante accede a `/dash/nueva-solicitud`.
2. Recorre los 10 pasos del wizard, completando datos.
3. Al finalizar, hace clic en "Guardar borrador" → estado `BORRADOR` o `FORMULARIO`.
4. Tras completar y cargar documentos, hace clic en "Enviar" → estado `ENVIADO_VALIDACION`.
5. El sistema genera PDF vía FlaskPDF.
6. El sistema registra el envío en `solicitud_timeline`.
7. El sistema notifica al solicitante.

**Flujos alternativos:**

- 3a. El solicitante puede guardar borrador parcial y volver más tarde.
- 4a. Si falta un documento obligatorio, el sistema impide el envío.

**Excepciones:**

- E1: Error de generación de PDF → HTTP 502; el sistema reintenta o notifica al admin.
- E2: Error de validación Zod → HTTP 400 con detalle por campo.

**RF asociados:** RF-03, RF-05, RF-06, RF-15.

**Endpoints:** `POST /api/solicitudes/numero-disponible`, `POST /api/solicitudes/guardar-solicitud`, `POST /api/solicitudes/actualizar-solicitud`, `GET /api/solicitudes/enviar-solicitud/{slug}`.

**Modelos:** `solicitudes_credito`, `solicitud_solicitante`, `solicitud_datos_credito`, `solicitud_payload`, `solicitud_timeline`, `numero_solicitudes`, `pdfs_generados`.

---

### CU-004 — Vincular codeudor

**Actor:** Solicitante / Codeudor

**Descripción:** El solicitante añade un codeudor a su solicitud y el codeudor se autentica vía OTP.

**Precondiciones:**
- El solicitante está autenticado.
- La solicitud está en estado `FORMULARIO` o `DOCUMENTOS_CARGADOS`.

**Postcondiciones:**
- Existe registro en `usuarios_codeudores`.
- El codeudor tiene un OTP válido (15 min).
- El codeudor tiene un código de firma único.

**Flujo principal:**

1. El solicitante abre la sección "Codeudores" de su solicitud.
2. Ingresa los datos del codeudor (doc, nombre, parentesco, email, teléfono).
3. El sistema crea el codeudor con estado `PENDIENTE` y genera OTP.
4. El sistema envía OTP por email y/o SMS.
5. El codeudor recibe el OTP e ingresa a `POST /api/codeudores/{id}/confirmar`.
6. Tras validar OTP, el codeudor queda en estado `CONFIRMADO`.
7. Opcionalmente, el codeudor completa su perfil y sus datos personales se replican a la solicitud.

**Flujos alternativos:**

- 4a. El codeudor no recibe el OTP → el solicitante puede reenviar.
- 6a. OTP expirado → solicitar uno nuevo.

**Excepciones:**

- E1: Email del codeudor inválido → HTTP 400.
- E2: Codeudor ya vinculado a otra solicitud activa → HTTP 409.

**RF asociados:** RF-04.

**Endpoints:** `POST /api/codeudores`, `GET /api/codeudores/{id}`, `POST /api/codeudores/{id}/confirmar`, `GET /api/codeudores/{id}/responsabilidades`.

**Modelos:** `usuarios_codeudores`, `codeudor_otp`.

---

### CU-005 — Cargar documentos de soporte

**Actor:** Solicitante

**Descripción:** El solicitante carga los documentos requeridos para su tipo de crédito.

**Precondiciones:**
- El solicitante está autenticado.
- La solicitud existe y está en estado editable (`FORMULARIO` o `DOCUMENTOS_CARGADOS`).

**Postcondiciones:**
- Cada documento cargado queda registrado en `solicitud_documentos` con su tipo y ruta.

**Flujo principal:**

1. El solicitante accede a la sección "Documentos" de su solicitud.
2. Selecciona el tipo de documento (cédula, desprendible, etc.).
3. Selecciona el archivo PDF/JPG/PNG de su dispositivo.
4. El sistema valida tamaño (max 10 MB), MIME y tipo.
5. El sistema guarda el archivo en `storage/documents/{radicado}/{uuid}.{ext}`.
6. El sistema crea el registro `solicitud_documentos`.
7. El solicitante ve la lista actualizada de documentos cargados.

**Flujos alternativos:**

- 4a. Archivo > 10 MB → HTTP 400 con detalle.
- 4b. Tipo de archivo no permitido → HTTP 400.

**Excepciones:**

- E1: Archivo corrupto → HTTP 400.
- E2: Solicitud en estado `ENVIADO_VALIDACION` o posterior → HTTP 403 (no se puede editar).

**RF asociados:** RF-05.

**Endpoints:** `POST /api/solicitudes/{id}/documentos`, `GET /api/solicitudes/{id}/documentos`, `DELETE /api/solicitudes/{id}/documentos/{docId}`.

**Modelo:** `solicitud_documentos`.

---

### CU-006 — Enviar solicitud a validación

**Actor:** Solicitante

**Descripción:** El solicitante envía su solicitud completa al equipo de validación interna.

**Precondiciones:**
- La solicitud tiene todos los documentos obligatorios.
- La solicitud tiene codeudores vinculados (si aplica).
- El formulario está completo.
- La solicitud está en estado `DOCUMENTOS_CARGADOS`.

**Postcondiciones:**
- La solicitud pasa a estado `ENVIADO_VALIDACION`.
- Se genera el PDF y se registra en `pdfs_generados`.
- Se registra en `solicitud_timeline`.
- Se notifica al solicitante.

**Flujo principal:**

1. El solicitante revisa el resumen de su solicitud.
2. Hace clic en "Enviar a validación".
3. El sistema valida pre-condiciones.
4. El sistema llama a FlaskPDF para generar el PDF.
5. El sistema guarda el PDF en `storage/pdfs/{radicado}/{uuid}.pdf`.
6. El sistema actualiza el estado a `ENVIADO_VALIDACION`.
7. El sistema registra en `solicitud_timeline` y crea notificación.

**Flujos alternativos:**

- 3a. Faltan documentos obligatorios → el sistema indica cuáles faltan.

**Excepciones:**

- E1: Error en FlaskPDF → HTTP 502; la solicitud permanece en `DOCUMENTOS_CARGADOS`.
- E2: Solicitud en estado no editable → HTTP 403.

**RF asociados:** RF-06, RF-15.

**Endpoints:** `GET /api/solicitudes/enviar-solicitud/{slug}`.

**Modelos:** `solicitudes_credito`, `pdfs_generados`, `solicitud_timeline`, `notifications`.

---

### CU-007 — Aprobar / rechazar / desestimar solicitud

**Actor:** Asesor

**Descripción:** El asesor revisa la solicitud y toma una decisión.

**Precondiciones:**
- El asesor está autenticado con rol `admin`.
- La solicitud está en estado `ENVIADO_VALIDACION`.

**Postcondiciones:**
- La solicitud pasa a `APROBADA`, `RECHAZADA`, `DESESTIMADA`, `CANCELADA` o `DESISTE`.
- Se registra en `solicitud_timeline`.
- Se notifica al solicitante.

**Flujo principal:**

1. El asesor abre `/admin/solicitudes/{id}`.
2. Revisa todos los datos: solicitante, crédito, documentos, timeline.
3. Toma decisión: aprobar, rechazar, desestimar.
4. Llama a `PUT /api/admin/solicitudes/{id}/estado` con `estado` y `descripcion`.
5. El sistema valida la transición.
6. El sistema actualiza el estado y registra en timeline.
7. El sistema crea notificación al solicitante.

**Flujos alternativos:**

- 4a. El asesor puede cancelar la solicitud si detecta que no debe procesarse.

**Excepciones:**

- E1: Estado no permite la transición → HTTP 400.
- E2: Sesión expirada → HTTP 401.

**RF asociados:** RF-07.

**Endpoint:** `PUT /api/admin/solicitudes/{id}/estado`.

**Modelos:** `solicitudes_credito`, `solicitud_timeline`, `notifications`.

---

### CU-008 — Gestionar firmantes

**Actor:** Asesor

**Descripción:** El asesor configura la lista de firmantes para la solicitud aprobada.

**Precondiciones:**
- El asesor está autenticado.
- La solicitud está en estado `APROBADA`.
- No hay proceso KIAI activo.

**Postcondiciones:**
- Los firmantes quedan registrados en `firmantes_solicitud` con orden.

**Flujo principal:**

1. El asesor abre `/admin/solicitudes/{id}/firmantes`.
2. Ve la lista actual de firmantes (vacía por defecto).
3. Añade firmantes con sus datos: documento, nombre, email, rol, orden, teléfono.
4. El sistema valida que todos tengan email.
5. El sistema guarda los firmantes en `firmantes_solicitud`.

**Flujos alternativos:**

- 3a. El asesor puede actualizar todos los firmantes en una sola operación (PUT reemplaza todo).
- 3b. El asesor puede eliminar todos los firmantes con un botón (DELETE).

**Excepciones:**

- E1: Email de un firmante inválido → HTTP 400.
- E2: Proceso KIAI activo → HTTP 409 (no se puede modificar).

**RF asociados:** RF-08.

**Endpoints:** `GET /api/admin/solicitudes/{id}/firmantes`, `PUT /api/admin/solicitudes/{id}/firmantes`, `DELETE /api/admin/solicitudes/{id}/firmantes`.

**Modelo:** `firmantes_solicitud`.

---

### CU-010 — Iniciar proceso de firma KIAI

**Actor:** Asesor

**Descripción:** El asesor envía la solicitud aprobada al proceso de firma digital externa.

**Precondiciones:**
- Solicitud en estado `APROBADA`.
- Al menos un firmante con email válido.
- PDF generado.
- Sin proceso KIAI activo.

**Postcondiciones:**
- La solicitud pasa a `PENDIENTE_FIRMADO`.
- Existe registro en `procesos_firma`.
- Se registra en `solicitud_timeline`.

**Flujo principal:**

1. El asesor abre la solicitud aprobada.
2. Verifica los firmantes y el PDF.
3. Hace clic en "Iniciar firma digital".
4. El sistema valida pre-condiciones.
5. El sistema reemplaza los firmantes con los del body.
6. El sistema construye el payload KIAI.
7. El sistema llama a KIAI `POST /api/processes`.
8. El sistema guarda el `procesos_firma` con snapshot completo.
9. El sistema actualiza la solicitud a `PENDIENTE_FIRMADO`.
10. El sistema registra en `solicitud_timeline`.

**Flujos alternativos:**

- 4a. Validación falla → HTTP 4xx con detalle.

**Excepciones:**

- E1: KIAI retorna error → HTTP 502; la solicitud permanece en `APROBADA`.
- E2: PDF no encontrado → HTTP 400.

**RF asociados:** RF-10.

**Endpoint:** `POST /api/admin/solicitudes/{id}/iniciar-firmado`.

**Modelos:** `procesos_firma`, `firmantes_solicitud`, `solicitudes_credito`, `solicitud_timeline`, `pdfs_generados`.

---

### CU-011 — Firmar digitalmente (firmante)

**Actor:** Firmante

**Descripción:** El firmante (titular o codeudor) revisa la solicitud y la firma digitalmente vía KIAI.

**Precondiciones:**
- Existe un proceso KIAI activo.
- El firmante tiene email válido registrado.
- El firmante ha recibido el email de KIAI con el link.

**Postcondiciones:**
- KIAI registra la firma del firmante.
- Si era el último firmante, el proceso pasa a `COMPLETED` y KIAI notifica a Comfaca vía webhook o polling.

**Flujo principal:**

1. KIAI envía email al firmante con link de firma.
2. El firmante hace clic en el link.
3. KIAI autentica al firmante vía OTP.
4. El firmante ve el PDF y los datos del campo.
5. El firmante hace clic en "Firmar".
6. KIAI registra la firma.
7. Si quedan más firmantes, KIAI notifica al siguiente (secuencial).

**Flujos alternativos:**

- 5a. El firmante rechaza la firma → el proceso KIAI pasa a `DECLINED`.

**Excepciones:**

- E1: OTP inválido → KIAI muestra error.
- E2: Proceso expirado (>7 días) → KIAI marca `EXPIRED`.

**RF asociados:** RF-11.

**Endpoint:** (Gestionado por KIAI) `GET /api/public/firma/{token}` para previsualización.

**Modelos:** KIAI mantiene el registro; Comfaca solo consulta vía polling.

---

### CU-012 — Sincronizar estado KIAI (worker)

**Actor:** Sistema

**Descripción:** El worker nohup consulta periódicamente a KIAI y sincroniza el estado de las solicitudes.

**Precondiciones:**
- El worker está ejecutándose (`pnpm nohup:firmas`).
- Hay conectividad con KIAI.

**Postcondiciones:**
- Los estados de `procesos_firma` están actualizados.
- Las solicitudes con estado KIAI terminal pasan al estado correspondiente.

**Flujo principal:**

1. El worker arranca al iniciar Nitro (manual o vía systemd).
2. Cada 5 minutos ejecuta el ciclo de sincronización.
3. Lee todas las solicitudes en estado `PENDIENTE_FIRMADO`.
4. Por cada una, lanza un worker thread que consulta KIAI.
5. Para cada respuesta, ejecuta `sincronizarProceso()` en una transacción Prisma:
   - UPDATE `procesos_firma` con nuevo estado.
   - Si el estado KIAI es terminal (COMPLETED, DECLINED, CANCELLED, EXPIRED), UPDATE `solicitudes_credito` e INSERT `solicitud_timeline`.

**Flujos alternativos:**

- 3a. Solicitud `simulado=true` → se omite.

**Excepciones:**

- E1: KIAI retorna error de red → se reintenta en el siguiente ciclo.
- E2: KIAI retorna 401 (token expirado) → se renueva token.

**RF asociados:** RF-12.

**Endpoint:** No es un endpoint HTTP. Script: `pnpm nohup:firmas`.

**Modelos:** `procesos_firma`, `solicitudes_credito`, `solicitud_timeline`.

---

### CU-013 — Cancelar proceso de firma

**Actor:** Asesor

**Descripción:** El asesor cancela un proceso de firma activo (real o simulado).

**Precondiciones:**
- El asesor está autenticado.
- Existe un proceso KIAI activo o simulado en la solicitud.

**Postcondiciones:**
- El proceso queda en estado `CANCELLED` (en KIAI y localmente).
- La solicitud vuelve a `APROBADA`, lista para reenviar.

**Flujo principal:**

1. El asesor abre la solicitud en `PENDIENTE_FIRMADO`.
2. Hace clic en "Cancelar firma".
3. Ingresa un motivo (opcional, max 500 chars).
4. El sistema valida que el proceso no esté terminal.
5. Si es real, llama a KIAI `DELETE /api/processes/{id}`.
6. El sistema marca el proceso como `CANCELLED`.
7. El sistema actualiza la solicitud a `APROBADA`.
8. El sistema registra en `solicitud_timeline` con el motivo.

**Flujos alternativos:**

- 5a. Proceso simulado → se omite la llamada a KIAI (proceso local solo).
- 5b. El asesor puede usar "Descartar simulación" en lugar de "Cancelar" si es simulado.

**Excepciones:**

- E1: Proceso ya terminal → HTTP 400.
- E2: KIAI retorna error → HTTP 502; el proceso local queda en estado inconsistente.

**RF asociados:** RF-13.

**Endpoints:** `POST /api/admin/solicitudes/{id}/cancelar-firmado`, `POST /api/admin/solicitudes/{id}/descartar-simulacion`.

**Modelos:** `procesos_firma`, `solicitudes_credito`, `solicitud_timeline`.

---

### CU-014 — Listar mis solicitudes (solicitante)

**Actor:** Solicitante

**Descripción:** El solicitante consulta sus propias solicitudes.

**Precondiciones:**
- El solicitante está autenticado.

**Postcondiciones:**
- Se retorna la lista de solicitudes del solicitante autenticado.

**Flujo principal:**

1. El solicitante accede a `/dash/solicitudes`.
2. El sistema consulta `GET /api/solicitudes/mis-solicitudes`.
3. El frontend renderiza la tabla con paginación y filtros.

**RF asociados:** RF-14.

**Endpoint:** `GET /api/solicitudes/mis-solicitudes`.

---

### CU-015 — Listar solicitudes pendientes (administrador)

**Actor:** Asesor

**Descripción:** El asesor consulta todas las solicitudes con filtros y paginación.

**Precondiciones:**
- El asesor está autenticado con rol `admin`.

**Flujo principal:**

1. El asesor accede a `/admin/solicitudes`.
2. El sistema consulta `GET /api/admin/solicitudes` con query params (estado, page, etc.).
3. El frontend renderiza la tabla.

**RF asociados:** RF-14.

**Endpoint:** `GET /api/admin/solicitudes`.

---

### CU-016 — Generar PDF de la solicitud

**Actor:** Sistema

**Descripción:** El sistema genera el PDF de la solicitud mediante FlaskPDF.

**Precondiciones:**
- La solicitud tiene todos los datos necesarios (solicitante, crédito).

**Postcondiciones:**
- Existe un PDF en `storage/pdfs/{radicado}/{uuid}.pdf`.
- Existe un registro en `pdfs_generados`.

**Flujo principal:**

1. (Interno) Algún evento dispara la generación (envío, aprobación).
2. El sistema construye el HTML con datos de la solicitud.
3. Llama a FlaskPDF `POST /generate-pdf` con el HTML.
4. Recibe el PDF binario.
5. Guarda el archivo en disco.
6. Crea el registro `pdfs_generados`.

**Excepciones:**

- E1: FlaskPDF retorna error → HTTP 502; el sistema reintenta.

**RF asociados:** RF-15.

**Endpoint:** Interno (llamado desde otros endpoints).

**Modelo:** `pdfs_generados`.

---

### CU-017 — Sincronizar con Sisu

**Actor:** Sistema

**Descripción:** Tras la firma completada, el sistema envía la solicitud al sistema de cartera Sisu.

**Precondiciones:**
- La solicitud está en estado `FIRMADO`.

**Postcondiciones:**
- Sisu registra la solicitud con el `numero_solicitud` Comfaca como `externalReference`.

**Flujo principal:**

1. (Tras FIRMADO) El sistema construye el payload Sisu.
2. Llama a Sisu con autenticación OAuth2.
3. Sisu retorna `RADICADA` con identificador interno.
4. El sistema actualiza el estado local si es necesario.

**Flujos alternativos:**

- 1a. Modo simulación → Sisu retorna éxito inmediato sin llamada real.

**RF asociados:** RF-16.

**Endpoint:** `GET /api/solicitudes/enviar-solicitud/{slug}`.

---

### CU-018 — Recibir notificación de estado

**Actor:** Solicitante

**Descripción:** El solicitante recibe notificaciones push (toast) cuando el estado de su solicitud cambia.

**Precondiciones:**
- El solicitante tiene sesión activa.
- Existe al menos una notificación sin leer.

**Postcondiciones:**
- El solicitante ve la notificación en su UI.
- La notificación queda marcada como leída.

**Flujo principal:**

1. (Interno) El frontend hace polling a `GET /api/notifications`.
2. Si hay notificaciones nuevas, muestra un toast.
3. El usuario puede cerrar el toast o hacer clic para ver detalle.

**RF asociados:** RF-17.

**Endpoints:** `GET /api/notifications`, `PATCH /api/notifications/{id}`.

**Modelo:** `notifications`.

---

## PARTE V — TRAZABILIDAD

## 11. Matriz de trazabilidad RF × CU × Endpoint

| RF | CU | Endpoint principal | Endpoints auxiliares | Modelos |
|---|---|---|---|---|
| RF-01 | CU-001 | `POST /api/auth/authenticate` | `GET /api/auth/session`, `DELETE /api/auth/session` | `usuarios`, `sessions` |
| RF-02 | CU-002 | `POST /api/solicitudes/simular` | — | — |
| RF-03 | CU-003 | `POST /api/solicitudes/guardar-solicitud` | `POST /api/solicitudes/numero-disponible`, `POST /api/solicitudes/actualizar-solicitud` | `solicitudes_credito`, `solicitud_solicitante`, `solicitud_datos_credito`, `solicitud_payload` |
| RF-04 | CU-004 | `POST /api/codeudores` | `POST /api/codeudores/{id}/confirmar`, `DELETE /api/codeudores/{id}` | `usuarios_codeudores`, `codeudor_otp` |
| RF-05 | CU-005 | `POST /api/solicitudes/{id}/documentos` | `GET /api/solicitudes/{id}/documentos`, `DELETE /api/solicitudes/{id}/documentos/{docId}` | `solicitud_documentos` |
| RF-06 | CU-006 | `GET /api/solicitudes/enviar-solicitud/{slug}` | — | `solicitudes_credito`, `pdfs_generados` |
| RF-07 | CU-007 | `PUT /api/admin/solicitudes/{id}/estado` | — | `solicitudes_credito`, `solicitud_timeline`, `notifications` |
| RF-08 | CU-008 | `PUT /api/admin/solicitudes/{id}/firmantes` | `GET .../firmantes`, `DELETE .../firmantes` | `firmantes_solicitud` |
| RF-09 | CU-009 | `POST /api/admin/solicitudes/{id}/anexos` | `GET .../anexos`, `GET .../anexos/{id}/descargar`, `DELETE .../anexos/{id}` | `firmar_anexos` |
| RF-10 | CU-010 | `POST /api/admin/solicitudes/{id}/iniciar-firmado` | — | `procesos_firma`, `firmantes_solicitud`, `solicitudes_credito` |
| RF-11 | CU-011 | `GET /api/public/firma/{token}` | (KIAI gestiona internamente) | `solicitudes_credito`, `firmantes_solicitud` |
| RF-12 | CU-012 | `pnpm nohup:firmas` (worker) | — | `procesos_firma`, `solicitudes_credito` |
| RF-13 | CU-013 | `POST /api/admin/solicitudes/{id}/cancelar-firmado` | `POST .../descartar-simulacion` | `procesos_firma`, `solicitudes_credito` |
| RF-14 | CU-014, CU-015 | `GET /api/solicitudes/mis-solicitudes`, `GET /api/admin/solicitudes` | `GET /api/admin/solicitudes/{id}` | `solicitudes_credito` |
| RF-15 | CU-016 | (interno) `POST /generate-pdf` a FlaskPDF | — | `pdfs_generados` |
| RF-16 | CU-017 | `GET /api/solicitudes/enviar-solicitud/{slug}` | — | (Sisu mantiene el registro) |
| RF-17 | CU-018 | `GET /api/notifications` | `PATCH /api/notifications/{id}` | `notifications` |
| RF-18 | (transversal) | (middleware) `server/middleware/auth.ts`, `server/middleware/admin.ts` | — | `roles`, `usuarios` |

---

## 12. Reglas de negocio transversales

### 12.1 Transiciones de estado permitidas

```
                         ┌─────────────┐
                         │  BORRADOR   │
                         └──────┬──────┘
                                ▼
                         ┌─────────────┐
                         │ FORMULARIO  │
                         └──────┬──────┘
                                ▼
                         ┌─────────────┐
                         │  CODEUDOR   │
                         └──────┬──────┘
                                ▼
                    ┌───────────────────────┐
                    │ DOCUMENTOS_CARGADOS  │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ENVIADO_VALIDACION    │
                    └───────────┬───────────┘
                                ▼
                  ┌─────────┐
                  │APROBADA │◄─────┐
                  └────┬────┘      │
                       ▼           │
              ┌────────────────┐  │ (cancelled KIAI)
              │PENDIENTE_FIRMADO├──┤
              └────────┬───────┘  │
                       ▼          │
                  ┌────────┐      │
                  │FIRMADO │      │
                  └────────┘      │
                                 │
                  ┌────────┐ ◄───┘
                  │  ...   │
                  └────────┘
```

**Estados terminales:**
- `RECHAZADA`
- `DESESTIMADA`
- `CANCELADA`
- `DESISTE`
- `VIGENTE`
- `FIRMADO` (tras originación puede pasar a `VIGENTE`)

**Reglas:**

1. No se puede transicionar de un estado terminal a otro activo.
2. `PENDIENTE_FIRMADO → APROBADA` solo si KIAI notifica `CANCELLED` o `EXPIRED`.
3. `APROBADA → PENDIENTE_FIRMADO` solo si el asesor inicia el proceso KIAI.

> **Brecha detectada:** el endpoint `PUT /api/admin/solicitudes/{id}/estado` **no valida** estas transiciones. Cualquier estado puede ir a cualquier otro. Ver `docs/approval-signing-process.md` §16.2.

### 12.2 Reglas de unicidad

- **Radicado:** único por solicitud (formato `000007-2026-03`).
- **Email de usuario:** único.
- **Número de documento de usuario:** único por tipo.
- **`UNIQUE(solicitud_id, orden)`** en `firmantes_solicitud`.
- **`UNIQUE(solicitud_id, orden)`** en `firmar_anexos`.

### 12.3 Reglas temporales

- **Sesión JWT:** 8 horas (maxAge en `nuxt-auth-utils`).
- **OTP codeudor:** 15 minutos.
- **Deadline KIAI:** 7 días.
- **Token público firma:** 7 días (igual que deadline KIAI).

### 12.4 Reglas de integridad referencial

- Toda `solicitud_*` referencia `solicitudes_credito.numero_solicitud` con `ON DELETE CASCADE`.
- `firmantes_solicitud.solicitud_id` con `ON DELETE CASCADE`.
- `procesos_firma.solicitud_id` con `ON DELETE CASCADE`.
- `usuarios_codeudores.solicitud_id` con `ON DELETE CASCADE`.
- `notifications.notifiable_id` polimórfico (sin FK).
- `solicitud_timeline` referencia `solicitudes_credito` con `ON DELETE CASCADE`.

### 12.5 Reglas de formato

| Campo | Formato |
|---|---|
| `radicado` | `^\d{6}-\d{4}-\d{2}$` |
| `email` | RFC 5322 |
| `numero_documento` | 6-15 dígitos (configurable por tipo) |
| `telefono` | 7-15 dígitos con código de país |
| `monto` | Decimal positivo (max 2 decimales) |
| `plazo` | Entero positivo (meses) |

### 12.6 Reglas de negocio por tipo de crédito

| Tipo | Plazo máximo | Monto máximo | Tasa | Documentos obligatorios |
|---|---|---|---|---|
| `LIBRE_INVERSION` (01) | 60 meses | $50.000.000 | 1.5% M.V. | Cédula, desprendible, recibo público |
| `MICROCREDITO` (02) | 36 meses | $15.000.000 | 2.0% M.V. | Cédula, certificado laboral, balance |
| `EDUCATIVO` (03) | 24 meses | $30.000.000 | 1.2% M.V. | Cédula, recibo matrícula, certificado admisión |

> Ver catálogo completo en `docs/data-model.md` §6.