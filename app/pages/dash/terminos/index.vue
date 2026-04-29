<script setup lang="ts">
import { useTerminos } from "@/composables/terminos/useTerminos";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const { loadingParametros, errorParametros, motivosRechazo, cargarTerminos } =
  useTerminos();
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold text-foreground">
          Términos y motivos de rechazo
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Consulta los parámetros generales relacionados con el crédito.
        </p>
      </div>
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loadingParametros"
        :disabled="loadingParametros"
        @click="cargarTerminos"
      >
        Actualizar
      </UButton>
    </div>

    <!-- Card motivos -->
    <UPageCard
      title="Motivos de rechazo"
      description="Parámetros generales del crédito."
      :ui="{ container: 'sm:p-6' }"
    >
      <!-- Loading -->
      <div
        v-if="loadingParametros"
        class="flex items-center justify-center py-10 gap-2 text-muted-foreground"
      >
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando…</span>
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="errorParametros"
        color="destructive"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="errorParametros"
      />

      <template v-else>
        <!-- Lista -->
        <ul class="space-y-2 max-h-[70vh] overflow-auto pr-1">
          <li
            v-for="(m, index) in motivosRechazo"
            :key="m.modrec"
            class="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
            >
              {{ index + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground">{{ m.detalle }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                Código: {{ m.modrec }}
              </p>
            </div>
          </li>
        </ul>

        <!-- Vacío -->
        <div
          v-if="motivosRechazo.length === 0"
          class="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
        >
          No hay motivos de rechazo configurados.
        </div>
      </template>
    </UPageCard>
  </div>
</template>
