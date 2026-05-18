<template>
  <div
    v-if="!isSystemOnline"
    class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-lg mb-4"
  >
    <div class="flex items-start gap-3">
      <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <p class="font-semibold">Sistema en mantenimiento</p>
        <p class="text-sm mt-0.5 opacity-90">
          En estos momentos el sistema no está disponible para nuevas operaciones. Por favor intenta
          más tarde.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigurations } from "~/composables/admin/useConfigurations";

const { getConfigurationAsBoolean } = useConfigurations();

const isSystemOnline = computed(() => getConfigurationAsBoolean("status_online", true));
</script>
