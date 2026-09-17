<template>
  <div class="grid gap-6">
    <UCard class="border-border/50 bg-muted/10 shadow-none">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-file-signature" class="w-5 h-5 text-primary" />
        </div>
        <div class="min-w-0 space-y-2">
          <h3 class="text-sm font-semibold text-foreground">
            Codeudores requeridos
          </h3>
          <p class="text-sm text-muted-foreground">
            Esta línea de crédito exige
            <span class="font-semibold text-foreground">{{ codeudoresRequeridos }}</span>
            codeudor{{ codeudoresRequeridos === 1 ? "" : "es" }} para continuar con la solicitud.
          </p>
          <p class="text-xs text-muted-foreground">
            Próximamente podrás asociar aquí los codeudores autorizados desde
            <span class="font-medium text-foreground">Mis codeudores</span>.
            Por ahora este paso solo informa el requisito de la línea.
          </p>
        </div>
      </div>
    </UCard>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-border bg-muted/30 p-4">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">
          Cantidad requerida
        </p>
        <p class="text-3xl font-semibold text-foreground mt-1">
          {{ codeudoresRequeridos }}
        </p>
      </div>
      <div class="rounded-xl border border-dashed border-border bg-muted/10 p-4 flex flex-col justify-center">
        <p class="text-sm font-medium text-foreground">
          Asociación pendiente
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          La selección de codeudores se habilitará en una siguiente iteración.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  codeudoresRequeridos: number
}>();
</script>
