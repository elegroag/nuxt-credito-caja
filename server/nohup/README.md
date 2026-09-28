# Daemon de consulta KIAI

Proceso independiente del servidor Nuxt que consulta de forma recurrente el estado de los procesos de firma creados en KIAI y sincroniza el estado de las solicitudes de crédito.

## Propósito

Cuando un administrador inicia el firmado (`POST /api/admin/solicitudes/:id/iniciar-firmado`), se crea el proceso en KIAI, se registra en la tabla `procesos_firma` y la solicitud pasa a `PENDIENTE_FIRMADO`. Este daemon:

1. Busca las solicitudes en `PENDIENTE_FIRMADO` con su proceso KIAI más reciente.
2. Obtiene un token OAuth2 por ciclo y consulta `GET /api/SignatureProcess/{id}` por cada proceso.
3. Guarda en `procesos_firma` el estado, la fecha de consulta y la respuesta de KIAI.
4. Si el proceso llegó a un estado final, actualiza la solicitud y registra el cambio en `solicitud_timeline` (`automatico = true`):

| Estado KIAI | Estado de la solicitud |
|-------------|------------------------|
| `COMPLETED` | `FIRMADO` |
| `DECLINED` | `RECHAZADA` |
| `CANCELLED` | `APROBADA` (puede reenviarse a firma) |
| `EXPIRED` | `APROBADA` (permite reenviar a firma) |

Solo cambia la solicitud si sigue en `PENDIENTE_FIRMADO`. Se omiten sin consultar a KIAI:

- Las solicitudes cuyo proceso más reciente es simulado (`procesos_firma.simulado = true`, creado con `KIAI_SIMULATION=true`). Siguen en `PENDIENTE_FIRMADO` hasta reenviarlas a firma.
- Las solicitudes sin proceso KIAI registrado (enviadas con FirmaPlus), con un aviso en el log.

## Arquitectura

```
app.ts (loop principal)
  │
  ├─ Prisma: solicitudes PENDIENTE_FIRMADO + último procesos_firma (KIAI)
  ├─ apiKiai.getToken() una vez por ciclo
  │
  └─ for secuencial ──► Worker (consultar-firma.worker.ts)
                          │
                          └─ apiKiai.consultarProceso(proceso_id)
  │
  └─ sincronizarProceso(): procesos_firma + solicitud + timeline (transacción)
```

| Archivo | Responsabilidad |
|---------|-----------------|
| `app.ts` | Loop infinito con pausa de 5 minutos, token por ciclo, workers secuenciales y sincronización en base de datos |
| `workers/consultar-firma.worker.ts` | Consulta el proceso en KIAI y devuelve el detalle |
| `lib/config.ts` | Carga variables `KIAI_*` desde `.env` (sin contexto Nuxt) |
| `lib/types.ts` | Tipos de `workerData` y resultado del worker |

El proceso corre con `tsx` y no requiere que el servidor Nuxt esté levantado. Reutiliza `lib/prisma.ts`, `server/services/api-kiai.ts` y `server/services/firma/kiai-firmado.mapper.ts`.

## Requisitos

- Cliente Prisma generado: `pnpm db:generate`
- Migración `procesos_firma` aplicada en la base de datos.
- Archivo `.env` con las mismas variables que usa la app Nuxt:

```env
DATABASE_ENV=dev
DATABASE_URL_DEV=mysql://...
DATABASE_URL_PRO=mysql://...

KIAI_ENV=dev
KIAI_SIMULATION=true
KIAI_API_URL_DEV=https://firmas-demo.kiai.co
KIAI_GRANT_TYPE=client_credentials
KIAI_CLIENT_ID_DEV=...
KIAI_SECRET_KEY_DEV=...
```

Con `KIAI_SIMULATION=true`, al iniciar el firmado KIAI responde con datos mock definidos en `server/services/api-kiai.ts` y el proceso se guarda con `simulado = true`; el daemon nunca consulta esos procesos. Si la variable no está definida, se simula solo cuando `KIAI_ENV=dev`.

## Ejecución

### Foreground (desarrollo / pruebas)

```bash
pnpm nohup:firmas
```

Detener con `Ctrl+C`. El proceso cierra Prisma y sale limpiamente ante `SIGINT` o `SIGTERM`.

### Background (servidor)

```bash
pnpm nohup:firmas:daemon
```

Escribe stdout/stderr en `storage/logs/nohup-firmas.log`.

## Logs

| Destino | Contenido |
|---------|-----------|
| `storage/logs/app.log` | Logs estructurados del daemon y workers (prefijo `nohup:`) |
| `storage/logs/nohup-firmas.log` | Salida del script cuando se usa `nohup:firmas:daemon` |

Ejemplos de entradas en `app.log`:

```
[INFO] nohup: ciclo iniciado | {"total":3}
[INFO] nohup: consulta KIAI exitosa | {"numero_solicitud":"000001-2026-01","status":"IN_PROGRESS",...}
[INFO] nohup: worker completado | {"numero_solicitud":"000001-2026-01","success":true,"status":"IN_PROGRESS"}
[INFO] nohup: solicitud sincronizada con KIAI | {"numero_solicitud":"000002-2026-01","status":"COMPLETED","estado":"FIRMADO"}
[INFO] nohup: esperando próximo ciclo | {"minutes":5}
```

Nivel de log configurable con `LOG_LEVEL` (`DEBUG`, `INFO`, `WARN`, `ERROR`).
