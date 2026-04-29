<template>
  <div class="w-full">
    <!-- Estado: No hay documento cargado -->
    <div
      v-if="!modelValue"
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200"
      :class="[
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-primary',
        error ? 'border-destructive' : '',
      ]"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="p-3 bg-gray-100 rounded-full">
          <CloudArrowUpIcon class="h-6 w-6 text-gray-500" />
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-gray-700">
            <span
              class="text-primary cursor-pointer hover:underline"
              @click="triggerFileInput"
            >
              Haz clic para subir
            </span>
            o arrastra y suelta
          </p>
          <p class="text-xs text-gray-500">PDF, JPG o PNG (máx. 5MB)</p>
        </div>
      </div>
      <UInput
        ref="fileInput"
        type="file"
        class="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        @change="handleFileSelect"
      />
    </div>

    <!-- Estado: Cargando -->
    <div v-else-if="loading" class="border rounded-lg p-4 bg-white shadow-sm">
      <div class="flex items-center space-x-4">
        <div class="p-2 bg-primary/10 rounded-full">
          <Icon
            name="lucide:loader-2"
            class="h-5 w-5 text-primary animate-spin"
          />
        </div>
        <div class="flex-1 space-y-1">
          <p class="text-sm font-medium text-gray-900">Subiendo archivo...</p>
          <UiProgress :model-value="progress" class="h-2" />
        </div>
      </div>
    </div>

    <!-- Estado: Documento cargado exitosamente -->
    <div
      v-else
      class="border rounded-lg p-4 bg-white shadow-sm group hover:border-primary transition-colors"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3 overflow-hidden">
          <div class="p-2 bg-green-50 rounded-full shrink-0">
            <DocumentCheckIcon class="h-5 w-5 text-green-600" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ modelValue.saved_filename }}
            </p>
            <p class="text-xs text-gray-500 flex items-center gap-1">
              <span>{{ formatSize(modelValue.tamano_bytes ?? 0) }}</span>
              <span>•</span>
              <span class="text-green-600">Cargado exitosamente</span>
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2 ml-4">
          <button
            type="button"
            class="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
            title="Descargar documento"
            @click="$emit('download', modelValue.documento_uuid)"
          >
            <ArrowDownTrayIcon class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="p-1.5 text-gray-400 hover:text-destructive hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar documento"
            @click="$emit('delete', modelValue.documento_uuid)"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mensaje de error -->
    <p
      v-if="error"
      class="mt-2 text-xs text-destructive flex items-center gap-1"
    >
      <ExclamationCircleIcon class="h-3 w-3" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import {
  CloudArrowUpIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps<{
  modelValue?: DocumentoCargado;
  loading?: boolean;
  progress?: number;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: DocumentoCargado | undefined): void;
  (e: "upload", file: File): void;
  (e: "delete", id: string): void;
  (e: "download", id: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    emit("upload", input.files[0]);
    // Reset value to allow selecting the same file again if needed (e.g. after error)
    input.value = "";
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    emit("upload", files[0]);
  }
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
</script>
