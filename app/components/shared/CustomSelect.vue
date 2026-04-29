<template>
  <div class="form-group">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <USelectMenu
      v-model="selectedValue"
      :items="normalizedOptions"
      :placeholder="placeholder"
      :disabled="disabled"
      :searchable="searchable"
      class="w-full"
    />

    <!-- Mensaje de error -->
    <div v-if="hasError" class="error-message">
      <span class="text-red-500 text-sm">{{ errorMessage }}</span>
    </div>

    <!-- Mensaje de ayuda -->
    <div v-if="helpText && !errorMessage" class="help-message">
      <span class="text-gray-400 text-sm">{{ helpText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

// Types
type SelectValue = NormalizedOption | undefined;
type RawOption =
  | { label: string; value: string | number | boolean }
  | string
  | number;
type NormalizedOption =
  | string
  | { label: string; value: string | number | boolean };

interface Props {
  modelValue?: SelectValue;
  options?: RawOption[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  errorMessage?: string;
  helpText?: string;
}

interface Emits {
  "update:modelValue": [value: SelectValue];
}

// Props con valores por defecto
const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  options: () => [],
  label: "",
  placeholder: "Seleccionar opción...",
  required: false,
  disabled: false,
  loading: false,
  clearable: true,
  searchable: true,
  errorMessage: "",
  helpText: "",
});

const emit = defineEmits<Emits>();

// Computed properties
const selectedValue = computed<SelectValue>({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const hasError = computed(() => Boolean(props.errorMessage));

// Función para normalizar opciones
const normalizeOption = (option: RawOption): NormalizedOption => {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }
  return option as { label: string; value: string | number | boolean };
};

const normalizedOptions = computed<NormalizedOption[]>(() =>
  props.options.map(normalizeOption),
);
</script>

<style scoped>
.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-message,
.help-message {
  margin-top: 0.25rem;
}
</style>
