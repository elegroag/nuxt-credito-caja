<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-file-signature" class="w-5 h-5 text-primary" />
          Seguimiento de Firmas Digitales
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Monitoreo y gestión de procesos de firma digital de solicitudes de crédito
        </p>
      </div>
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        :disabled="loading"
        @click="refrescarTodos"
      >
        Refrescar Todo
      </UButton>
    </div>

    <UPageCard>
      <div class="flex flex-wrap items-center gap-4">
        <span class="text-sm font-medium text-foreground">Filtrar por estado:</span>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="estado in estadosDisponibles"
            :key="estado.value"
            :variant="estadoFiltro === estado.value ? 'solid' : 'outline'"
            :color="estadoFiltro === estado.value ? 'primary' : 'neutral'"
            size="sm"
            @click="cambiarFiltroEstado(estado.value)"
          >
            {{ estado.label }}
          </UButton>
        </div>
      </div>
    </UPageCard>

    <div
      v-if="loading && solicitudes.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando procesos de firma…</p>
    </div>

    <UAlert
      v-else-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="error"
    />

    <div
      v-else-if="solicitudes.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon name="i-lucide-file-signature" class="w-10 h-10 opacity-30" />
      <p class="text-sm">No hay procesos de firma con el filtro seleccionado</p>
    </div>

    <div v-else class="space-y-4">
      <UPageCard v-for="solicitud in solicitudes" :key="solicitud.numero_solicitud">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div class="lg:col-span-5">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-lg font-semibold text-foreground">
                  {{ solicitud.solicitante?.nombres_apellidos || "Sin nombre" }}
                </h3>
                <p class="text-sm text-muted-foreground">ID: {{ solicitud.numero_solicitud }}</p>
              </div>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex items-center gap-2 text-muted-foreground">
                <UIcon name="i-lucide-building" class="w-4 h-4" />
                <span>{{ convenioActivo?.razon_social || "Sin convenio" }}</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                <span>Creada: {{ formatearFecha(solicitud.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5">
            <div class="space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <UIcon
                    :name="getEstadoIcon(solicitud.proceso_firmado?.estado || '')"
                    class="w-4 h-4"
                  />
                  <span class="text-sm font-medium text-foreground">Estado de Firma:</span>
                </div>
                <UBadge
                  :color="getEstadoBadgeColor(solicitud.proceso_firmado?.estado || 'primary')"
                  variant="subtle"
                  :icon="getEstadoIcon(solicitud.proceso_firmado?.estado || '')"
                >
                  {{ solicitud.proceso_firmado?.estado || "DESCONOCIDO" }}
                </UBadge>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-muted-foreground">Firmantes completados</p>
                  <p class="text-lg font-semibold text-green-600">
                    {{ solicitud.proceso_firmado?.firmantes_completados || 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground">Pendientes</p>
                  <p class="text-lg font-semibold text-yellow-600">
                    {{ solicitud.proceso_firmado?.firmantes_pendientes || 0 }}
                  </p>
                </div>
              </div>

              <div class="text-xs text-muted-foreground">
                <p>Inicio: {{ formatearFecha(solicitud.proceso_firmado?.fecha_inicio) }}</p>
                <p>ID Transacción: {{ solicitud.proceso_firmado?.transaccion_id || "-" }}</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 flex flex-col gap-2">
            <UButton
              variant="solid"
              color="primary"
              size="sm"
              class="w-full gap-2"
              icon="i-lucide-eye"
              @click="verDetalles(solicitud.numero_solicitud)"
            >
              Ver Detalles
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              class="w-full gap-2"
              icon="i-lucide-refresh-cw"
              :loading="loading"
              @click="handleConsultarEstado(solicitud.numero_solicitud)"
            >
              Actualizar
            </UButton>
          </div>
        </div>
      </UPageCard>
    </div>

    <div v-if="solicitudes.length > 0" class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Mostrando {{ solicitudes.length }} de {{ totalSolicitudes }} registros
      </p>
      <div class="flex items-center gap-2">
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          icon="i-lucide-chevron-left"
          :disabled="!hasPrevious || loading"
          @click="paginaAnterior"
        >
          Anterior
        </UButton>
        <UBadge color="neutral" variant="subtle">
          Página {{ currentPage }} de {{ totalPages }}
        </UBadge>
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          icon="i-lucide-chevron-right"
          :disabled="!hasNext || loading"
          @click="siguientePagina"
        >
          Siguiente
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { useSeguimientoFirmas } from "~/composables/admin/useSeguimientoFirmas";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  solicitudes,
  loading,
  error,
  totalSolicitudes,
  currentPage,
  estadoFiltro,
  estadosDisponibles,
  totalPages,
  hasNext,
  hasPrevious,
  cargarSolicitudes,
  consultarEstado,
  refrescarTodos,
  siguientePagina,
  paginaAnterior,
  cambiarFiltroEstado,
  verDetalles,
  formatearFecha,
  getEstadoColor: _getEstadoColor,
  getEstadoIcon,
  getEstadoBadgeColor,
  convenioActivo,
  cargarConvenio
} = useSeguimientoFirmas();

const handleConsultarEstado = async (solicitudId: string) => {
  const resultado = await consultarEstado(solicitudId);
  if (resultado.success) {
    alert(resultado.message || "Estado actualizado");
  } else {
    alert(resultado.message || "Error al consultar estado");
  }
};

onMounted(() => {
  cargarSolicitudes();
  cargarConvenio();
});
</script>
