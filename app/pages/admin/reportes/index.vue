<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ReporteArchivoItem, ReporteSolicitanteRow } from "~~/shared/types/reports/solicitantes-reporte";
import { ESTADOS_DISPONIBLES } from "#shared/types/admin-solicitudes";
import { formatCurrency } from "#shared/utils/formatters";
import { useReporteSolicitantes } from "~/composables/admin/reportes/useReporteSolicitantes";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  loading,
  downloading,
  loadingArchivos,
  downloadingArchivo,
  error,
  filtros,
  previewRows,
  previewTotal,
  archivosGuardados,
  cargarPreview,
  descargarExcel,
  cargarArchivosGuardados,
  descargarArchivoGuardado,
  limpiarFiltros
} = useReporteSolicitantes();

const tiposDocumento = [
  { label: "Todos", value: "" },
  { label: "Cédula de Ciudadanía", value: "CC" },
  { label: "Cédula de Extranjería", value: "CE" },
  { label: "Tarjeta de Identidad", value: "TI" },
  { label: "Permiso por Protección Temporal", value: "PPT" },
  { label: "NIT", value: "NIT" }
];

const estadosSolicitud = [
  { label: "Todos", value: "" },
  ...ESTADOS_DISPONIBLES.map(estado => ({
    label: estado,
    value: estado
  }))
];

const archivosColumns: TableColumn<ReporteArchivoItem>[] = [
  { accessorKey: "filename", header: "Archivo" },
  { id: "tamano", header: "Tamaño" },
  { id: "fecha", header: "Generado" },
  { id: "acciones", header: "", meta: { class: { th: "text-right", td: "text-right" } } }
];

const columns: TableColumn<ReporteSolicitanteRow>[] = [
  { accessorKey: "numero_solicitud", header: "Solicitud" },
  { id: "solicitante", header: "Solicitante" },
  { accessorKey: "tipo_documento", header: "Tipo Doc." },
  { accessorKey: "numero_documento", header: "Documento" },
  { accessorKey: "estado_solicitud", header: "Estado" },
  { id: "contacto", header: "Contacto" },
  { accessorKey: "ciudad", header: "Ciudad" },
  { id: "salario", header: "Salario" }
];

