<script setup lang="ts">
import { onMounted } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useAdminUsers } from "~/composables/admin/useAdminUsers";
import type { Usuario } from "~~/shared/types/admin-usuarios";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  usuarios,
  loading,
  error,
  totalUsuarios,
  conteoRoles,
  conteoEstados,
  filtros,
  paginacion,
  paginaActual,
  debounceSearch,
  cargarUsuarios,
  recargarDatos,
  irAPagina,
  toggleEstadoUsuario,
  cambiarLimite,
  aplicarFiltros,
  getRolLabel,
  getEstadoLabel,
  formatDate
} = useAdminUsers();

onMounted(() => cargarUsuarios());

// Opciones selects
const opcionesRol = [
  { label: "Todos los roles", value: null },
  { label: "Administrador", value: "administrator" },
  { label: "Trabajador", value: "user_trabajador" },
  { label: "Empresa", value: "user_empresa" }
];
const opcionesEstado = [
  { label: "Todos los estados", value: null },
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
  { label: "Suspendido", value: "suspended" }
];
const opcionesLimite = [
  { label: "10 / pág", value: 10 },
  { label: "20 / pág", value: 20 },
  { label: "50 / pág", value: 50 },
  { label: "100 / pág", value: 100 }
];

const estadoColorMap: Record<string, "primary" | "neutral" | "destructive"> = {
  active: "primary",
  inactive: "neutral",
  suspended: "destructive"
};

