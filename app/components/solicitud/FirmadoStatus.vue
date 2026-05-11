<template>
  <UCard>
    <div class="flex items-center gap-2 mb-4">
      <FileSignatureIcon class="h-5 w-5 text-muted-foreground" />
      <h2 class="text-lg font-semibold">Firma Digital</h2>
    </div>

    <div class="space-y-4">
      <!-- Mensaje de estado -->
      <UAlert
        v-if="mensajeEstado"
        :color="alertColor"
        :title="mensajeEstado.titulo"
        :description="mensajeEstado.descripcion"
        variant="soft"
      />

      <!-- Progreso de firmado -->
      <div v-if="enProceso" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Progreso de firmado</span>
          <span class="font-bold">{{ porcentajeCompletado }}%</span>
        </div>
        <UProgress :model-value="porcentajeCompletado" status />
        <p class="text-xs text-muted-foreground">
          {{ estadoActual?.firmantes_completados || 0 }} de
          {{
            (estadoActual?.firmantes_completados || 0) +
            (estadoActual?.firmantes_pendientes || 0)
          }}
          firmantes han completado
        </p>
      </div>

      <!-- Estado completado -->
      <UAlert
        v-if="firmadoCompleto"
        color="primary"
        title="Documento firmado"
        description="El proceso de firma se completó exitosamente"
        icon="i-lucide-check-circle"
        variant="soft"
      />

      <!-- Error -->
      <UAlert
        v-if="error"
        color="destructive"
        :description="error"
        icon="i-lucide-x-circle"
      />

      <!-- Acciones -->
      <div class="flex justify-end gap-2">
        <UButton
          v-if="!procesoFirmado && !loading"
          icon="i-lucide-pen-line"
          @click="handleIniciarFirmado"
        >
          Iniciar Firmado
        </UButton>

        <UButton
          v-if="enProceso"
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          :disabled="loading"
          @click="handleActualizarEstado"
        >
          Actualizar Estado
        </UButton>

        <UButton
          v-if="puedeReintentar"
          color="neutral"
          icon="i-lucide-refresh-cw"
          @click="handleReiniciarFirmado"
        >
          Reintentar Firmado
        </UButton>
      </div>

      <!-- Auto-actualización -->
      <p
        v-if="autoActualizar && enProceso"
        class="text-xs text-muted-foreground text-center"
      >
        Actualizando automáticamente cada {{ intervaloPolling / 1000 }}s
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "#imports";
import { FileSignature as FileSignatureIcon } from "lucide-vue-next";
import { useFirmadoDigital } from "~/composables/solicitud/useFirmadoDigital";

interface Props {
  solicitudId: string;
  autoActualizar?: boolean;
  intervaloPolling?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoActualizar: true,
  intervaloPolling: 10000, // 10 segundos
});

const emit = defineEmits<{
  firmadoIniciado: [data: any];
  firmadoCompletado: [];
  firmadoRechazado: [];
  estadoActualizado: [estado: string];
}>();

const {
  loading,
  error,
  procesoFirmado,
  estadoActual,
  enProceso,
  firmadoCompleto,
  firmadoRechazado,
  porcentajeCompletado,
  mensajeEstado,
  puedeReintentar,
  iniciarFirmado,
  consultarEstado,
  iniciarPolling,
} = useFirmadoDigital();

let pollingIntervalId: number | null = null;

type UAlertColor = "primary" | "secondary" | "accent" | "destructive" | "muted" | "neutral";

const alertColor = computed((): UAlertColor => {
  if (!mensajeEstado.value) return "neutral";
  switch (mensajeEstado.value.tipo) {
    case "success":
      return "primary";
    case "error":
      return "destructive";
    case "warning":
    case "info":
    default:
      return "neutral";
  }
});

onMounted(async () => {
  // Consultar estado inicial
  await handleActualizarEstado();

  // Iniciar polling si está habilitado
  if (props.autoActualizar && enProceso.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

const startPolling = () => {
  if (pollingIntervalId) return;

  pollingIntervalId = iniciarPolling(
    props.solicitudId,
    props.intervaloPolling,
    (estado) => {
      emit("estadoActualizado", estado);

      if (estado === "FIRMADO") {
        emit("firmadoCompletado");
        stopPolling();
      } else if (estado === "RECHAZADO") {
        emit("firmadoRechazado");
        stopPolling();
      }
    },
  ) as unknown as number;
};

const stopPolling = () => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
};

const handleIniciarFirmado = async () => {
  const exito = await iniciarFirmado(props.solicitudId);
  if (exito) {
    emit("firmadoIniciado", procesoFirmado.value);

    if (props.autoActualizar) {
      startPolling();
    }
  }
};

const handleActualizarEstado = async () => {
  const estado = await consultarEstado(props.solicitudId);
  if (estado) {
    emit("estadoActualizado", estado);
  }
};

const handleReiniciarFirmado = async () => {
  stopPolling();
  await handleIniciarFirmado();
};
</script>
