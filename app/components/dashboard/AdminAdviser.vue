<template>
  <!-- Header -->
  <div class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard Administrativo
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Bienvenido, {{ session.user?.username || "Administrador" }}
        </p>
        <p class="mt-3 text-sm text-muted-foreground">
          {{ tiempoSinActualizar || "Cargando..." }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <UButton
          :disabled="loading"
          variant="outline"
          class="border-sky-200 bg-white/80 text-slate-700 shadow-sm hover:bg-sky-50 hover:border-sky-300"
          @click="refrescarEstadisticas"
        >
          <ArrowPathIcon :class="['h-5 w-5 mr-2', loading && 'animate-spin']" />
          Actualizar
        </UButton>
        <UButton
          class="bg-gradient-primary text-white shadow-sm hover:opacity-90"
          @click="router.push('/admin/solicitudes')"
        >
          <Cog6ToothIcon class="h-5 w-5 mr-2" />
          Administración
        </UButton>
      </div>
    </div>
  </div>

  <!-- Error State -->
  <div v-if="error" class="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
    <div class="flex items-center gap-2 text-red-800">
      <ExclamationTriangleIcon class="h-5 w-5" />
      <p class="font-medium">
        {{ error }}
      </p>
      <UButton
        variant="outline"
        size="sm"
        class="ml-auto border-red-200 bg-white/80 text-red-800 shadow-sm hover:bg-red-50 hover:border-red-300"
        @click="refrescarEstadisticas"
      >
        Reintentar
      </UButton>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading && !tieneDatos" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-lg border border-border bg-card p-6">
        <div class="space-y-3">
          <div class="h-4 bg-muted rounded animate-pulse" />
          <div class="h-8 bg-muted rounded animate-pulse" />
          <div class="h-3 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  </div>

  <!-- Dashboard Content -->
  <div v-else class="space-y-6">
    <AdminStatsGrid :stats="stats" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <AdminRecentActivity
          :activities="stats.actividadReciente"
          :loading="loading"
          @refresh="refrescarEstadisticas"
        />
      </div>

      <!-- Usuarios por Rol -->
      <UCard>
        <div class="flex items-center gap-2 mb-4">
          <UsersIcon class="h-5 w-5 text-muted-foreground" />
          <h3 class="text-lg font-semibold">Usuarios por Rol</h3>
        </div>

        <div v-if="stats.usuariosPorRol.length > 0" class="space-y-3">
          <div
            v-for="rol in stats.usuariosPorRol"
            :key="rol.rol"
            class="flex items-center justify-between"
          >
            <span class="text-sm font-medium capitalize">{{ rol.rol }}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold">{{ rol.count }}</span>
              <div class="w-16 bg-secondary rounded-full h-2">
                <div
                  class="h-2 rounded-full bg-primary"
                  :style="{ width: `${(rol.count / totalUsuarios) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          <Users class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No hay datos de usuarios</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSession } from "@/composables/useSession";
import { useAdminDashboard } from "@/composables/admin/useAdminDashboard";
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  UsersIcon
} from "@heroicons/vue/24/outline";

import AdminStatsGrid from "@/components/admin/AdminStatsGrid.vue";
import AdminRecentActivity from "@/components/admin/AdminRecentActivity.vue";

const { session } = useSession();
const router = useRouter();

const {
  loading,
  error,
  stats,
  tieneDatos,
  tiempoSinActualizar,
  refrescarEstadisticas,
  totalUsuarios
} = useAdminDashboard();
</script>
