<template>
  <div class="border-b border-border p-4 sm:p-6">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="space-y-1">
        <div
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Paso {{ currentStep + 1 }} de {{ totalSteps }}
        </div>
        <h2 class="text-xl font-bold text-foreground">
          {{ title }}
        </h2>
      </div>

      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentStep: number;
  totalSteps: number;
  title: string;
}

defineProps<Props>();
</script>