<template>
  <div class="flex items-center justify-between rounded-lg border border-border bg-card p-4">
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <span class="font-medium text-foreground">{{ config.clave }}</span>
        <UBadge v-if="config.required" variant="subtle" color="primary" size="sm">
          Requerido
        </UBadge>
      </div>
      <p class="mt-1 text-sm text-muted-foreground">{{ config.descripcion }}</p>
      <p class="mt-1 text-xs text-muted-foreground">
        Tipo: {{ config.tipo }} | Categoría: {{ config.categoria }}
      </p>
    </div>
    <div class="flex items-center gap-3">
      <span class="rounded-md bg-muted px-3 py-1 font-mono text-sm text-foreground">
        {{ config.valor }}
      </span>
      <UButton
        v-if="config.editable"
        icon="i-lucide-pencil"
        size="sm"
        variant="outline"
        @click="$emit('update', config)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  config: Configuration;
}>();

defineEmits<{
  update: [config: Configuration];
}>();
</script>