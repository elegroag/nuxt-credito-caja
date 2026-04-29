<script setup lang="ts">
import { useOficinas } from "@/composables/oficinas/useOficinas";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const {
  loadingParametros,
  errorParametros,
  loadingConvenio,
  oficinasCredito,
  datosGeneralesCredito,
  cargarOficinas,
} = useOficinas();

const fmtMoney = (val: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(val);

const statItems = computed(() => [
  {
    icon: "i-lucide-user",
    label: "Jefe crédito",
    value: datosGeneralesCredito.value?.jefcre || "-",
    large: false,
  },
  {
    icon: "i-lucide-briefcase",
    label: "Cargo",
    value: datosGeneralesCredito.value?.carjefcre || "-",
    large: false,
  },
  {
    icon: "i-lucide-circle-dollar-sign",
    label: "Valor máximo",
    value: fmtMoney(Number(datosGeneralesCredito.value?.valmax || 7000000)),
    large: true,
  },
  {
    icon: "i-lucide-calendar",
    label: "Máximo de cuotas",
    value: String(datosGeneralesCredito.value?.cuomax || 36),
    large: true,
  },
  {
    icon: "i-lucide-graduation-cap",
    label: "Director",
    value: datosGeneralesCredito.value?.diradm || "-",
    large: false,
    wide: true,
  },
  {
    icon: "i-lucide-users",
    label: "Cargo director",
    value: datosGeneralesCredito.value?.cardiradm || "-",
    large: false,
    wide: true,
  },
]);
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold text-foreground">
          Oficinas de crédito
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Información y canales de atención disponibles.
        </p>
      </div>
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loadingConvenio || loadingParametros"
        :disabled="loadingConvenio || loadingParametros"
        @click="cargarOficinas"
      >
        Actualizar
      </UButton>
    </div>

    <!-- Sección oficinas -->
    <UPageCard
      title="Canales de atención"
      description="Puntos disponibles para gestión de créditos."
      :ui="{ container: 'sm:p-6' }"
    >
      <!-- Loading -->
      <div
        v-if="loadingParametros"
        class="flex items-center justify-center py-10 gap-2 text-muted-foreground"
      >
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando oficinas…</span>
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="errorParametros"
        color="destructive"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="errorParametros"
      />

      <!-- Grid de oficinas -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="oficina in oficinasCredito"
          :key="oficina.ofiafi"
          class="rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-4"
        >
          <div>
            <h3 class="font-semibold text-foreground">
              {{ oficina.detalle || "Oficina de crédito" }}
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Código: {{ oficina.ofiafi || "-" }}
            </p>
          </div>

          <div class="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-map-pin"
                class="w-4 h-4 mt-0.5 text-primary shrink-0"
              />
              <div>
                <p
                  class="text-xs text-muted-foreground uppercase tracking-wide"
                >
                  Dirección
                </p>
                <p class="font-medium text-foreground">
                  {{ oficina.direccion || "-" }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-phone"
                class="w-4 h-4 mt-0.5 text-primary shrink-0"
              />
              <div>
                <p
                  class="text-xs text-muted-foreground uppercase tracking-wide"
                >
                  Teléfono
                </p>
                <p class="font-medium text-foreground">
                  {{ oficina.telefono || "-" }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-mail"
                class="w-4 h-4 mt-0.5 text-primary shrink-0"
              />
              <div>
                <p
                  class="text-xs text-muted-foreground uppercase tracking-wide"
                >
                  Correo
                </p>
                <p class="font-medium text-foreground break-all">
                  {{ oficina.email || "-" }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-auto">
            <UButton
              size="sm"
              variant="soft"
              color="primary"
              icon="i-lucide-mail"
              :to="`mailto:${oficina.email}`"
            >
              Contactar
            </UButton>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Datos generales -->
    <UPageCard
      title="Datos generales"
      description="Información administrativa del área de crédito."
      :ui="{ container: 'sm:p-6' }"
    >
      <!-- Loading -->
      <div
        v-if="loadingParametros"
        class="flex items-center justify-center py-10 gap-2 text-muted-foreground"
      >
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando datos…</span>
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="errorParametros"
        color="destructive"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="errorParametros"
      />

      <!-- Stats grid -->
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="item in statItems"
          :key="item.label"
          :class="[
            'rounded-xl border border-border bg-muted/30 p-4 transition-shadow hover:shadow-sm',
            item.wide ? 'sm:col-span-2' : '',
          ]"
        >
          <div class="flex items-center gap-2 mb-2">
            <UIcon :name="item.icon" class="w-4 h-4 text-primary" />
            <span
              class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {{ item.label }}
            </span>
          </div>
          <p
            :class="[
              'font-semibold text-foreground',
              item.large ? 'text-2xl' : 'text-sm',
            ]"
          >
            {{ item.value }}
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
