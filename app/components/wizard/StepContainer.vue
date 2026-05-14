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

      <UButton
        v-if="isLastStep"
        type="button"
        :loading="loading"
        @click="$emit('submit')"
      >
        <Send class="mr-2 h-4 w-4" />
        Enviar solicitud
      </UButton>

      <UButton
        v-else
        type="button"
        @click="$emit('next')"
      >
        Continuar
        <ChevronRight class="ml-2 h-4 w-4" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Send } from "lucide-vue-next";

interface Props {
  currentStep?: number;
  totalSteps?: number;
  isLastStep?: boolean;
  showPrev?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  currentStep: 0,
  totalSteps: 1,
  isLastStep: false,
  showPrev: true,
  loading: false
});

defineEmits<{
  prev: [];
  next: [];
  submit: [];
}>();
</script>