<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { SolicitudAdmin } from "#shared/types/admin-solicitudes";
import { ESTADOS_DISPONIBLES } from "#shared/types/admin-solicitudes";
import { formatCurrency, formatDate } from "#shared/utils/formatters";
import { useAdminSolicitudes } from "~/composables/admin/useAdminSolicitudes";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  solicitudes,
  loading,
  error,
  totalItems,
  filtrosActivos,
  estadosCount,
  loadingEstados,
  totalPaginas,
  paginaActual,
  tieneSiguientePagina,
  tienePaginaAnterior,
  showEstadoModal,
  solicitudSeleccionada,
  nuevoEstado,
  estadoDescripcion,
  loadingEstado,
  getTotalSolicitudes,
  getEstadoPercentage,
  cambiarPagina,
  cambiarLimite,
  exportarCSV,
  recargarDatos,
  cambiarEstado,
  cerrarEstadoModal,
  confirmarCambioEstado,
  eliminarSolicitudConfirm,
  filtrarPorEstado,
  limpiarFiltroEstado
} = useAdminSolicitudes();

const opcionesLimite = [
  { label: "10 / pág", value: 10 },
  { label: "20 / pág", value: 20 },
  { label: "50 / pág", value: 50 },
  { label: "100 / pág", value: 100 }
];

const opcionesEstadoModal: { label: string, value: string }[] = ESTADOS_DISPONIBLES.map(e => ({
  label: e,
  value: e
}));

