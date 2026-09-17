<template>
  <UPageCard class="mt-6 mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">
          Contratos
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Responsabilidades contractuales donde figuras como codeudor o firmante
        </p>
      </div>
      <UButton
        to="/dash/responsabilidades"
        color="primary"
        variant="soft"
      >
        Ver contratos
      </UButton>
    </div>

    <div
      v-if="loading"
      class="flex items-center gap-2 text-primary mt-6"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-5 h-5 animate-spin"
      />
      <span class="text-sm">Cargando resumen...</span>
    </div>

    <div
      v-else-if="error"
      class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
    >
      {{ error }}
    </div>

    <div
      v-else
      class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <div class="rounded-xl border border-border bg-muted/30 p-4">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">
          Cantidad
        </p>
        <p class="text-3xl font-semibold text-foreground mt-1">
          {{ resumen.total }}
        </p>
      </div>
      <div class="rounded-xl border border-border bg-muted/30 p-4">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">
          Valor total
        </p>
        <p class="text-3xl font-semibold text-foreground mt-1">
          ${{ formatCurrency(resumen.valor_total) }}
        </p>
      </div>
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import { formatCurrency } from "#shared/utils/formatters";
import { useResponsabilidadesCodeudor } from "~/composables/codeudor/useResponsabilidadesCodeudor";

const { loading, error, resumen, cargarResumen } = useResponsabilidadesCodeudor();

onMounted(() => {
  cargarResumen();
});
</script>
