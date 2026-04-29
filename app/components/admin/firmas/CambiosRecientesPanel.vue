<template>
  <UCard>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Cambios Recientes</h3>
      <Icon name="lucide:activity" class="h-5 w-5 text-gray-500" />
    </div>

    <div v-if="cambios.length === 0" class="text-center py-8">
      <Icon name="lucide:inbox" class="h-12 w-12 text-gray-400 mx-auto mb-2" />
      <p class="text-sm text-gray-500">No hay cambios recientes</p>
    </div>

    <div v-else class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="(cambio, index) in cambios"
        :key="index"
        class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div class="flex-shrink-0 mt-1">
          <Icon
            :name="getEstadoIcon(cambio.estadoNuevo)"
            :class="['h-5 w-5', getColorIcono(cambio.estadoNuevo)]"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ cambio.nombreSolicitante }}
          </p>
          <p class="text-xs text-gray-600 mt-1">
            <span :class="getColorTexto(cambio.estadoAnterior)">
              {{ cambio.estadoAnterior }}
            </span>
            <Icon name="lucide:arrow-right" class="h-3 w-3 inline mx-1" />
            <span :class="getColorTexto(cambio.estadoNuevo)">
              {{ cambio.estadoNuevo }}
            </span>
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatearFechaRelativa(cambio.timestamp) }}
          </p>
        </div>
        <button
          @click="$emit('ver-detalle', cambio.solicitudId)"
          class="flex-shrink-0 text-blue-600 hover:text-blue-800"
        >
          <Icon name="lucide:external-link" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Cambio {
  solicitudId: string;
  nombreSolicitante: string;
  estadoAnterior: string;
  estadoNuevo: string;
  timestamp: Date;
}

interface Props {
  cambios: Cambio[];
}

defineProps<Props>();

defineEmits<{
  "ver-detalle": [solicitudId: string];
}>();

const formatearFechaRelativa = (fecha: Date): string => {
  const ahora = new Date();
  const diff = ahora.getTime() - fecha.getTime();
  const segundos = Math.floor(diff / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);

  if (segundos < 60) return "Hace unos segundos";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
  return fecha.toLocaleDateString("es-CO");
};

const getEstadoIcon = (estado: string): string => {
  const iconos: Record<string, string> = {
    PENDIENTE_FIRMADO: "lucide:clock",
    FIRMADO: "lucide:check-circle",
    RECHAZADO: "lucide:x-circle",
    EXPIRADO: "lucide:alert-circle",
    CANCELADO: "lucide:ban",
  };
  return iconos[estado] || "lucide:help-circle";
};

const getColorIcono = (estado: string): string => {
  const colores: Record<string, string> = {
    PENDIENTE_FIRMADO: "text-yellow-600",
    FIRMADO: "text-green-600",
    RECHAZADO: "text-red-600",
    EXPIRADO: "text-gray-600",
    CANCELADO: "text-orange-600",
  };
  return colores[estado] || "text-gray-600";
};

const getColorTexto = (estado: string): string => {
  const colores: Record<string, string> = {
    PENDIENTE_FIRMADO: "text-yellow-700 font-medium",
    FIRMADO: "text-green-700 font-medium",
    RECHAZADO: "text-red-700 font-medium",
    EXPIRADO: "text-gray-700 font-medium",
    CANCELADO: "text-orange-700 font-medium",
  };
  return colores[estado] || "text-gray-700";
};
</script>
