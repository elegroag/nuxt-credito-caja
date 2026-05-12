<template>
  <div class="space-y-6">
    <!-- Grid principal de estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Solicitudes Activas -->
      <AdminStatsCard
        title="Solicitudes Activas"
        :value="stats.solicitudesActivas"
        :subtitle="`de ${stats.totalSolicitudes} totales`"
        :icon="FileText"
        variant="primary"
        format="number"
        :show-progress="true"
        :progress="tasaActivas"
      />

      <!-- Convenios Activos -->
      <AdminStatsCard
        title="Convenios Activos"
        :value="stats.conveniosActivos"
        subtitle="Empresas con convenio"
        :icon="Building"
        variant="success"
        format="number"
      />

      <!-- Trabajadores Registrados -->
      <AdminStatsCard
        title="Trabajadores Registrados"
        :value="stats.trabajadoresRegistrados"
        subtitle="Usuarios activos"
        :icon="Users"
        variant="info"
        format="number"
      />

      <!-- Solicitudes Pendientes de Firma -->
      <AdminStatsCard
        title="Pendientes de Firma"
        :value="stats.solicitudesPendientesFirma"
        subtitle="Esperando firma digital"
        :icon="Clock"
        variant="warning"
        format="number"
      />

      <!-- Tasa de Aprobación -->
      <AdminStatsCard
        title="Tasa de Aprobación"
        :value="stats.tasaAprobacion"
        subtitle="Solicitudes aprobadas"
        :icon="CheckCircle"
        variant="success"
        format="percentage"
        :show-progress="true"
        :progress="stats.tasaAprobacion"
      />

      <!-- Monto Total Aprobado -->
      <AdminStatsCard
        title="Monto Total Aprobado"
        :value="stats.montoTotalAprobado"
        subtitle="Suma de créditos aprobados"
        :icon="DollarSign"
        variant="primary"
        format="currency"
      />
    </div>

    <!-- Sección adicional de estadísticas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Distribución por Estados -->
      <UCard>
        <div class="flex items-center gap-2 mb-4">
          <BarChart3 class="h-5 w-5 text-muted-foreground" />
          <h3 class="text-lg font-semibold">
            Distribución por Estados
          </h3>
        </div>

        <div
          v-if="stats.solicitudesPorEstado.length > 0"
          class="space-y-3"
        >
          <div
            v-for="item in stats.solicitudesPorEstado"
            :key="item.estado"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-sm font-medium">{{ item.estado }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">{{
                item.count
              }}</span>
              <div class="w-20 bg-secondary rounded-full h-2">
                <div
                  class="h-2 rounded-full"
                  :style="{
                    backgroundColor: item.color,
                    width: `${(item.count / stats.totalSolicitudes) * 100}%`
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-8 text-muted-foreground"
        >
          <BarChart3 class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">
            No hay datos disponibles
          </p>
        </div>
      </UCard>

      <!-- Top Empresas -->
      <UCard>
        <div class="flex items-center gap-2 mb-4">
          <Building class="h-5 w-5 text-muted-foreground" />
          <h3 class="text-lg font-semibold">
            Top Empresas
          </h3>
        </div>

        <div
          v-if="stats.topEmpresas.length > 0"
          class="space-y-3"
        >
          <div
            v-for="(empresa, index) in stats.topEmpresas"
            :key="empresa.nombre"
            class="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold"
              >
                {{ index + 1 }}
              </div>
              <div>
                <p class="font-medium text-sm">
                  {{ empresa.nombre }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ empresa.convenio }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-sm">
                {{ empresa.trabajadores }}
              </p>
              <p class="text-xs text-muted-foreground">
                trabajadores
              </p>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-8 text-muted-foreground"
        >
          <Building class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">
            No hay empresas con convenios
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  FileText,
  Building,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  BarChart3
} from "lucide-vue-next";
import AdminStatsCard from "./AdminStatsCard.vue";

interface Props {
  stats: AdminStats
}

const props = defineProps<Props>();

// Calcular tasa de solicitudes activas
const tasaActivas = computed(() => {
  if (props.stats.totalSolicitudes === 0) return 0;
  return Math.round(
    (props.stats.solicitudesActivas / props.stats.totalSolicitudes) * 100
  );
});
</script>
