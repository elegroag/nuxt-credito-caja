<template>
  <UPageCard
    :ui="{ root: 'shadow-md hover:shadow-lg transition-shadow duration-200' }"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <div :class="['p-2 rounded-lg', iconBgClass]">
          <slot name="icon" />
        </div>
        <span class="font-semibold text-lg">{{ title }}</span>
      </div>
    </template>
    <slot />
  </UPageCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  iconBgClass?: string
}

withDefaults(defineProps<Props>(), {
  iconBgClass:
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
});
</script>
