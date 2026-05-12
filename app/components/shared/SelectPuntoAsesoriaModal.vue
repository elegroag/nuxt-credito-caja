<template>
  <!-- Modal overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="closeModal"
  >
    <!-- Modal content -->
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="border-b px-6 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Seleccionar Punto de Asesoría
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="closeModal"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-1">
          Se encontraron {{ puntosAsesoria?.length || 0 }} puntos de asesoría
          disponibles
        </p>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
        <div
          v-if="loading"
          class="flex justify-center py-8"
        >
          <ArrowPathIcon class="h-6 w-6 animate-spin text-blue-600" />
        </div>

        <div
          v-else-if="!puntosAsesoria?.length"
          class="text-center py-8"
        >
          <ExclamationTriangleIcon
            class="h-12 w-12 text-gray-400 mx-auto mb-4"
          />
          <p class="text-gray-600">
            No se encontraron puntos de asesoría disponibles
          </p>
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="punto in puntosAsesoria"
            :key="punto.numero"
            class="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
            :class="{
              'border-blue-500 bg-blue-50':
                selectedPunto?.numero === punto.numero
            }"
            @click="selectPunto(punto)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-gray-900">Punto {{ punto.numero }}</span>
                  <span
                    class="px-2 py-1 text-xs rounded-full"
                    :class="
                      punto.estado === 'A'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    "
                  >
                    {{ punto.estado === "A" ? "Activo" : "Inactivo" }}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-gray-600">Oficina:</span>
                    <span class="ml-2 text-gray-900">{{
                      punto.oficina_afiliacion
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Código:</span>
                    <span class="ml-2 text-gray-900">{{
                      punto.code_oficina
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Usuario:</span>
                    <span class="ml-2 text-gray-900">{{
                      punto.nombre_usuario
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Email:</span>
                    <span class="ml-2 text-gray-900">{{ punto.email }}</span>
                  </div>
                </div>
              </div>

              <div class="ml-4">
                <CheckCircleIcon
                  v-if="selectedPunto?.numero === punto.numero"
                  class="h-5 w-5 text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t px-6 py-4 bg-gray-50">
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            @click="closeModal"
          >
            Cancelar
          </UButton>
          <UButton
            :disabled="!selectedPunto"
            @click="confirmSelection"
          >
            Continuar
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "#imports";
import {
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/vue/24/outline";
import type { PuntoAsesoria } from "#shared/types/adviser";

interface Props {
  isOpen: boolean
  puntosAsesoria?: PuntoAsesoria[]
  loading?: boolean
}

interface Emits {
  (e: "close"): void
  (e: "select", punto: PuntoAsesoria): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<Emits>();

const selectedPunto = ref<PuntoAsesoria | null>(null);

// Reset selection when modal opens/closes
watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue) {
      selectedPunto.value = null;
    }
  }
);

const closeModal = () => {
  emit("close");
};

const selectPunto = (punto: PuntoAsesoria) => {
  selectedPunto.value = punto;
};

const confirmSelection = () => {
  if (selectedPunto.value) {
    emit("select", selectedPunto.value);
  }
};
</script>
