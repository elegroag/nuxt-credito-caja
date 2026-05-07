<template>
  <div class="mx-auto max-w-5xl p-4 sm:p-8">
    <div class="mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
          Solicitud de crédito
        </h1>
        <p class="mt-1 text-muted-foreground">
          Captura secuencial por bloques y generación de XML
        </p>
      </div>
    </div>

    <div
      v-if="loadingParametros"
      class="flex min-h-[400px] items-center justify-center"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"
        ></div>
        <p class="text-muted-foreground">Cargando parámetros del sistema...</p>
      </div>
    </div>

    <div
      v-else-if="errorParametros"
      class="flex min-h-[400px] items-center justify-center"
    >
      <UCard
        class="max-w-md border-destructive/50 bg-destructive/5 text-center"
      >
        <AlertCircle class="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h3 class="mb-2 text-lg font-semibold">Error al cargar parámetros</h3>
        <p class="text-muted-foreground">{{ errorParametros }}</p>
        <div class="mt-4 flex gap-3">
          <UButton variant="outline" @click="handleRetryCargarParametros">
            Reintentar
          </UButton>
        </div>
      </UCard>
    </div>

    <div v-else>
      <WizardSolicitudCredito
        :parametros="parametrosCache"
        :initial-step="props.initialStep"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { AlertCircle } from "lucide-vue-next";

import WizardSolicitudCredito from "~/components/wizard/WizardSolicitudCredito.vue";
import { useParametros } from "~/composables/useParametros";

interface Props {
  initialStep?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: undefined,
});

const {
  loading: loadingParametros,
  error: errorParametros,
  parametrosCache,
  cargarParametros,
} = useParametros();

const handleRetryCargarParametros = async () => {
  await cargarParametros();
};

onMounted(async () => {
  try {
    await cargarParametros();
  } catch (error) {
    console.error("Error inicializando parámetros:", error);
  }
});
</script>
