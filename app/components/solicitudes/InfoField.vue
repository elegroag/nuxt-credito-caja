<template>
  <div class="space-y-1">
    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {{ label }}
    </label>
    <p :class="cn('text-base', valueClass)">
      {{ value || '-' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  label: string
  value?: string | number
  valueClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  valueClass: "text-gray-900 dark:text-gray-100"
});
</script>
