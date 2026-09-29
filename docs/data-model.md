# Modelo de Datos — Sistema de Crédito Comfaca

> Documentación técnica del modelo de datos persistido en MySQL/MariaDB y gestionado con Prisma ORM.
> Fuente de verdad: `prisma/schema.prisma` (546 líneas, 22 modelos, 5 enums).
> Proveedor: `mysql` (compatible MariaDB). Salida del cliente: `./generated/prisma`.

---

## Tabla de contenidos

1. [Diagrama de Dominios](#1-diagrama-de-dominios)
2. [Mapa de Relaciones (Vista rápida)](#2-mapa-de-relaciones-vista-rápida)
3. [Catálogos de soporte (RBAC y configuración)](#3-catálogos-de-soporte-rbac-y-configuración)
4. [Modelo Central de Solicitudes](#4-modelo-central-de-solicitudes)
5. [Submodelos asociados a la Solicitud](#5-submodelos-asociados-a-la-solicitud)
6. [Submodelos del flujo de Firmas](#6-submodelos-del-flujo-de-firmas)
7. [Enums y dominios de catálogo](#7-enums-y-dominios-de-catálogo)
8. [Convenciones del modelo](#8-convenciones-del-modelo)
9. [Reglas de integridad referencial](#9-reglas-de-integridad-referencial)
10. [Notas para desarrolladores](#10-notas-para-desarrolladores)

---

## 1. Diagrama de Dominios

El sistema se agrupa en cinco dominios lógicos. Los modelos centrales son `solicitudes_credito` y `users`; el resto orbita alrededor de ellos.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          IDENTIDAD Y ACCESO                          │
│   users ──< usuarios_codeudores ──> users (titular / codeudor)        │
│   roles ──< role_permissions >── permissions                          │
│   modules (self-ref) ──< module_permissions >── permissions          │
│   route_permissions >── permissions                                  │
│   sessions · notifications · personal_access_tokens                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    SOLICITUDES DE CRÉDITO (núcleo)                    │
│                       solicitudes_credito                            │
│            │                                                       │
│            ├──< solicitud_solicitante       (titular o codeudor)    │
│            ├──< solicitud_payload           (JSON versionado)       │
│            ├──< solicitud_documentos         (adjuntos)             │
│            ├──< solicitud_timeline          (bitácora de estados)   │
│            ├──< firmantes_solicitud         (orden de firma)        │
│            ├──< procesos_firma              (integración KIAI)      │
│            ├──< firmar_anexos               (pagarés/cartas)        │
│            └─── pdfs_generados              (1:1, PDF final)        │
│                                                                      │
│   estados_solicitud >──< solicitud_timeline                          │
│   estados_solicitud >──< solicitudes_credito                         │
│   numero_solicitudes   (secuencia de radicados)                      │
│   empresas_convenio    (empresa empleadora del solicitante)          │
│   tipo_documentos      (catálogo de tipos de documento)              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                       CONFIGURACIÓN DEL SISTEMA                      │
│   configurations   (pares clave-valor dinámicos)                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mapa de Relaciones (Vista rápida)

| Modelo padre | Cardinalidad | Modelo hijo | FK hija → PK padre | onDelete |
|---|---|---|---|---|
| `users` | 1 → N | `solicitudes_credito` | `owner_username` → `username` | Cascade |
| `users` | 1 → N | `firmar_anexos` | `username` → `username` | Cascade |
| `users` | 1 → N | `notifications` | `owner_username` → `username` | Cascade |
| `users` | 1 → N | `solicitud_timeline` | `usuario_username` → `username` | NoAction (opt) |
| `users` | N ↔ N | `usuarios_codeudores` | `titular_user_id` y `codeudor_user_id` | Cascade (ambos) |
| `solicitudes_credito` | 1 → N | `solicitud_solicitante` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → N | `solicitud_payload` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → N | `solicitud_documentos` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → N | `solicitud_timeline` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → N | `firmantes_solicitud` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → N | `procesos_firma` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → N | `firmar_anexos` | `solicitud_id` → `numero_solicitud` | Cascade |
| `solicitudes_credito` | 1 → 0..1 | `pdfs_generados` | `solicitud_id` → `numero_solicitud` | Cascade |
| `estados_solicitud` | 1 → N | `solicitudes_credito` | `estado` → `id` | NoAction |
| `estados_solicitud` | 1 → N | `solicitud_timeline` | `estado` → `id` | NoAction |
| `roles` | N ↔ N | `permissions` | vía `role_permissions` | Cascade |
| `modules` | self-ref | `modules` | `parent_id` → `id` | Cascade |
| `modules` | N ↔ N | `permissions` | vía `module_permissions` | Cascade |
| `permissions` | 1 → N | `route_permissions` | `permission_id` → `id` | Cascade |

**Relaciones N:M:**

- `users ↔ users` a través de `usuarios_codeudores` (tabla de asociación con atributos: `estado`, `codigo_autorizacion`, `autorizado_at`).
- `roles ↔ permissions` a través de `role_permissions` (tabla pivote simple, clave compuesta).
- `modules ↔ permissions` a través de `module_permissions` (tabla pivote simple, clave compuesta).

---

## 3. Catálogos de soporte (RBAC y configuración)

### 3.1 `users` — Usuarios del sistema

Usuarios internos (asesores, analistas, admins) y externos (solicitantes titulares y codeudores). Es la raíz del dominio de identidad.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK autoincrement | Identificador interno |
| `username` | `String(100)` UNIQUE | Identificador de login (camelCase, ej. `jperez`) |
| `email` | `String(255)` UNIQUE | Único |
| `password_hash` | `String(255)` | Hash bcrypt/argon |
| `roles` | `Json` | Array de slugs de rol (compatibilidad hacia API legacy) |
| `full_name`, `apellidos`, `nombres` | `String` | Datos personales opcionales |
| `tipo_documento`, `numero_documento` | `String` | Identidad; índice por `numero_documento` |
| `phone` | `String(20)` | |
| `is_active`, `disabled` | `Boolean` | `is_active` para control de sesión, `disabled` para baja lógica |
| `pin_verification` | `String(4)` | PIN usado en flujos OTP (ej. firma) |
| `email_verified_at`, `last_login`, `remember_token` | Timestamps/Tokens | |
| `created_at`, `updated_at` | `Timestamp(0)` | |

Índices: `username`, `email`, `numero_documento`, `last_login`, `disabled`, `is_active`.

Relaciones salientes: `solicitudes_credito`, `firmar_anexos`, `notifications`, `solicitud_timeline`, `usuarios_codeudores` (dos veces: como titular y como codeudor).

### 3.2 `roles` — Roles del sistema

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `nombre` | `String(50)` UNIQUE | Slug (`administrador`, `asesor`, `codeudor`...) |
| `etiqueta` | `String(45)` | Etiqueta legible |
| `descripcion`, `color`, `orden` | varios | Presentación en selects |
| `activo` | `Boolean` | |
| `tipo` | `String(20)` | `sistema` o `personalizado` |
| `permisos` | `Json` | Snapshot opcional de permisos (cache) |

Relaciones: `role_permissions` (N:M con `permissions`).

### 3.3 `permissions` — Permisos granulares

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `key` | `String(100)` UNIQUE | Slug (`solicitudes.create`, `firmas.cancelar`) |
| `etiqueta`, `descripcion` | `String` | UI |
| `activo` | `Boolean` | |

Relaciones: `role_permissions`, `module_permissions`, `route_permissions`.

### 3.4 `role_permissions` — Pivote rol↔permiso

Tabla de asociación pura. PK compuesta `(role_id, permission_id)`. Cascade desde ambos padres.

### 3.5 `modules` — Menú dinámico del frontend

Permite construir el árbol de navegación dinámicamente con control de permisos.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `parent_id` | `BigInt` NULL | Auto-relación (submenú) |
| `key` | `String(100)` UNIQUE | Slug del módulo |
| `title`, `route_name`, `href`, `icon`, `abbr` | varios | UI |
| `section`, `ordering`, `active` | varios | Orden y agrupamiento |
| `permissions_required`, `required_roles`, `excluded_roles` | `Json` | Reglas declarativas |
| `description` | `Text` | |

Relaciones: self-ref (`modulesTomodules`), `module_permissions`.

### 3.6 `module_permissions` — Pivote módulo↔permiso

PK compuesta `(module_id, permission_id)`. Indica qué permisos se necesitan para ver/operar el módulo.

### 3.7 `route_permissions` — Guards de ruta por prefijo

Permite proteger rutas server-side por path-prefix (ej. `/admin/**`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `path_prefix` | `String(255)` | Ej. `/admin`, `/dash/firmas` |
| `permission_id` | FK → `permissions.id` | |
| `activo`, `ordering` | varios | |

### 3.8 `sessions` y `personal_access_tokens`

Persistencia de sesión estilo framework clásico. `sessions` usa el formato estándar Laravel-like (`payload`, `last_activity`). `personal_access_tokens` permite tokens Sanctum-style (`tokenable_type`, `tokenable_id`, `abilities`).

### 3.9 `notifications`

Notificaciones polimórficas (`notifiable_type`, `notifiable_id`). Se filtran siempre por `owner_username` por seguridad multi-imp.

### 3.10 `configurations`

Pares clave-valor administrables en caliente.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `clave` | `String(100)` UNIQUE | Ej. `tasa_credito_educativo` |
| `valor` | `Text` | Valor serializado |
| `tipo` | `String(50)` | `string`, `number`, `json`, `boolean` |
| `categoria` | `String(100)` | Agrupamiento |
| `editable`, `required` | `Boolean` | |

---

## 4. Modelo Central de Solicitudes

### 4.1 `solicitudes_credito` — Entidad raíz

Tabla pivote de todo el dominio crediticio. El PK es **string** (`numero_solicitud`, formato `000007-2026-03`), generado en `numero_solicitudes`.

| Campo | Tipo | Notas |
|---|---|---|
| `numero_solicitud` | `String(20)` PK | Radicado `secuencia-vigencia-linea_credito` |
| `owner_username` | FK → `users.username` | Asesor que radicó |
| `valor_solicitud` | `Decimal(15,2)` | Monto pedido |
| `plazo_meses` | `Int` | Plazo |
| `tasa_interes` | `Decimal(5,2)` | Tasa nominal |
| `cuota_mensual` | `Decimal(12,2)` | Calculada |
| `estado` | FK → `estados_solicitud.id` | Estado actual |
| `producto_tipo` | `Char(2)` | Tipo de producto (catálogo externo, ej. `01`, `02`) |
| `tipo_credito` | `Char(3)` | Subtipología (catálogo externo) |
| `detalle_modalidad` | `String(255)` | Texto libre sobre modalidad |
| `moneda` | `Char(3)` | Default `COP` |
| `ha_tenido_credito` | `Boolean` | |
| `fecha_radicado` | `Date` | |
| `numero_comprobante` | `String(20)` | Comprobante de radicación |
| `rol_en_solicitud` | enum `rol_en_solicitud` | `T` titular, `S` solidarista, `C` codeudor, `E` empresa |
| `pdf_generado` | `Json` | Snapshot del PDF (estado de generación) |
| `created_at`, `updated_at` | `Timestamp(0)` | |

Índices: `owner_username`, `estado`, `created_at`.

> **Importante:** `rol_en_solicitud` se usa para tipificar el rol del dueño del registro en el contexto de la solicitud; los codeudores no son dueños, se gestionan vía `usuarios_codeudores`.

Relaciones salientes (todas en cascade): `solicitud_solicitante`, `solicitud_payload`, `solicitud_documentos`, `solicitud_timeline`, `firmantes_solicitud`, `procesos_firma`, `firmar_anexos`, `pdfs_generados`.

### 4.2 `estados_solicitud` — Máquina de estados

Catálogo que define los estados posibles y el ordenamiento lógico (orden en pipeline).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String(50)` PK | Slug del estado |
| `nombre` | `String(100)` | Etiqueta legible |
| `descripcion` | `Text` | |
| `orden` | `Int` | Posición en el flujo |
| `color` | `String(7)` | Hex `#RRGGBB` para badges |
| `activo` | `Boolean` | |

Pipeline (de `orden` menor a mayor):

| orden | id | nombre |
|---|---|---|
| 1 | `POSTULADO` | Solicitud recién creada |
| 2 | `DOCUMENTOS_CARGADOS` | Documentos completos |
| 3 | `ENVIADO_VALIDACION` | Enviada al asesor |
| 4 | `PENDIENTE_FIRMADO` | Documentos a firmar |
| 5 | `FIRMADO` | Firmada |
| 6 | `ENVIADO_PENDIENTE_APROBACION` | En aprobación |
| 7 | `APROBADA` | Aprobada |
| 8 | `RECHAZADA` | Rechazada |
| 9 | `DESESTIMADA` | Desestimada |
| 10 | `CANCELADA` | Cancelada |
| 11 | `DESISTE` | Desistida |

### 4.3 `numero_solicitudes` — Generador de radicados

Secuencia anual por línea de crédito. No se referencia por FK desde `solicitudes_credito` (la PK de la solicitud es el radicado ya generado).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `radicado` | `String(20)` UNIQUE | `000007-2026-03` |
| `numeric_secuencia` | `Int` | Consecutivo por vigencia + línea |
| `linea_credito` | `String(10)` | Default `03` |
| `vigencia` | `Int` | Año del radicado |

Índices: `linea_credito`, `numeric_secuencia`, `vigencia`.

> **Regla de generación** (en `server/services/postulacion-solicitud.service.ts`):
> 1. Buscar el último radicado por `(linea_credito, vigencia)`.
> 2. `secuencia = max(secuencia) + 1`.
> 3. `radicado = str(secuencia, 6, pad='0') + '-' + vigencia + '-' + linea_credito`.

### 4.4 `empresas_convenio` — Empresas empleadoras

Empresas con convenio de libranza. Catálogo independiente (no relacionado por FK con `users` ni `solicitudes_credito`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `nit` | `BigInt` UNIQUE | |
| `razon_social` | `String(255)` | |
| `fecha_convenio`, `fecha_vencimiento` | `Date` | Vigencia |
| `estado` | enum `empresas_convenio_estado` | `Activo`, `Inactivo`, `Suspendido`, `Vencido` |
| `representante_documento`, `representante_nombre` | `String` | |
| `telefono`, `correo`, `direccion`, `ciudad`, `departamento` | `String` | |
| `sector_economico`, `tipo_empresa` | `String(100)` | |
| `numero_empleados` | `Int` | |
| `descripcion`, `notas_internas` | `Text` | |

Índices: `estado`, `fecha_vencimiento`, `nit`.

### 4.5 `tipo_documentos` — Tipos de documento requeridos

Catálogo de tipos de adjunto requeridos por el flujo (cédula, certificado laboral, desprendible de nómina...).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `tipo` | `String(50)` UNIQUE | Slug |
| `detalle` | `String(100)` | Descripción |
| `orden` | `SmallInt` | Orden de presentación |
| `activo` | `Boolean` | |

---

## 5. Submodelos asociados a la Solicitud

### 5.1 `solicitud_solicitante` — Personas vinculadas a la solicitud (titulares y codeudores)

Datos demográficos y de contacto. Relación N:1 con `solicitudes_credito`. Soporta persona natural o jurídica.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK → `solicitudes_credito.numero_solicitud` | Cascade |
| `tipo_persona` | enum | `natural` / `juridica` |
| `tipo_documento` | `String(3)` | |
| `numero_documento` | `String(20)` | |
| `nombres`, `apellidos` | `String(100)` | Persona natural |
| `razon_social`, `nit` | `String` | Persona jurídica |
| `fecha_nacimiento`, `fecha_expedicion` | `Date` | |
| `pais_nacimiento`, `pais_residencia` | `Char(3)` | ISO-3166 alpha-3 |
| `genero` | enum | `M`, `F`, `O` |
| `estado_civil`, `nivel_educativo`, `profesion` | `String` | |
| `email` | `String(150)` | |
| `telefono_fijo`, `telefono_movil` | `Char(10)` | |
| `direccion`, `barrio`, `ciudad`, `departamento` | `String` | |
| `tipo_vivienda` | `Char(2)` | Propia / familiar / arrendada |
| `vive_con_nucleo_familiar` | `Boolean` | |
| `personas_a_cargo` | `SmallInt` | |
| `codigo_categoria` | `String(1)` | Categoría del empleado (A, B, C...) |
| `cargo`, `salario`, `antiguedad_meses`, `tipo_contrato`, `sector_economico` | varios | Datos laborales |

Índices: `solicitud_id`, `numero_documento`, `tipo_documento`, `nit`.

> **Nota:** un mismo `numero_documento` puede aparecer en varias solicitudes (histórico). La unicidad de persona la da el sistema `users`.

### 5.2 `solicitud_payload` — Datos estructurados del formulario (JSON versionado)

Almacena el payload completo del wizard de radicación en columnas JSON. Soporta versionado (`(solicitud_id, version)` UNIQUE).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK | Cascade |
| `version` | `String(20)` | Default `1.0` |
| `informacion_laboral` | `Json` | |
| `ingresos_descuentos` | `Json` | |
| `informacion_economica` | `Json` | |
| `propiedades` | `Json` | |
| `deudas` | `Json` | |
| `referencias` | `Json` | |
| `linea_credito` | `Json` | Línea crediticia con `tipcre`, `tasa_interes` |

Restricción única: `(solicitud_id, version)` → una solicitud solo puede tener una versión `1.0`; versiones posteriores conviven.

### 5.3 `solicitud_documentos` — Adjuntos cargados por el solicitante

Documentos de soporte requeridos (PDF, imágenes).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK | Cascade |
| `documento_uuid` | `String(36)` UNIQUE | UUID v4 del archivo |
| `documento_requerido_id` | `String(100)` | Referencia al catálogo (`tipo_documentos.id` u otro) |
| `nombre_original`, `saved_filename`, `ruta_archivo` | `String` | |
| `tipo_mime`, `tamano_bytes` | varios | |
| `activo`, `deleted_at` | `Boolean`/`Timestamp` | Soft-delete |

Índices: `solicitud_id`, `documento_requerido_id`, `activo`.

### 5.4 `solicitud_timeline` — Bitácora de transiciones de estado

Registro histórico de eventos del ciclo de vida.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK | Cascade |
| `estado` | FK → `estados_solicitud.id` | NoAction |
| `fecha` | `Timestamp(0)` | Default `now()` |
| `detalle` | `Text` | Observaciones |
| `usuario_username` | FK → `users.username` NULL | Quién ejecutó la transición |
| `automatico` | `Boolean` | `true` si fue transición programada o del sistema |

Índices: `solicitud_id`, `estado`, `fecha`, `usuario_username`.

---

## 6. Submodelos del flujo de Firmas

### 6.1 `firmantes_solicitud` — Personas que firman

Lista ordenada de firmantes asociados a la solicitud. Relación N:1 con `solicitudes_credito`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK | Cascade |
| `orden` | `Int` | Posición en la cadena de firma |
| `tipo` | `String(50)` | `titular`, `codeudor`, `representante_legal`... |
| `nombre_completo` | `String(255)` | |
| `numero_documento`, `email` | `String` | |
| `telefono`, `codigo_pais` | `String(20)`/`String(5)` | E.164 |
| `rol` | `String(100)` | Etiqueta de rol para mostrar al firmante |

Restricciones únicas: `(solicitud_id, orden)`. Índices adicionales: `email`, `numero_documento`.

### 6.2 `procesos_firma` — Procesos de firma externos (KIAI)

Una solicitud puede tener varios procesos (re-firma, cancelación). El vigente es el más reciente.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK | Cascade |
| `proveedor` | `String(30)` | `kiai`, `firmaplus`... |
| `proceso_id` | `String(64)` | ID devuelto por el proveedor |
| `estado` | `String(30)` | Estado del proveedor externo |
| `simulado` | `Boolean` | Si fue en modo simulación |
| `expira_en`, `completado_en`, `ultima_consulta` | `Timestamp(0)` | |
| `respuesta` | `Json` | Última respuesta cruda del proveedor |

Restricciones únicas: `(proveedor, proceso_id)`. Índices: `solicitud_id`, `estado`.

### 6.3 `firmar_anexos` — Anexos a firmar (pagarés, cartas)

Documentos adjuntos a la solicitud que el proveedor de firma debe mostrar. **Renombrado** desde `documentos_postulantes` (commit `5ff2be6`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `username` | FK → `users.username` | Quién subió el anexo |
| `solicitud_id` | FK → `solicitudes_credito.numero_solicitud` | Cascade |
| `tipo_anexo` | `String(50)` | `pagare`, `carta_instrucciones`, `oficio`... |
| `nombre_original`, `saved_filename`, `ruta_archivo` | `String` | |
| `tipo_mime`, `tamano_bytes` | varios | |
| `orden` | `Int` | Orden de presentación |
| `activo` | `Boolean` | |

Índices: `solicitud_id`, `username`, `tipo_anexo`, `activo`.

### 6.4 `pdfs_generados` — PDF final generado (1:1)

Una solicitud solo puede tener un PDF generado activo (UNIQUE en `solicitud_id`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `BigInt` PK | |
| `solicitud_id` | FK UNIQUE | Cascade |
| `path`, `filename` | `String` | Ruta en `storage/` |
| `generado_en` | `Json` | Metadata de generación |

Índices: `solicitud_id`, `filename`.

---

## 7. Enums y dominios de catálogo

| Enum | Valores | Modelo |
|---|---|---|
| `solicitud_solicitante_tipo_persona` | `natural`, `juridica` | `solicitud_solicitante` |
| `solicitud_solicitante_genero` | `M`, `F`, `O` | `solicitud_solicitante` |
| `empresas_convenio_estado` | `Activo`, `Inactivo`, `Suspendido`, `Vencido` | `empresas_convenio` |
| `rol_en_solicitud` | `T` (titular), `S` (solidarista), `C` (codeudor), `E` (empresa) | `solicitudes_credito` |
| `usuarios_codeudores_estado` | `pendiente`, `autorizado`, `rechazado`, `expirado` | `usuarios_codeudores` |

### Catálogos textuales implícitos (no enums)

| Campo | Valores | Origen |
|---|---|---|
| `producto_tipo` (Char(2)) | `01` libranza, `02` libre inversión, ... | API Sisu (catálogo externo) |
| `tipo_credito` (Char(3)) | según `tipcre` del backend | API Sisu (catálogo externo) |
| `linea_credito` (numero_solicitudes) | `01`, `02`, `03`, ... | Convenciones internas |
| `estados_solicitud.id` | los 11 estados del pipeline | `estados_solicitud` |
| `empresas_convenio.estado` | `Activo`, `Inactivo`, `Suspendido`, `Vencido` | enum |

---

## 8. Convenciones del modelo

- **Naming:** los nombres de tablas y columnas son `snake_case`. Los nombres de modelos Prisma también (`solicitudes_credito`, `solicitud_timeline`). Esto se aleja deliberadamente del plural inglés para reflejar el dominio colombiano.
- **PKs:** `BigInt autoincrement Unsigned` para todas las entidades excepto `solicitudes_credito` (string radicado), `users.username` (string), `notifications.id` (UUID) y `sessions.id` (string).
- **Foreign keys:** todas terminan en `_id` o `_username` (en caso de FK a `users.username`). Las tablas pivote usan FKs como PK compuesta.
- **Timestamps:** `created_at`, `updated_at` en todas las entidades operativas. `deleted_at` solo en `solicitud_documentos` (soft-delete). Los timestamps se almacenan como `TIMESTAMP(0)` (sin fracciones de segundo).
- **Decimales:** `valor_solicitud` `DECIMAL(15,2)`, `cuota_mensual` `DECIMAL(12,2)`, `tasa_interes` `DECIMAL(5,2)` (porcentaje con 2 decimales, ej. `1.50`).
- **JSON:** todas las columnas JSON se usan para datos estructurados del payload (`solicitud_payload.*`, `pdf_generado`, `respuesta`, `modules.permissions_required`, etc.).
- **OnDelete:** `Cascade` para todas las dependencias "duras" (hijos del solicitante, hijos de la solicitud); `NoAction` para catálogos (estados) para evitar borrado accidental; `NoAction` para `solicitud_timeline.usuario_username` para preservar historial aunque se deshabilite el usuario.
- **Cascade desde `users`:** los hijos críticos (`solicitudes_credito`, `firmar_anexos`, `notifications`) hacen cascade. `solicitud_timeline` se queda con `NoAction` para no perder el log de auditoría.

---

## 9. Reglas de integridad referencial

1. **No se puede borrar un `users` con solicitudes activas** sin antes migrar/archivar (salvo cascade, que elimina las solicitudes asociadas — operación destructiva).
2. **No se puede borrar un `estados_solicitud` con solicitudes en ese estado** (`NoAction`). Para "retirar" un estado usar `activo = false`.
3. **`(solicitud_id, orden)` es único en `firmantes_solicitud`:** no puede haber dos firmantes en la misma posición.
4. **`(proveedor, proceso_id)` es único en `procesos_firma`:** no se duplican procesos del proveedor.
5. **`solicitudes_credito.numero_solicitud` se genera desde `numero_solicitudes`:** un radicado es único y permanente; cualquier actualización debe respetar `onUpdate: NoAction`.
6. **`solicitud_documentos` admite soft-delete** vía `deleted_at` + `activo`. Cascade solo aplica si no se ha soft-deleteado.
7. **`pdfs_generados.solicitud_id` UNIQUE:** una solicitud solo puede tener un PDF activo; para regenerar se debe borrar el anterior o actualizar.
8. **`usuarios_codeudores`** permite relación N:M entre usuarios; un mismo par `(titular, codeudor)` solo puede existir una vez (`UNIQUE`).
9. **Validación de transición:** cambiar `solicitudes_credito.estado` debe acompañarse de una entrada en `solicitud_timeline` (regla de aplicación, no enforced por DB).

---

## 10. Notas para desarrolladores

- **Cliente Prisma**: el cliente se genera en `./generated/prisma` (no en `node_modules`). Importar siempre desde `@prisma/client` (alias configurado en `nuxt.config.ts`).
- **Migraciones**: tras modificar el schema, ejecutar `pnpm db:generate` (genera cliente) y `pnpm db:migrate` (crea SQL de migración).
- **Relación codeudores**: `usuarios_codeudores` es la única vía para vincular codeudores con el titular; `solicitud_solicitante` es la demografía; no se debe confundir. El codeudor además puede aparecer como `solicitud_solicitante` con `rol_en_solicitud = 'C'` si la solicitud lo requiere.
- **Pipeline de estados**: cualquier endpoint que cambie `solicitudes_credito.estado` debe insertar en `solicitud_timeline` en la misma transacción lógica. Ver `server/services/solicitud.service.ts` para el patrón canónico.
- **Procesos de firma**: una solicitud puede tener varios `procesos_firma`; el vigente es el más reciente por `id` (autoincrement) que no esté cancelado. Consultar `server/services/firma/` para el manejo.
- **Lectura eficiente**: para listar solicitudes con todos sus datos, incluir eager-loading de `solicitud_solicitante`, `solicitud_timeline`, `firmantes_solicitud`, `procesos_firma` y `pdfs_generados`. Ver `server/services/reports/` y `server/services/admin/stats.service.ts` como referencia.
- **Catálogos dinámicos**: `configurations` y `estados_solicitud` se leen en runtime; los cambios se reflejan sin redeploy. `permissions`, `roles`, `modules` también.
- **PII**: `users.email`, `users.password_hash`, `users.numero_documento`, `solicitud_solicitante.*` son datos personales. Aplicar masking en logs y nunca exponer `password_hash` ni `pin_verification` por API.