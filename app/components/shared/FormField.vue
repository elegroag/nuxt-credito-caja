<template>
  <div class="grid gap-1">
    <label class="flex items-center gap-1">
      <span class="text-sm font-medium text-muted-foreground">{{ label }}</span>
      <span v-if="required" class="text-destructive">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-xs text-destructive mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  error?: string;
  required?: boolean;
}>(), {
  required: false
});
</script>