const formatDateValue = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatMoneyValue = (value: number | null) => {
  if (value === null) return "N/A";
  return `$${formatCurrency(value)}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

onMounted(async () => {
  await Promise.all([cargarPreview(), cargarArchivosGuardados()]);
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-file-spreadsheet" class="w-5 h-5 text-primary" />
          Reportes
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Generación de reportes y exportaciones administrativas
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-download"
        :loading="downloading"
        :disabled="loading || downloading"
        @click="descargarExcel"
      >
        Generar reporte en Excel
      </UButton>
    </div>

    <UAlert
      color="primary"
      variant="subtle"
      icon="i-lucide-info"
      title="Reporte de solicitantes"
      description="Cada generación o descarga consulta datos actuales en la base de datos. El archivo en storage/temp se actualiza automáticamente; no se sirven copias antiguas."
    />

    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm font-medium text-foreground flex items-center gap-2">
            <UIcon name="i-lucide-filter" class="w-4 h-4 text-primary" />
            Filtros
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            Filtra por fecha de radicado, tipo de documento y estado de solicitud.
          </p>
        </div>
        <UBadge color="neutral" variant="subtle">
          {{ previewTotal }} registros
        </UBadge>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UFormField label="Fecha desde">
          <UInput v-model="filtros.fecha_desde" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Fecha hasta">
          <UInput v-model="filtros.fecha_hasta" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Tipo documento">
          <USelect
            v-model="filtros.tipo_documento"
            :items="tiposDocumento"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Estado solicitud">
          <USelect
            v-model="filtros.estado_solicitud"
            :items="estadosSolicitud"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="flex flex-col sm:flex-row sm:justify-end gap-2 mt-5">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-eraser"
          :disabled="loading || downloading"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-search"
          :loading="loading"
          :disabled="loading || downloading"
          @click="cargarPreview"
        >
          Consultar
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-download"
          :loading="downloading"
          :disabled="loading || downloading"
          @click="descargarExcel"
        >
          Generar Excel
        </UButton>
      </div>
    </UPageCard>

    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div class="px-4 pt-4 pb-3 border-b border-border space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-foreground flex items-center gap-2">
            <UIcon name="i-lucide-archive" class="w-4 h-4 text-primary" />
            Historial de generaciones
            <UBadge color="neutral" variant="subtle" class="ml-1">
              {{ archivosGuardados.length }}
            </UBadge>
          </p>
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-lucide-refresh-cw"
            :loading="loadingArchivos"
            :disabled="loadingArchivos"
            @click="cargarArchivosGuardados"
          >
            Actualizar
          </UButton>
        </div>
        <p class="text-xs text-muted-foreground">
          Registro en storage/temp. Cada descarga regenera el reporte con los filtros activos y datos actuales de la base de datos.
        </p>
      </div>

      <div
        v-if="loadingArchivos"
        class="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground"
      >
        <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-primary" />
        <p class="text-sm">
          Cargando reportes guardados…
        </p>
      </div>

      <div
        v-else-if="archivosGuardados.length === 0"
        class="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground"
      >
        <UIcon name="i-lucide-folder-open" class="w-8 h-8 opacity-30" />
        <p class="text-sm">
          No hay reportes guardados en storage/temp
        </p>
      </div>

      <UTable v-else :data="archivosGuardados" :columns="archivosColumns" class="w-full">
        <template #filename-cell="{ row }">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-spreadsheet" class="w-4 h-4 text-primary shrink-0" />
            <span class="text-sm font-medium text-foreground">{{ row.original.filename }}</span>
          </div>
        </template>

        <template #tamano-cell="{ row }">
          <span class="text-sm text-muted-foreground">
            {{ formatFileSize(row.original.size_bytes) }}
          </span>
        </template>

        <template #fecha-cell="{ row }">
          <span class="text-sm text-muted-foreground">
            {{ formatDateTime(row.original.created_at) }}
          </span>
        </template>

        <template #acciones-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-refresh-cw"
              title="Regenerar con datos actuales"
              :loading="downloadingArchivo === row.original.filename"
              :disabled="!!downloadingArchivo"
              @click="descargarArchivoGuardado(row.original.filename)"
            />
          </div>
        </template>
      </UTable>
    </UPageCard>

    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <p class="text-sm font-medium text-foreground">
          Vista previa
          <UBadge color="neutral" variant="subtle" class="ml-2">
            {{ previewRows.length }}
          </UBadge>
        </p>
        <p class="text-xs text-muted-foreground">
          Top 50 registros
        </p>
      </div>

      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
      >
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
        <p class="text-sm">
          Cargando vista previa…
        </p>
      </div>

      <div v-else-if="error" class="p-6">
        <UAlert color="destructive" variant="subtle" icon="i-lucide-triangle-alert" :title="error">
          <template #footer>
            <UButton size="sm" variant="outline" color="neutral" @click="cargarPreview">
              Reintentar
            </UButton>
          </template>
        </UAlert>
      </div>

      <div
        v-else-if="previewRows.length === 0"
        class="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground"
      >
        <UIcon name="i-lucide-inbox" class="w-10 h-10 opacity-30" />
        <p class="text-sm">
          No se encontraron solicitantes con los filtros seleccionados
        </p>
      </div>

      <UTable v-else :data="previewRows" :columns="columns" class="w-full">
        <template #numero_solicitud-cell="{ row }">
          <div>
            <p class="text-sm font-medium text-foreground">
              {{ row.original.numero_solicitud }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ formatDateValue(row.original.fecha_radicado) }}
            </p>
          </div>
        </template>

        <template #solicitante-cell="{ row }">
          <div>
            <p class="text-sm font-medium text-foreground">
              {{ row.original.nombres || "N/A" }} {{ row.original.apellidos }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ row.original.tipo_persona }}
            </p>
          </div>
        </template>

        <template #estado_solicitud-cell="{ row }">
          <UBadge color="primary" variant="subtle" class="capitalize">
            {{ row.original.estado_solicitud }}
          </UBadge>
        </template>

        <template #contacto-cell="{ row }">
          <div>
            <p class="text-sm text-foreground">
              {{ row.original.telefono_movil || "N/A" }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ row.original.email || "N/A" }}
            </p>
          </div>
        </template>

        <template #salario-cell="{ row }">
          <span class="text-sm font-medium text-foreground">
            {{ formatMoneyValue(row.original.salario) }}
          </span>
        </template>
      </UTable>
    </UPageCard>
  </div>
</template>
