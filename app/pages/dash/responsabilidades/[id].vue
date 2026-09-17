<template>
  <div class="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center gap-3">
      <UButton
        to="/dash/responsabilidades"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
      />
      <div>
        <h1 class="text-xl font-semibold text-foreground">
          Detalle del contrato
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ solicitudId }}
        </p>
      </div>
    </div>

    <div
      v-if="loading"
      class="flex items-center justify-center py-16 gap-2 text-primary"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-5 h-5 animate-spin"
      />
      Cargando detalle...
    </div>

    <UAlert
      v-else-if="error"
      color="destructive"
      variant="subtle"
      :title="error"
    />

    <template v-else-if="detalle">
      <UPageCard>
        <h2 class="text-lg font-semibold mb-4">
          Solicitud
        </h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted-foreground">
              Número
            </dt>
            <dd class="font-medium">
              {{ detalle.solicitud_id }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Estado
            </dt>
            <dd class="font-medium">
              {{ detalle.estado }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Valor
            </dt>
            <dd class="font-medium">
              ${{ formatCurrency(detalle.valor_solicitud) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Plazo
            </dt>
            <dd class="font-medium">
              {{ detalle.plazo_meses }} meses
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Cuota mensual
            </dt>
            <dd class="font-medium">
              {{ detalle.cuota_mensual != null ? `$${formatCurrency(detalle.cuota_mensual)}` : "N/A" }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Modalidad
            </dt>
            <dd class="font-medium">
              {{ detalle.detalle_modalidad || detalle.tipo_credito || "N/A" }}
            </dd>
          </div>
        </dl>
      </UPageCard>

      <UPageCard>
        <h2 class="text-lg font-semibold mb-4">
          Tu rol como firmante
        </h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted-foreground">
              Rol
            </dt>
            <dd class="font-medium">
              {{ detalle.firmante.rol }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Orden
            </dt>
            <dd class="font-medium">
              {{ detalle.firmante.orden }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Nombre
            </dt>
            <dd class="font-medium">
              {{ detalle.firmante.nombre_completo }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Documento
            </dt>
            <dd class="font-medium">
              {{ detalle.firmante.numero_documento }}
            </dd>
          </div>
        </dl>
      </UPageCard>

      <UPageCard v-if="detalle.solicitante">
        <h2 class="text-lg font-semibold mb-4">
          Solicitante
        </h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted-foreground">
              Nombre
            </dt>
            <dd class="font-medium">
              {{ detalle.solicitante.nombres }} {{ detalle.solicitante.apellidos }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              Documento
            </dt>
            <dd class="font-medium">
              {{ detalle.solicitante.tipo_documento }} {{ detalle.solicitante.numero_documento }}
            </dd>
          </div>
        </dl>
      </UPageCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "#shared/utils/formatters";
import { useResponsabilidadesCodeudor } from "~/composables/codeudor/useResponsabilidadesCodeudor";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const route = useRoute();
const solicitudId = computed(() => String(route.params.id || ""));
const { loading, error, detalle, cargarDetalle } = useResponsabilidadesCodeudor();

onMounted(() => {
  if (solicitudId.value) cargarDetalle(solicitudId.value);
});

watch(solicitudId, (id) => {
  if (id) cargarDetalle(id);
});
</script>