const columns: TableColumn<Usuario>[] = [
  { accessorKey: "numero_documento", header: "Documento" },
  { id: "nombre_completo", header: "Nombre" },
  { accessorKey: "rol", header: "Rol" },
  { accessorKey: "estado", header: "Estado" },
  { accessorKey: "fecha_creacion", header: "Fecha Creación" },
  {
    id: "acciones",
    header: "",
    meta: { class: { th: "text-right", td: "text-right" } }
  }
];
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1
          class="text-xl font-semibold text-foreground flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-users"
            class="w-5 h-5 text-primary"
          />
          Administración de Usuarios
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Gestión de usuarios del sistema
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          :disabled="loading"
          @click="recargarDatos"
        >
          Recargar
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          to="/admin/users/create"
        >
          Nuevo Usuario
        </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        class="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">
            Total
          </p>
          <p class="text-2xl font-bold text-foreground">
            {{ totalUsuarios }}
          </p>
        </div>
        <UIcon
          name="i-lucide-users"
          class="w-7 h-7 text-primary opacity-60"
        />
      </div>
      <div
        class="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">
            Admins
          </p>
          <p class="text-2xl font-bold text-foreground">
            {{ conteoRoles.admin || 0 }}
          </p>
        </div>
        <UIcon
          name="i-lucide-shield-check"
          class="w-7 h-7 text-primary opacity-60"
        />
      </div>
      <div
        class="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">
            Activos
          </p>
          <p class="text-2xl font-bold text-foreground">
            {{ conteoEstados.active || 0 }}
          </p>
        </div>
        <UIcon
          name="i-lucide-circle-check"
          class="w-7 h-7 text-green-500 opacity-70"
        />
      </div>
      <div
        class="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">
            Inactivos
          </p>
          <p class="text-2xl font-bold text-foreground">
            {{ conteoEstados.inactive || 0 }}
          </p>
        </div>
        <UIcon
          name="i-lucide-ban"
          class="w-7 h-7 text-destructive opacity-70"
        />
      </div>
    </div>

    <!-- Filtros -->
    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Rol">
          <USelect
            v-model="filtros.rol"
            :items="opcionesRol"
            value-key="value"
            label-key="label"
            class="w-full"
            @change="aplicarFiltros"
          />
        </UFormField>
        <UFormField label="Buscar">
          <UInput
            v-model="filtros.busqueda"
            placeholder="Nombre, email..."
            icon="i-lucide-search"
            class="w-full"
            @input="debounceSearch"
          />
        </UFormField>
        <UFormField label="Estado">
          <USelect
            v-model="filtros.estado"
            :items="opcionesEstado"
            value-key="value"
            label-key="label"
            class="w-full"
            @change="aplicarFiltros"
          />
        </UFormField>
      </div>
    </UPageCard>

    <!-- Tabla -->
    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div
        class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border"
      >
        <p class="text-sm font-medium text-foreground">
          Usuarios
          <UBadge
            color="neutral"
            variant="subtle"
            class="ml-2"
          >
            {{
              totalUsuarios
            }}
          </UBadge>
        </p>
        <USelect
          v-model.number="paginacion.limit"
          :items="opcionesLimite"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-32"
          @change="cambiarLimite(paginacion.limit)"
        />
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="w-8 h-8 animate-spin text-primary"
        />
        <p class="text-sm">
          Cargando usuarios…
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="p-6"
      >
        <UAlert
          color="destructive"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="error"
        >
          <template #footer>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              @click="cargarUsuarios"
            >
              Reintentar
            </UButton>
          </template>
        </UAlert>
      </div>

      <!-- Tabla + paginación -->
      <template v-else>
        <UTable
          :data="usuarios"
          :columns="columns"
          class="w-full"
        >
          <template #numero_documento-cell="{ row }">
            <div class="flex items-center gap-1.5 text-sm">
              <UIcon
                name="i-lucide-id-card"
                class="w-4 h-4 text-muted-foreground shrink-0"
              />
              {{ row.original.numero_documento }}
            </div>
          </template>

          <template #nombre_completo-cell="{ row }">
            <p class="text-sm font-medium text-foreground">
              {{ row.original.nombres }} {{ row.original.apellidos }}
            </p>
          </template>

          <template #rol-cell="{ row }">
            <UBadge
              color="neutral"
              variant="subtle"
            >
              {{ getRolLabel(row.original.rol) }}
            </UBadge>
          </template>

          <template #estado-cell="{ row }">
            <UBadge
              :color="estadoColorMap[row.original.estado] ?? 'neutral'"
              variant="subtle"
            >
              {{ getEstadoLabel(row.original.estado) }}
            </UBadge>
          </template>

          <template #fecha_creacion-cell="{ row }">
            <div
              class="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <UIcon
                name="i-lucide-calendar"
                class="w-4 h-4 shrink-0"
              />
              {{ formatDate(row.original.fecha_creacion) }}
            </div>
          </template>

          <template #acciones-cell="{ row }">
            <div class="flex items-center justify-end gap-1">
              <UButton
                variant="ghost"
                size="sm"
                icon="i-lucide-eye"
                :to="`/admin/users/show/${row.original.id}`"
              />
              <UButton
                variant="ghost"
                size="sm"
                icon="i-lucide-pencil"
                :to="`/admin/users/edit/${row.original.id}`"
              />
              <UButton
                variant="ghost"
                size="sm"
                :icon="
                  row.original.estado === 'active'
                    ? 'i-lucide-ban'
                    : 'i-lucide-circle-check'
                "
                :color="
                  row.original.estado === 'active' ? 'destructive' : 'primary'
                "
                @click="toggleEstadoUsuario(row.original)"
              />
            </div>
          </template>
        </UTable>

        <div
          class="flex items-center justify-between px-4 py-3 border-t border-border"
        >
          <p class="text-xs text-muted-foreground">
            Mostrando {{ paginacion.offset + 1 }}–{{
              Math.min(paginacion.offset + usuarios.length, totalUsuarios)
            }}
            de {{ totalUsuarios }}
          </p>
          <UPagination
            :page="paginaActual"
            :items-per-page="paginacion.limit"
            :total="totalUsuarios"
            @update:page="irAPagina"
          />
        </div>
      </template>
    </UPageCard>
  </div>
</template>
