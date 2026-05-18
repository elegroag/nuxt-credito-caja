<template>
  <!-- Welcome Card -->
  <UPageCard class="mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Bienvenido</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ nombreBienvenida || "Usuario" }}
        </p>
      </div>
      <UButton to="/dash/simulador/lineas-credito" color="primary" size="lg">
        <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
        Nueva solicitud
      </UButton>
    </div>
  </UPageCard>

  <!-- Solicitudes Card -->
  <UPageCard class="mb-6">
    <div class="flex items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <UIcon name="i-lucide-clipboard-list" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Mis solicitudes</h2>
          <p class="text-sm text-muted-foreground">Listado de tus solicitudes y estado actual</p>
        </div>
      </div>
      <UButton
        variant="soft"
        color="neutral"
        size="md"
        :loading="loadingSolicitudes"
        @click="cargarSolicitudes"
      >
        <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
        Actualizar
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loadingSolicitudes" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-2 text-primary">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
        <span class="text-sm font-medium">Cargando solicitudes...</span>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="solicitudesError"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
        {{ solicitudesError }}
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="solicitudes.length === 0"
      class="rounded-2xl border border-border/50 bg-muted/30 p-10 text-center"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
          <UIcon name="i-lucide-file-x" class="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">Aún no tienes solicitudes</p>
          <p class="text-xs text-muted-foreground mt-1">
            Cuando crees una solicitud, aparecerá aquí
          </p>
        </div>
        <UButton to="/dash/simulador/lineas-credito" size="sm" color="primary">
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Crear solicitud
        </UButton>
      </div>
    </div>

    <!-- Solicitudes Grid -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UPageCard
        v-for="s in solicitudes"
        :key="s.numero_solicitud"
        :ui="{
          root: 'overflow-hidden transition-all duration-200 hover:-translate-y-1'
        }"
      >
        <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-foreground">
              {{ s.detalle_modalidad || "Solicitud de crédito" }}
            </h3>
            <p class="text-sm text-muted-foreground">#{{ s.numero_solicitud }}</p>
          </div>
          <Badge :class="estadoBadgeClass(String(s.estado || ''))">
            {{ getEstadoData(String(s.estado || ""))?.nombre || s.estado || "-" }}
          </Badge>
        </div>

        <p class="text-sm text-muted-foreground mb-4">
          Solicitud registrada el {{ fmtDate(s.created_at) }}.
        </p>

        <div class="space-y-3 rounded-xl bg-muted/50 p-4 mb-4">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Valor solicitado</span>
            <span class="text-sm font-semibold">{{ fmtMoney(s.valor_solicitud || 0) }}</span>
          </div>
          <UProgress :model-value="estadoProgressPercent(String(s.estado || ''))" size="sm" />
        </div>

        <div class="flex justify-end">
          <NuxtLink :to="`/dash/solicitudes/${s.numero_solicitud}`">
            <UButton size="sm" color="primary" variant="soft">
              <UIcon name="i-lucide-eye" class="w-4 h-4 mr-2" />
              Ver detalle
            </UButton>
          </NuxtLink>
        </div>
      </UPageCard>
    </div>
  </UPageCard>

  <!-- Convenio Card -->
  <UPageCard v-if="loadingConvenio == false && convenioActivo != null">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Convenio activo</h2>
          <p class="text-sm text-muted-foreground">Información del convenio de tu empresa</p>
        </div>
      </div>
      <UButton
        variant="soft"
        color="neutral"
        size="md"
        :loading="loadingConvenio"
        @click="cargarConvenioActivo"
      >
        <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
        Actualizar
      </UButton>
    </div>

    <div v-if="errorConvenio" class="text-sm text-destructive">
      {{ errorConvenio }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="rounded-xl bg-muted/50 p-4">
        <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Empresa</p>
        <p class="text-sm font-semibold text-foreground">
          {{ convenioActivo?.razon_social || empresaTrabajador?.razon_social || "-" }}
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          NIT:
          {{ String(convenioActivo?.nit || empresaTrabajador?.nit || "-") }}
        </p>
      </div>
      <div class="rounded-xl bg-muted/50 p-4">
        <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Vigencia</p>
        <p class="text-sm font-semibold text-foreground">
          Estado:
          <span class="text-primary">{{ convenioActivo?.estado || "-" }}</span>
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          <span>Conevio inicia: {{ convenioActivo?.fecha_convenio }}</span
          ><br />
          Vence:
          {{ convenioActivo?.fecha_vencimiento ? fmtDate(convenioActivo.fecha_vencimiento) : "-" }}
        </p>
      </div>
    </div>
  </UPageCard>
  <UPageCard v-else>
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Convenio activo</h2>
          <p class="text-sm text-muted-foreground">Información del convenio de tu empresa</p>
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
      <div class="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
        <UIcon name="i-lucide-building-2" class="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p class="text-sm font-medium text-foreground">No hay convenio activo</p>
        <p class="text-xs text-muted-foreground mt-1">
          Contacta a tu empresa para activar un convenio
        </p>
      </div>
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import { useInicioTrabajador } from "@/composables/inicio/useInicioTrabajador";
import { fmtMoney, fmtDate } from "#shared/utils/generales";
import { useInicio } from "@/composables/inicio/useInicio";
import Badge from "@/components/shared/Badge.vue";

const {
  solicitudes,
  loadingSolicitudes,
  solicitudesError,
  estadoProgressPercent,
  estadoBadgeClass,
  getEstadoData,
  cargarSolicitudes
} = useInicio();

const {
  loadingConvenio,
  errorConvenio,
  convenioActivo,
  empresaTrabajador,
  cargarConvenioActivo,
  nombreBienvenida
} = useInicioTrabajador();
</script>
