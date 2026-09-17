<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon
            name="i-lucide-file-signature"
            class="w-5 h-5 text-primary"
          />
          Contratos
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Solicitudes donde tienes responsabilidad contractual como codeudor o firmante
        </p>
      </div>
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="cargarResumen"
      >
        Actualizar
      </UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UPageCard>
        <p class="text-xs text-muted-foreground">
          Cantidad
        </p>
        <p class="text-2xl font-semibold">
          {{ resumen.total }}
        </p>
      </UPageCard>
      <UPageCard>
        <p class="text-xs text-muted-foreground">
          Valor total
        </p>
        <p class="text-2xl font-semibold">
          ${{ formatCurrency(resumen.valor_total) }}
        </p>
      </UPageCard>
    </div>

    <UAlert
      v-if="error"
      color="destructive"
      variant="subtle"
      :title="error"
    />

    <UPageCard>
      <div
        v-if="loading"
        class="flex items-center justify-center py-10 gap-2 text-primary"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-5 h-5 animate-spin"
        />
        Cargando...
      </div>

      <div
        v-else-if="resumen.items.length === 0"
        class="py-10 text-center text-sm text-muted-foreground"
      >
        No tienes contratos registrados aún.
      </div>

      <div
        v-else
        class="divide-y divide-border"
      >
        <div
          v-for="item in resumen.items"
          :key="item.solicitud_id"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4"
        >
          <div>
            <p class="font-medium text-foreground">
              {{ item.solicitud_id }}
            </p>
            <p class="text-sm text-muted-foreground">
              Rol: {{ item.rol_firmante }} · Estado: {{ item.estado }}
            </p>
            <p class="text-sm text-foreground mt-1">
              Valor: ${{ formatCurrency(item.valor_solicitud) }}
            </p>
          </div>
          <UButton
            :to="`/dash/responsabilidades/${item.solicitud_id}`"
            variant="soft"
            color="primary"
          >
            Ver detalle
          </UButton>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "#shared/utils/formatters";
import { useResponsabilidadesCodeudor } from "~/composables/codeudor/useResponsabilidadesCodeudor";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const { loading, error, resumen, cargarResumen } = useResponsabilidadesCodeudor();

onMounted(() => {
  cargarResumen();
});
</script>
