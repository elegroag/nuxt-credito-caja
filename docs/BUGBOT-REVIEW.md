# Bugbot Review

**Repositorio:** `nuxt-creditos`  
**Alcance:** cambios de rama (`branch changes`)  
**Fecha:** 2026-08-08  
**Veredicto:** 6 hallazgos (2 high, 4 medium)

## Resumen

| Severity | Location | Finding |
| --- | --- | --- |
| high | `.gitignore:60` | gitignore anula slides CMS |
| high | `prisma/seeders/cms-contenido.seed.ts:272-300` | Seed apunta imágenes inexistentes |
| medium | `server/api/cms/upload.post.ts:100` | Cambio de ruta base CMS |
| medium | `app/composables/admin/reportes/useReporteSolicitantes.ts:24` | Estado error compartido oculta preview |
| medium | `server/services/reports/solicitantes-reporte.service.ts:138-187` | Límite 5000 antes de deduplicar |
| medium | `server/services/reports/solicitantes-reporte.service.ts:77-78` | Personas jurídicas sin razón social |

## Hallazgos

### 1. gitignore anula slides CMS

- **Severity:** high
- **Location:** `.gitignore:60`

La regla `storage/cms` añadida al final de `.gitignore` vuelve a ignorar el directorio que las líneas anteriores (`!storage/cms/`, `!storage/cms/inicio/slide-*.jpg`) intentan versionar.

### 2. Seed apunta imágenes inexistentes

- **Severity:** high
- **Location:** `prisma/seeders/cms-contenido.seed.ts:272-300`

El seeder del carrusel de inicio ahora guarda rutas como `/api/public/storage/cms/inicio/slide-1.jpg`, pero en el repositorio no existen esos archivos y `.gitignore` impide versionarlos.

### 3. Cambio de ruta base CMS

- **Severity:** medium
- **Location:** `server/api/cms/upload.post.ts:100`

El fallback de `STORAGE_UPLOADS_PATH` pasó de `storage/uploads/` a `storage/`, alineado con el endpoint público, pero sin migración de archivos ya subidos en la ruta anterior.

### 4. Estado error compartido oculta preview

- **Severity:** medium
- **Location:** `app/composables/admin/reportes/useReporteSolicitantes.ts:24`

`useReporteSolicitantes` usa un único `error` para vista previa, historial de archivos y descargas; un fallo al listar archivos puede mostrar alerta de error en la tabla de preview aunque los datos sí se cargaron.

### 5. Límite 5000 antes de deduplicar

- **Severity:** medium
- **Location:** `server/services/reports/solicitantes-reporte.service.ts:138-187`

La consulta aplica `take: REPORTE_SOLICITANTES_MAX_ROWS` antes de deduplicar por `numero_documento`, así que filas repetidas del mismo documento consumen cupo y excluyen otros solicitantes del Excel y del total.

### 6. Personas jurídicas sin razón social

- **Severity:** medium
- **Location:** `server/services/reports/solicitantes-reporte.service.ts:77-78`

El mapeo del reporte solo usa `nombres` y `apellidos` y no selecciona ni exporta `razon_social`, dejando vacío el nombre de solicitantes con `tipo_persona` jurídica.
