<template>
  <Teleport to="body">
    <Transition name="loading-overlay">
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        aria-live="assertive"
        role="alert"
      >
        <!-- Backdrop oscurecido -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Contenido centrado -->
        <div class="relative z-10 flex flex-col items-center gap-5">
          <!-- Spinner circular animado -->
          <div class="relative w-16 h-16">
            <svg
              class="w-16 h-16 animate-spin"
              viewBox="0 0 50 50"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
              />
              <circle
                class="opacity-75"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                :stroke-dasharray="circunferencia"
                :stroke-dashoffset="offsetCarga"
                transform="rotate(-90 25 25)"
              />
            </svg>
          </div>

          <!-- Texto principal -->
          <div class="text-center">
            <p class="text-white font-semibold text-lg leading-tight">
              {{ mensaje || 'Procesando...' }}
            </p>
            <p v-if="subMensaje" class="text-white/60 text-sm mt-1">
              {{ subMensaje }}
            </p>
          </div>

          <!-- Barra de progreso opcional -->
          <div v-if="mostrarProgreso" class="w-64">
            <div class="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-300"
                :style="{ width: `${progreso ?? 0}%` }"
              />
            </div>
            <p class="text-white/50 text-xs text-center mt-2">
              {{ progreso ?? 0 }}%
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** Mostrar/ocultar el overlay */
    show: boolean;
    /** Mensaje principal */
    mensaje?: string;
    /** Mensaje secundario */
    subMensaje?: string;
    /** Mostrar barra de progreso */
    mostrarProgreso?: boolean;
    /** Valor de progreso 0-100 */
    progreso?: number;
  }>(),
  {
    mensaje: "Procesando...",
    subMensaje: undefined,
    mostrarProgreso: false,
    progreso: 0
  }
);

const circunferencia = 2 * Math.PI * 20; // r=20 → 125.66

const offsetCarga = computed(() => {
  const perimetro = circunferencia;
  const progresoNormalized = ((props.progreso ?? 0) / 100) * perimetro;
  return perimetro - progresoNormalized;
});
</script>

<style scoped>
.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
}
</style>