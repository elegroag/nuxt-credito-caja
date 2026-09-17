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
        Guardar solicitud
      </UButton>

      <div v-else class="flex flex-col items-end gap-1">
        <UButton type="button" :disabled="isStepBloqueado" @click="$emit('next')">
          <span>Continuar</span>
          <ChevronRight class="ml-2 h-4 w-4" />
        </UButton>
        <span v-if="isStepBloqueado" class="text-xs text-destructive font-medium">
          {{ mensajeBloqueo }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronLeft, ChevronRight, Send } from "@lucide/vue";
import { useConfigurations } from "~/composables/admin/useConfigurations";
import type { CodeudorAsignado } from "~~/shared/types/payload";

interface WizardNavForm {
  referencias?: {
    familiares: Referencia[];
    personales: Referencia[];
  };
  linea_credito?: {
    codeudores?: number;
  };
  codeudores_asignados?: CodeudorAsignado[];
}

interface Props {
  currentStep?: number;
  currentStepKey?: string;
  totalSteps?: number;
  isLastStep?: boolean;
  showPrev?: boolean;
  loading?: boolean;
  codeudoresRequeridos?: number;
  form?: WizardNavForm;
}

const props = withDefaults(defineProps<Props>(), {
  currentStep: 0,
  currentStepKey: "",
  totalSteps: 1,
  isLastStep: false,
  showPrev: true,
  loading: false,
  codeudoresRequeridos: 0,
  form: undefined
});

const { getConfigurationAsNumber } = useConfigurations();

const minimaFamiliares = computed(() => getConfigurationAsNumber("referencias_familiares", 1));
const minimaPersonales = computed(() => getConfigurationAsNumber("referencias_personales", 1));

const referenciasValido = computed(() => {
  if (!props.form?.referencias) return true;
  const familiares = props.form.referencias.familiares?.length || 0;
  const personales = props.form.referencias.personales?.length || 0;
  const familiarOk = minimaFamiliares.value === 0 || familiares >= minimaFamiliares.value;
  const personalOk = minimaPersonales.value === 0 || personales >= minimaPersonales.value;
  return familiarOk && personalOk;
});

const isStepBloqueado = computed(() => {
  if (props.currentStepKey === "referencias" && !referenciasValido.value) {
    return true;
  }
  if (props.currentStepKey === "codeudores") {
    const requeridos = Number(
      props.form?.linea_credito?.codeudores ?? props.codeudoresRequeridos ?? 0
    );
    if (requeridos <= 0) return false;
    const asignados = props.form?.codeudores_asignados?.length ?? 0;
    return asignados !== requeridos;
  }
  return false;
});

const mensajeBloqueo = computed(() => {
  if (props.currentStepKey === "referencias") {
    return "Complete las referencias requeridas para continuar";
  }
  if (props.currentStepKey === "codeudores") {
    return "Asigna la cantidad de codeudores requerida para continuar";
  }
  return "";
});

defineEmits<{
  prev: [];
  next: [];
  submit: [];
}>();
</script>
