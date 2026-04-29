<template>
  <footer class="border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span>© {{ currentYear }} Comfaca Crédito</span>
        <span class="text-muted-foreground/50">·</span>
        <span>Caja de Compensación Familiar del Caquetá</span>
      </div>
      <div class="flex items-center gap-3">
        <a
          href="/terms"
          class="hover:text-foreground transition-colors"
        >
          Términos
        </a>
        <a
          href="/privacy"
          class="hover:text-foreground transition-colors"
        >
          Privacidad
        </a>
        <a
          href="/help"
          class="hover:text-foreground transition-colors"
        >
          Ayuda
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = computed(() => new Date().getFullYear());
</script>
