# Configuraciones del Sistema

## Descripción General

El sistema de **configuraciones** permite centralizar parámetros de negocio, reglas de validación y comportamiento del sistema en una tabla de base de datos (`configurations`). Esto permite ajustar el comportamiento sin necesidad de hacer cambios en código o desplegar.

---

## Modelo de Datos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID único |
| `clave` | `string` | Identificador único de la configuración (e.g. `limite_cuotas`) |
| `valor` | `string` | Valor almacenado como texto (interpretar según `tipo`) |
| `descripcion` | `string` | Descripción legible para administradores |
| `tipo` | `enum` | Tipo de dato: `string`, `number`, `boolean`, `percentage`, `currency` |
| `categoria` | `string` | Agrupación lógica: `solicitudes`, `credito`, `sistema`, `notificaciones` |
| `editable` | `boolean` | Si puede modificarse desde el panel admin |
| `required` | `boolean` | Si es una configuración obligatoria del sistema |
| `created_at` | `datetime` | Fecha de creación |
| `updated_at` | `datetime` | Fecha de última modificación |

---

## Configuraciones Disponibles

### Configuraciones de Solicitudes

| Clave | Tipo | Valor Default | Descripción |
|-------|------|--------------|-------------|
| `limite_solicitudes` | `number` | `10` | Máximo de solicitudes activas por usuario |
| `minimo_salario` | `currency` | `1300000` | Salario mínimo en COP para poder aplicar |
| `minima_referencias` | `number` | `2` | Cantidad mínima de referencias requeridas |

### Configuraciones de Crédito

| Clave | Tipo | Valor Default | Descripción |
|-------|------|--------------|-------------|
| `limite_cuotas` | `number` | `60` | Plazo máximo en meses |
| `minimo_endeudamiento` | `percentage` | `30` | Porcentaje mínimo de cuota vs salario |

### Configuraciones del Sistema

| Clave | Tipo | Valor Default | Descripción |
|-------|------|--------------|-------------|
| `status_online` | `boolean` | `true` | Si `false`, el sistema muestra banner de mantenimiento |
| `tiempo_response` | `number` | `30` | Días máximos de respuesta para servicios externos |

### Configuraciones de Notificaciones

| Clave | Tipo | Valor Default | Descripción |
|-------|------|--------------|-------------|
| `notificacion_firma` | `boolean` | `true` | Habilitar notificaciones de firma digital |
| `notificacion_estado` | `boolean` | `true` | Habilitar notificaciones de cambio de estado |
| `notificacion_plazo` | `boolean` | `true` | Habilitar recordatorios de plazo |

---

## API Endpoints

### GET /api/configurations

Retorna todas las configuraciones del sistema.

**Headers:**
- `Authorization: Bearer <token>` (requerido)

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "clave": "limite_solicitudes",
      "valor": "10",
      "descripcion": "Límite máximo de solicitudes activas por usuario",
      "tipo": "number",
      "categoria": "solicitudes",
      "editable": true,
      "required": true,
      "created_at": "2026-02-25T02:06:11.000Z",
      "updated_at": "2026-02-25T02:06:11.000Z"
    }
  ]
}
```

### GET /api/configurations/:clave

Retorna una configuración específica.

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "clave": "limite_cuotas",
    "valor": "60",
    "descripcion": "Límite máximo de cuotas para un crédito",
    "tipo": "number",
    "categoria": "credito",
    "editable": true,
    "required": true
  }
}
```

### PUT /api/configurations/:clave

Actualiza el valor de una configuración.

**Headers:**
- `Authorization: Bearer <token>` (requerido)

**Body:**
```json
{
  "valor": "72"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": { "clave": "limite_cuotas", "valor": "72" },
  "message": "Configuración actualizada exitosamente"
}
```

**Errores:**
- `400` — Valor inválido para el tipo de configuración
- `403` — La configuración no es editable
- `404` — Clave no encontrada

---

## Uso en Frontend

### Plugin de Configuraciones

El plugin `app/plugins/configurations.client.ts` carga las configuraciones al iniciar la aplicación y las expone globalmente.

### useConfigurations

```typescript
const { 
  configurations,     // readonly ref
  isLoaded,            // boolean
  loadConfigurations,  // (forceRefresh?) => Promise
  refreshConfigurations,
  getConfigurationValue,   // (key, default?) => string
  getConfigurationAsNumber, // (key, default?) => number
  getConfigurationAsBoolean // (key, default?) => boolean
} = useConfigurations();
```

### Ejemplo de Uso

```typescript
// Verificar si el sistema está en mantenimiento
const isOnline = getConfigurationAsBoolean('status_online', true);
if (!isOnline) {
  // mostrar banner de mantenimiento
}

// Validar salario mínimo en el wizard
const minSalario = getConfigurationAsNumber('minimo_salario', 1300000);
if (salario < minSalario) {
  // mostrar error
}

// Validar plazo máximo
const maxCuotas = getConfigurationAsNumber('limite_cuotas', 60);
if (plazo > maxCuotas) {
  // mostrar error
}
```

---

## Validaciones Integradas

### Backend

| Middleware/Endpoint | Config | Acción |
|---------------------|--------|--------|
| `validateSolicitudLimit.ts` | `limite_solicitudes` | Bloquea creación si usuario excede límite |
| `health.get.ts` | `status_online` | Incluye campo `system_status` en respuesta |

### Frontend

| Composable/Componente | Configs | Propósito |
|------------------------|---------|-----------|
| `useSolicitudValidation.ts` | `limite_cuotas`, `minimo_salario`, `minimo_endeudamiento`, `minima_referencias` | Valida cada paso del wizard de solicitud |
| `SystemStatusBanner.vue` | `status_online` | Muestra banner de mantenimiento |

---

## Notas

- Los valores se almacenan como **strings** en la base de datos. La interpretación correcta depende del campo `tipo`.
- El middleware `validateSolicitudLimit` aplica a rutas `/api/solicitudes` con método `POST`.
- El `SystemStatusBanner` solo se renderiza cuando `status_online = false`.
- Los cambios en configuraciones desde el admin panel requieren hacer `refreshConfigurations()` en el frontend para aplicar inmediatamente.