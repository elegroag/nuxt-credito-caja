<template>
  <div class="container mx-auto py-8 px-4 max-w-7xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Seguimiento de Firmas Digitales
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Monitoreo y gestión de procesos de firma digital de solicitudes de
            crédito
          </p>
        </div>
        <UButton variant="outline" @click="refrescarTodos" :disabled="loading">
          <Icon
            :name="loading ? 'lucide:loader-2' : 'lucide:refresh-cw'"
            :class="loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
          />
          Refrescar Todo
        </UButton>
      </div>
    </div>

    <!-- Filtros -->
    <UCard class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Icon name="lucide:filter" class="h-4 w-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700"
            >Filtrar por estado:</span
          >
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="estado in estadosDisponibles"
            :key="estado.value"
            @click="cambiarFiltroEstado(estado.value)"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
              estadoFiltro === estado.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            ]"
          >
            {{ estado.label }}
          </button>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div
      v-if="loading && solicitudes.length === 0"
      class="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <Icon
        name="lucide:loader-2"
        class="h-12 w-12 animate-spin text-blue-600"
      />
      <p class="text-gray-600">Cargando procesos de firma...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 border border-red-200 p-4"
    >
      <div class="flex items-center gap-2 text-red-800">
        <Icon name="lucide:alert-circle" class="h-5 w-5" />
        <p class="font-medium">{{ error }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="solicitudes.length === 0"
      class="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <Icon name="lucide:file-signature" class="h-16 w-16 text-gray-400" />
      <p class="text-gray-600 text-lg">
        No hay procesos de firma con el filtro seleccionado
      </p>
    </div>

    <!-- Lista de Solicitudes -->
    <div v-else class="space-y-4">
      <UCard
        v-for="solicitud in solicitudes"
        :key="solicitud.numero_solicitud"
        class="shadow-md hover:shadow-lg transition-shadow"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Información Principal -->
          <div class="lg:col-span-5">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ solicitud.solicitante?.nombres_apellidos || "Sin nombre" }}
                </h3>
                <p class="text-sm text-gray-500">
                  ID: {{ solicitud.numero_solicitud }}
                </p>
              </div>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <Icon name="lucide:building" class="h-4 w-4" />
                <span>{{
                  solicitud.convenio?.nombre_convenio || "Sin convenio"
                }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <Icon name="lucide:calendar" class="h-4 w-4" />
                <span>Creada: {{ formatearFecha(solicitud.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Información del Proceso de Firma -->
          <div class="lg:col-span-5">
            <div class="space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <Icon
                    :name="
                      getEstadoIcon(solicitud.proceso_firmado?.estado || '')
                    "
                    class="h-4 w-4"
                  />
                  <span class="text-sm font-medium text-gray-700"
                    >Estado de Firma:</span
                  >
                </div>
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
                    getEstadoColor(solicitud.proceso_firmado?.estado || ''),
                  ]"
                >
                  {{ solicitud.proceso_firmado?.estado || "DESCONOCIDO" }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-gray-500">Firmantes completados</p>
                  <p class="font-semibold text-green-600">
                    {{ solicitud.proceso_firmado?.firmantes_completados || 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-500">Pendientes</p>
                  <p class="font-semibold text-yellow-600">
                    {{ solicitud.proceso_firmado?.firmantes_pendientes || 0 }}
                  </p>
                </div>
              </div>

              <div class="text-xs text-gray-500">
                <p>
                  Inicio:
                  {{ formatearFecha(solicitud.proceso_firmado?.fecha_inicio) }}
                </p>
                <p>
                  ID Transacción:
                  {{ solicitud.proceso_firmado?.transaccion_id || "-" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="lg:col-span-2 flex flex-col gap-2">
            <UButton
              variant="solid"
              size="sm"
              class="w-full gap-2"
              @click="verDetalles(solicitud.numero_solicitud)"
            >
              <Icon name="lucide:eye" class="h-4 w-4" />
              Ver Detalles
            </UButton>
            <UButton
              variant="outline"
              size="sm"
              class="w-full gap-2"
              @click="handleConsultarEstado(solicitud.numero_solicitud)"
            >
              <Icon name="lucide:refresh-cw" class="h-4 w-4" />
              Actualizar
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Paginación -->
    <div
      v-if="solicitudes.length > 0"
      class="mt-6 flex items-center justify-between"
    >
      <div class="text-sm text-gray-600">
        Mostrando {{ solicitudes.length }} de {{ totalSolicitudes }} registros
      </div>
      <div class="flex items-center gap-2">
        <UButton
          variant="outline"
          size="sm"
          @click="paginaAnterior"
          :disabled="!hasPrevious || loading"
        >
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
          Anterior
        </UButton>
        <span class="text-sm text-gray-700 px-3">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <UButton
          variant="outline"
          size="sm"
          @click="siguientePagina"
          :disabled="!hasNext || loading"
        >
          Siguiente
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
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
  middleware: ["auth"],
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
  getEstadoColor,
  getEstadoIcon,
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
});
</script>
