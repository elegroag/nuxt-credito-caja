<template>
  <div class="min-h-screen py-8 px-4">
    <div class="container mx-auto max-w-6xl">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-24 space-y-4"
      >
        <Icon
          name="lucide:loader-2"
          class="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400"
        />
        <p class="text-gray-600 dark:text-gray-400 font-medium">
          Cargando detalles de la solicitud...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-linear-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-8 rounded-2xl text-center shadow-lg"
      >
        <Icon
          name="lucide:alert-circle"
          class="w-12 h-12 mx-auto mb-4 text-red-500 dark:text-red-400"
        />
        <h3 class="text-xl font-bold mb-2">
          Error al cargar la solicitud
        </h3>
        <p class="mb-4">
          {{ error }}
        </p>
        <UButton
          class="mt-4"
          variant="outline"
          @click="cargarSolicitud"
        >
          Reintentar
        </UButton>
      </div>

      <!-- Solicitud Details -->
      <div
        v-else-if="solicitud"
        class="space-y-6"
      >
        <!-- Header -->
        <SolicitudHeader
          :numero-solicitud="numeroSolicitudDisplay"
          :estado-nombre="getEstadoNombre(String(solicitud.estado || ''))"
          :badge-class="getEstadoBadgeClass(String(solicitud.estado || ''))"
        />

        <!-- Timeline del Proceso -->
        <SolicitudTimeline
          :estados="estadosTimelineConFechas"
          :estado-actual-id="solicitud?.estado"
          :fecha-envio="
            solicitud?.timeline?.find((t) => t.estado === solicitud?.estado)
              ?.fecha
          "
        />

        <!-- Información General -->
        <InfoGeneral
          :numero-solicitud="numeroSolicitudDisplay"
          :monto-solicitado="fmtMoney(solicitud?.valor_solicitud || 0)"
          :plazo-meses="solicitud.plazo_meses || 0"
          :fecha-radicado="fmtDate(solicitud?.fecha_radicado)"
          :linea-credito="solicitud?.detalle_modalidad || '-'"
          :tasa-interes="fmtPct(solicitud?.tasa_interes)"
          :tipo-tasa="'TEA (Tasa Efectiva Anual)'"
          :cuota-estimada="fmtMoney(solicitud?.cuota_mensual)"
        />

        <!-- Acciones -->
        <AccionesCard
          :solicitud-id="solicitud.numero_solicitud"
          :mostrar-enviar="
            solicitud.estado === 'DOCUMENTOS_CARGADOS'
              || solicitud.estado === 'POSTULADO'
          "
          :tiene-pdf="tienePdf"
          @descargar-pdf="descargarPdf"
          @eliminar="mostrarModalEliminar = true"
        />

        <!-- Modal de confirmación de eliminación -->
        <UModal
          v-model:open="mostrarModalEliminar"
          title="Eliminar Solicitud"
          description="¿Está seguro que desea eliminar esta solicitud? Esta acción no se puede deshacer y se perderán todos los datos asociados."
          :ui="{ footer: 'justify-end' }"
        >
          <template #title>
            <span class="flex items-center gap-2">
              <AlertTriangle class="h-5 w-5 text-destructive" />
              Eliminar Solicitud
            </span>
          </template>
          <template #footer="{ close }">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="eliminando"
              @click="close"
            >
              Cancelar
            </UButton>
            <UButton
              color="destructive"
              :loading="eliminando"
              :disabled="eliminando"
              @click="eliminarSolicitud"
            >
              {{ eliminando ? "Eliminando..." : "Eliminar" }}
            </UButton>
          </template>
        </UModal>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle } from "lucide-vue-next";
import SolicitudHeader from "@/components/solicitudes/SolicitudHeader.vue";
import SolicitudTimeline from "@/components/shared/SolicitudTimeline.vue";
import InfoGeneral from "@/components/solicitudes/InfoGeneral.vue";
import AccionesCard from "@/components/solicitudes/AccionesCard.vue";
import { useSolicitudDetailsPage } from "~/composables/solicitud/useSolicitudDetailsPage";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  // Estado principal
  solicitud,
  loading,
  error,
  mostrarModalEliminar,
  eliminando,

  // Datos computados
  numeroSolicitudDisplay,
  estadosTimelineConFechas,
  tienePdf,

  // Funciones de parámetros
  getEstadoNombre,
  getEstadoBadgeClass,

  // Funciones de utilidad
  fmtMoney,
  fmtDate,
  fmtPct,

  // Funciones principales
  cargarSolicitud,
  descargarPdf,
  eliminarSolicitud
} = useSolicitudDetailsPage();
</script>
