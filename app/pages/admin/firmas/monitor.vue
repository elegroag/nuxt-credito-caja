<template>
  <div class="container mx-auto py-8 px-4 max-w-7xl">
    <!-- Header con controles -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Monitor de Firmas en Tiempo Real
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Seguimiento automático de procesos de firma digital
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Toggle Polling -->
          <button
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              pollingEnabled
                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            ]"
            @click="togglePolling"
          >
            <Icon
              :name="pollingEnabled ? 'lucide:radio' : 'lucide:radio-tower'"
              :class="pollingEnabled ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'"
            />
            <span class="text-sm font-medium">
              {{
                pollingEnabled
                  ? "Actualización Activa"
                  : "Actualización Pausada"
              }}
            </span>
          </button>

          <!-- Botón Refrescar -->
          <UButton
            variant="outline"
            :disabled="loading"
            @click="refrescarTodos"
          >
            <Icon
              :name="loading ? 'lucide:loader-2' : 'lucide:refresh-cw'"
              :class="loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
            />
            Refrescar
          </UButton>
        </div>
      </div>

      <!-- Última actualización -->
      <div
        v-if="ultimaActualizacion"
        class="flex items-center gap-2 text-xs text-gray-500"
      >
        <Icon
          name="lucide:clock"
          class="h-3 w-3"
        />
        <span>Última actualización: {{ formatearFecha(ultimaActualizacion) }}</span>
      </div>
    </div>

    <!-- Grid de Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <EstadisticasCard
        titulo="Total Procesos"
        :valor="estadisticas.total"
        descripcion="Procesos de firma activos"
        icono="lucide:file-signature"
        color-fondo="bg-blue-100"
        color-icono="text-blue-600"
        color-texto="text-blue-900"
      />
      <EstadisticasCard
        titulo="Pendientes"
        :valor="estadisticas.pendientes"
        descripcion="Esperando firma"
        icono="lucide:clock"
        color-fondo="bg-yellow-100"
        color-icono="text-yellow-600"
        color-texto="text-yellow-900"
      />
      <EstadisticasCard
        titulo="Firmados"
        :valor="estadisticas.firmados"
        descripcion="Completados exitosamente"
        icono="lucide:check-circle"
        color-fondo="bg-green-100"
        color-icono="text-green-600"
        color-texto="text-green-900"
        color-barra="bg-green-600"
        :porcentaje="estadisticas.porcentajeCompletado"
      />
      <EstadisticasCard
        titulo="Rechazados/Expirados"
        :valor="estadisticas.rechazados + estadisticas.expirados"
        descripcion="No completados"
        icono="lucide:x-circle"
        color-fondo="bg-red-100"
        color-icono="text-red-600"
        color-texto="text-red-900"
      />
    </div>

    <!-- Layout de 2 columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Columna principal: Lista de solicitudes -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Filtros -->
        <UCard>
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <Icon
                name="lucide:filter"
                class="h-4 w-4 text-gray-500"
              />
              <span class="text-sm font-medium text-gray-700">Filtrar:</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="estado in estadosDisponibles"
                :key="estado.value"
                :class="[
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
                  estadoFiltro === estado.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]"
                @click="cambiarFiltroEstado(estado.value)"
              >
                <Icon
                  :name="estado.icon"
                  class="h-3.5 w-3.5"
                />
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
          <p class="text-gray-600">
            Cargando procesos de firma...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="rounded-lg bg-red-50 border border-red-200 p-4"
        >
          <div class="flex items-center gap-2 text-red-800">
            <Icon
              name="lucide:alert-circle"
              class="h-5 w-5"
            />
            <p class="font-medium">
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="solicitudes.length === 0"
          class="flex flex-col items-center justify-center py-16 space-y-4"
        >
          <Icon
            name="lucide:file-signature"
            class="h-16 w-16 text-gray-400"
          />
          <p class="text-gray-600 text-lg">
            No hay procesos con el filtro seleccionado
          </p>
        </div>

        <!-- Lista de Solicitudes -->
        <div
          v-else
          class="space-y-3"
        >
          <UCard
            v-for="solicitud in solicitudes"
            :key="solicitud.numero_solicitud"
            class="shadow-md hover:shadow-lg transition-shadow"
          >
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <!-- Info Principal -->
              <div class="lg:col-span-5">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h3 class="text-base font-semibold text-gray-900">
                      {{
                        solicitud.solicitante?.nombres_apellidos || "Sin nombre"
                      }}
                    </h3>
                    <p class="text-xs text-gray-500">
                      {{ solicitud.numero_solicitud }}
                    </p>
                  </div>
                </div>
                <div class="space-y-1 text-xs">
                  <div class="flex items-center gap-2 text-gray-600">
                    <Icon
                      name="lucide:building"
                      class="h-3.5 w-3.5"
                    />
                    <span>{{
                      convenioActivo?.razon_social || "Sin convenio"
                    }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-gray-600">
                    <Icon
                      name="lucide:calendar"
                      class="h-3.5 w-3.5"
                    />
                    <span>{{ formatearFecha(solicitud.created_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Info Proceso Firma -->
              <div class="lg:col-span-5">
                <div class="space-y-2">
                  <div>
                    <span
                      :class="[
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        getEstadoColor(solicitud.proceso_firmado?.estado || '')
                      ]"
                    >
                      <Icon
                        :name="
                          getEstadoIcon(solicitud.proceso_firmado?.estado || '')
                        "
                        class="h-3.5 w-3.5"
                      />
                      {{ solicitud.proceso_firmado?.estado || "DESCONOCIDO" }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-green-50 p-2 rounded">
                      <p class="text-gray-600">
                        Completados
                      </p>
                      <p class="font-semibold text-green-700">
                        {{
                          solicitud.proceso_firmado?.firmantes_completados || 0
                        }}
                      </p>
                    </div>
                    <div class="bg-yellow-50 p-2 rounded">
                      <p class="text-gray-600">
                        Pendientes
                      </p>
                      <p class="font-semibold text-yellow-700">
                        {{
                          solicitud.proceso_firmado?.firmantes_pendientes || 0
                        }}
                      </p>
                    </div>
                  </div>

                  <div class="text-xs text-gray-500">
                    <p>
                      ID: {{ solicitud.proceso_firmado?.transaccion_id || "-" }}
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
                  <Icon
                    name="lucide:eye"
                    class="h-3.5 w-3.5"
                  />
                  Ver
                </UButton>
                <UButton
                  variant="outline"
                  size="sm"
                  class="w-full gap-2"
                  @click="handleConsultarEstado(solicitud.numero_solicitud)"
                >
                  <Icon
                    name="lucide:refresh-cw"
                    class="h-3.5 w-3.5"
                  />
                  Actualizar
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Paginación -->
        <div
          v-if="solicitudes.length > 0"
          class="flex items-center justify-between pt-4"
        >
          <div class="text-sm text-gray-600">
            {{ solicitudes.length }} de {{ totalSolicitudes }} registros
          </div>
          <div class="flex items-center gap-2">
            <UButton
              variant="outline"
              size="sm"
              :disabled="!hasPrevious || loading"
              @click="paginaAnterior"
            >
              <Icon
                name="lucide:chevron-left"
                class="h-4 w-4"
              />
            </UButton>
            <span class="text-sm text-gray-700 px-3">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <UButton
              variant="outline"
              size="sm"
              :disabled="!hasNext || loading"
              @click="siguientePagina"
            >
              <Icon
                name="lucide:chevron-right"
                class="h-4 w-4"
              />
            </UButton>
          </div>
        </div>
      </div>

      <!-- Columna lateral: Cambios recientes -->
      <div class="lg:col-span-1">
        <CambiosRecientesPanel
          :cambios="cambiosRecientes"
          @ver-detalle="verDetalles"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import EstadisticasCard from "@/components/admin/firmas/EstadisticasCard.vue";
import CambiosRecientesPanel from "@/components/admin/firmas/CambiosRecientesPanel.vue";
import { useMonitoreoFirmasRealTime } from "~/composables/admin/useMonitoreoFirmasRealTime";


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
  ultimaActualizacion,
  pollingEnabled,
  cambiosRecientes,
  estadisticas,
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
  iniciarPolling,
  togglePolling,
  convenioActivo,
  cargarConvenio
} = useMonitoreoFirmasRealTime();

const handleConsultarEstado = async (solicitudId: string) => {
  const resultado = await consultarEstado(solicitudId);
  if (!resultado.success) {
    alert(resultado.message || "Error al consultar estado");
  }
};

onMounted(async () => {
  cargarConvenio();
  await cargarSolicitudes();
  iniciarPolling();
});
</script>
