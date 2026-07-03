# Daemon de consulta FirmaPlus

Proceso independiente del servidor Nuxt que consulta de forma recurrente el estado de las solicitudes de crédito enviadas a FirmaPlus para firma digital.

## Propósito

Cuando un administrador inicia el firmado (`POST /api/admin/solicitudes/:id/iniciar-firmado`), la solicitud pasa a estado `PENDIENTE_FIRMADO`. Este daemon:

1. Busca en base de datos todas las solicitudes en ese estado.
2. Consulta en FirmaPlus el endpoint `GET consultarsolicitud/{id}` por cada una.
3. Registra el resultado en logs.

**Importante:** por ahora el daemon **solo consulta y loguea**. No modifica la base de datos ni actualiza el estado de las solicitudes.

## Arquitectura

```
app.ts (loop principal)
  │
  ├─ Prisma: findMany estado = PENDIENTE_FIRMADO
  │
  └─ for secuencial ──► Worker (consultar-firma.worker.ts)
                          │
                          └─ apiFirmaPlus → consultarsolicitud/{numero_solicitud}
```

| Archivo | Responsabilidad |
|---------|-----------------|
| `app.ts` | Loop infinito con pausa de 5 minutos, consulta Prisma, lanza workers secuenciales |
| `workers/consultar-firma.worker.ts` | Consulta FirmaPlus y escribe logs por solicitud |
| `lib/config.ts` | Carga variables `API_FIRMA_*` desde `.env` (sin contexto Nuxt) |
| `lib/types.ts` | Tipos de `workerData` y resultado del worker |

El proceso corre con `tsx` y no requiere que el servidor Nuxt esté levantado. Reutiliza `lib/prisma.ts` y `server/services/api-firmaplus.ts` (con config inyectada vía `loadStandaloneFirmaConfig()`).

## Requisitos

- Cliente Prisma generado: `pnpm db:generate`
- Archivo `.env` con las mismas variables que usa la app Nuxt:

```env
DATABASE_ENV=dev
DATABASE_URL_DEV=mysql://...
DATABASE_URL_PRO=mysql://...

API_FIRMA_ENV=dev
API_FIRMA_URL_DEV=...
API_FIRMA_URL_PRO=...
API_FIRMA_TYPE_AUTH=Basic
API_FIRMA_BASIC_USER=...
API_FIRMA_BASIC_PASSWORD=...
```

En entorno `dev` (`API_FIRMA_ENV=dev`), FirmaPlus responde con datos mock definidos en `server/services/api-firmaplus.ts`.

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

## Ciclo de trabajo

1. Arranque → log `nohup: daemon de consulta FirmaPlus iniciado`
2. Consulta solicitudes con `estado = "PENDIENTE_FIRMADO"`
3. Por cada solicitud, lanza un worker con:
   - `numero_solicitud`
   - `firmantesCount`
4. Espera a que termine el worker antes de procesar la siguiente (secuencial)
5. Pausa **5 minutos**
6. Repite desde el paso 2

## Logs

| Destino | Contenido |
|---------|-----------|
| `storage/logs/app.log` | Logs estructurados del daemon y workers (prefijo `nohup:`) |
| `storage/logs/nohup-firmas.log` | Salida del script cuando se usa `nohup:firmas:daemon` |

Ejemplos de entradas en `app.log`:

```
[INFO] nohup: ciclo iniciado | {"total":3}
[INFO] nohup: consulta FirmaPlus exitosa | {"numero_solicitud":"000001-2026-01",...}
[INFO] nohup: worker completado | {"numero_solicitud":"000001-2026-01","success":true,"code":"1"}
[INFO] nohup: esperando próximo ciclo | {"minutes":5}
```

Nivel de log configurable con `LOG_LEVEL` (`DEBUG`, `INFO`, `WARN`, `ERROR`).

## Extensión futura

Cuando se requiera sincronizar el estado en base de datos (por ejemplo, pasar a `FIRMADO` al completarse la firma), la lógica puede añadirse en `workers/consultar-firma.worker.ts` sin cambiar la estructura del loop en `app.ts`.
