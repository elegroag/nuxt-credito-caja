<template>
  <div class="text-center">
    <div
      class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm"
    >
      <span class="text-muted-foreground">¿Necesitas ayuda?</span>
      <a
        href="https://www.comfaca.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
        Visitar Comfaca
      </a>
    </div>
    <p class="text-xs text-muted-foreground/60 mt-4">
      © {{ new Date().getFullYear() }} Comfaca Crédito. Todos los derechos
      reservados.
    </p>
  </div>
</template>
