<template>
  <div class="mx-auto max-w-5xl p-4 sm:p-8">
    <div class="mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
          Solicitud de crédito
        </h1>
        <p class="text-muted-foreground mt-1">
          Captura secuencial por bloques y generación de XML
        </p>
      </div>
    </div>

    <!-- Estado de carga -->
    <div
      v-if="loadingParametros"
      class="flex justify-center items-center min-h-400"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
        />
        <p class="text-muted-foreground">
          Cargando parámetros del sistema...
        </p>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div
      v-else-if="errorParametros"
      class="flex justify-center items-center min-h-400"
    >
      <UCard
        class="border-destructive/50 bg-destructive/5 max-w-md text-center"
      >
        <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">
          Error al cargar parámetros
        </h3>
        <p class="text-muted-foreground">
          {{ errorParametros }}
        </p>
        <div class="flex gap-3 mt-4">
          <UButton
            variant="outline"
            @click="
              () => {
                cargarParametros();
              }
            "
          >
            Reintentar
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Contenido principal -->
    <div v-else>
      <WizardSolicitudCredito
        :parametros="parametrosCache"
        :fecha-radicado="fechaRadicado"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { AlertCircle } from "lucide-vue-next";

import WizardSolicitudCredito from "~/components/wizard/WizardSolicitudCredito.vue";
import { useParametros } from "~/composables/useParametros";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

// Generar fecha de radicado (formato YYYY-MM-DD)
const fechaRadicado = new Date().toISOString().split("T")[0] || "";

// Usar composable de parámetros
const {
  loading: loadingParametros,
  error: errorParametros,
  parametrosCache,
  cargarParametros
} = useParametros();

// Cargar parámetros al montar el componente
onMounted(async () => {
  try {
    await cargarParametros();
  } catch (error) {
    console.error("Error inicializando parámetros:", error);
  }
});
</script>
