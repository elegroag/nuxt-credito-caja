<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError
}>();
</script>

<template>
  <div>
    <UError
      :error="error"
      :clear="{
        size: 'xl',
        icon: 'i-lucide-arrow-left',
        // icon: 'humbleicons:brand-twitter',
        class: 'rounded-full'
      }"
      :ui="{
        statusCode: 'text-9xl font-thin'
      }"
    />
  </div>
</template>
