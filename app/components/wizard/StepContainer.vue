<template>
  <div class="grid gap-6">
    <slot />

    <div class="flex items-center justify-end gap-3 border-t border-border pt-4">
      <UButton
        v-if="showPrev"
        variant="outline"
        type="button"
        :disabled="currentStep === 0"
        @click="$emit('prev')"
      >
        <ChevronLeft class="mr-2 h-4 w-4" />
        Anterior
      </UButton>

      <UButton v-if="isLastStep" type="button" :loading="loading" @click="$emit('submit')">
        <Send class="mr-2 h-4 w-4" />
        Enviar solicitud
      </UButton>

      <div v-else class="flex flex-col items-end gap-1">
        <UButton type="button" :disabled="isStepBloqueado" @click="$emit('next')">
          <span>Continuar</span>
          <ChevronRight class="ml-2 h-4 w-4" />
        </UButton>
        <span v-if="isStepBloqueado" class="text-xs text-destructive font-medium">
          Complete las referencias requeridas para continuar
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronLeft, ChevronRight, Send } from "@lucide/vue";
import { useConfigurations } from "~/composables/admin/useConfigurations";

interface ReferenciasProps {
  currentStep?: number;
  totalSteps?: number;
  isLastStep?: boolean;
  showPrev?: boolean;
  loading?: boolean;
  form?: {
    referencias: {
      familiares: Referencia[];
      personales: Referencia[];
    };
  };
}

const props = withDefaults(defineProps<ReferenciasProps>(), {
  currentStep: 0,
  totalSteps: 1,
  isLastStep: false,
  showPrev: true,
  loading: false,
  form: undefined
});

const { getConfigurationAsNumber } = useConfigurations();

const REFERENCIAS_STEP_INDEX = 8;

const minimaFamiliares = computed(() => getConfigurationAsNumber("referencias_familiares", 1));
const minimaPersonales = computed(() => getConfigurationAsNumber("referencias_personales", 1));

const referenciasValido = computed(() => {
  if (!props.form) return true;
  const familiares = props.form?.referencias?.familiares?.length || 0;
  const personales = props.form?.referencias?.personales?.length || 0;
  const familiarOk = minimaFamiliares.value === 0 || familiares >= minimaFamiliares.value;
  const personalOk = minimaPersonales.value === 0 || personales >= minimaPersonales.value;
  return familiarOk && personalOk;
});

const isStepBloqueado = computed(() => {
  return props.currentStep === REFERENCIAS_STEP_INDEX && !referenciasValido.value;
});

defineEmits<{
  prev: [];
  next: [];
  submit: [];
}>();
</script>