const columns: TableColumn<SolicitudAdmin>[] = [
  { id: "solicitante", header: "Solicitante" },
  { id: "documento", header: "Documento" },
  { accessorKey: "estado", header: "Estado" },
  { id: "monto", header: "Monto" },
  { id: "plazo", header: "Plazo" },
  {
    accessorKey: "created_at",
    header: "Fecha Creación",
    cell: ({ row }) =>
      formatDate(row.original.created_at || new Date().toISOString())
  },
  {
    id: "acciones",
    header: "",
    meta: { class: { th: "text-right", td: "text-right" } }
  }
];
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1
          class="text-xl font-semibold text-foreground flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-file-text"
            class="w-5 h-5 text-primary"
          />
          Administración de Solicitudes
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Gestión de solicitudes de crédito
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-download"
          :disabled="loading"
          @click="exportarCSV"
        >
          Exportar CSV
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          :disabled="loading"
          @click="recargarDatos"
        >
          Recargar
        </UButton>
      </div>
    </div>

    <!-- Resumen por estados -->
    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm font-medium text-foreground flex items-center gap-2">
          <UIcon
            name="i-lucide-bar-chart-2"
            class="w-4 h-4 text-primary"
          />
          Resumen por Estados
        </p>
        <UBadge
          color="neutral"
          variant="subtle"
        >
          Total: {{ getTotalSolicitudes }}
        </UBadge>
      </div>

      <div
        v-if="loadingEstados"
        class="flex items-center gap-2 text-muted-foreground text-sm py-4"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="w-4 h-4 animate-spin"
        />
        Cargando estados…
      </div>

      <div
        v-else-if="Object.keys(estadosCount).length > 0"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        <button
          v-for="(count, estado) in estadosCount"
          :key="estado"
          type="button"
          class="rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors p-3 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          :title="`Filtrar por: ${estado}`"
          @click="filtrarPorEstado(estado)"
        >
          <p class="text-2xl font-bold text-foreground">
            {{ count }}
          </p>
          <p class="text-xs text-muted-foreground mt-0.5 truncate">
            {{ estado }}
          </p>
          <p class="text-xs text-primary font-medium">
            {{ getEstadoPercentage(count) }}%
          </p>
        </button>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground"
      >
        <UIcon
          name="i-lucide-bar-chart-2"
          class="w-8 h-8 opacity-30"
        />
        <p class="text-sm">
          No hay datos de estados disponibles
        </p>
      </div>
    </UPageCard>

    <!-- Tabla -->
    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div
        class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border"
      >
        <p class="text-sm font-medium text-foreground">
          Solicitudes
          <UBadge
            color="neutral"
            variant="subtle"
            class="ml-2"
          >
            {{
              totalItems
            }}
          </UBadge>
        </p>
        <div class="flex items-center gap-2">
          <UButton
            v-if="filtrosActivos.estados?.length"
            size="sm"
            variant="soft"
            color="neutral"
            icon="i-lucide-x"
            :disabled="loading"
            @click="limpiarFiltroEstado"
          >
            Quitar filtro
          </UButton>
          <USelect
            :model-value="filtrosActivos.limit"
            :items="opcionesLimite"
            value-key="value"
            label-key="label"
            size="sm"
            class="w-32"
            @update:model-value="cambiarLimite(Number($event))"
          />
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="w-8 h-8 animate-spin text-primary"
        />
        <p class="text-sm">
          Cargando solicitudes…
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-6"
      >
        <UAlert
          color="destructive"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="error"
        >
          <template #footer>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              @click="recargarDatos"
            >
              Reintentar
            </UButton>
          </template>
        </UAlert>
      </div>

      <!-- Empty -->
      <div
        v-else-if="solicitudes.length === 0"
        class="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-10 h-10 opacity-30"
        />
        <p class="text-sm">
          No se encontraron solicitudes
        </p>
      </div>

      <!-- UTable -->
      <UTable
        v-else
        :data="solicitudes"
        :columns="columns"
        class="w-full"
      >
        <template #solicitante-cell="{ row }">
          <div>
            <p class="text-sm font-medium text-foreground">
              {{ row.original.solicitante?.nombres }}
              {{ row.original.solicitante?.apellidos || "N/A" }}
            </p>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <UIcon
                name="i-lucide-mail"
                class="w-3 h-3"
              />
              {{ row.original.solicitante?.email || "N/A" }}
            </p>
          </div>
        </template>

        <template #documento-cell="{ row }">
          <div class="flex items-center gap-1.5 text-sm">
            <UIcon
              name="i-lucide-id-card"
              class="w-4 h-4 text-muted-foreground shrink-0"
            />
            {{ row.original.solicitante?.numero_documento || "N/A" }}
          </div>
        </template>

        <template #estado-cell="{ row }">
          <UBadge
            color="primary"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.estado || "Desconocido" }}
          </UBadge>
        </template>

        <template #monto-cell="{ row }">
          <span class="text-sm font-medium text-foreground">
            ${{ formatCurrency(row.original.valor_solicitud || 0) }}
          </span>
        </template>

        <template #plazo-cell="{ row }">
          <span class="text-sm text-muted-foreground">
            {{ row.original.plazo_meses || 0 }} meses
          </span>
        </template>

        <template #acciones-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-eye"
              :to="`/admin/solicitudes/show/${row.original.numero_solicitud}`"
            />
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-pencil"
              @click="cambiarEstado(row.original)"
            />
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-trash-2"
              color="destructive"
              @click="eliminarSolicitudConfirm(row.original)"
            />
          </div>
        </template>
      </UTable>

      <!-- Paginación -->
      <div
        class="flex items-center justify-between px-4 py-3 border-t border-border"
      >
        <p class="text-xs text-muted-foreground">
          Página {{ paginaActual }} de {{ totalPaginas }}
        </p>
        <UPagination
          :page="paginaActual"
          :items-per-page="filtrosActivos.limit || 20"
          :total="totalItems"
          @update:page="cambiarPagina"
        />
      </div>
    </UPageCard>

    <!-- Modal cambio de estado -->
    <UModal
      v-model:open="showEstadoModal"
      title="Cambiar Estado de Solicitud"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Número de Solicitud">
            <UInput
              :model-value="solicitudSeleccionada?.numero_solicitud || 'N/A'"
              readonly
              class="w-full"
            />
          </UFormField>
          <UFormField label="Nuevo Estado">
            <USelect
              v-model="nuevoEstado"
              :items="opcionesEstadoModal"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Descripción (opcional)">
            <UTextarea
              v-model="estadoDescripcion"
              :rows="3"
              placeholder="Describe el motivo del cambio..."
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            variant="outline"
            color="neutral"
            @click="cerrarEstadoModal"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-check"
            :loading="loadingEstado"
            :disabled="!nuevoEstado || loadingEstado"
            @click="confirmarCambioEstado"
          >
            Actualizar Estado
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
