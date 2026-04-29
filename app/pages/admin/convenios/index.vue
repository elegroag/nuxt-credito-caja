<script setup lang="ts">
import { onMounted } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useAdminConvenios } from "~/composables/admin/useAdminConvenios";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const {
  empresas,
  loading,
  error,
  totalEmpresas,
  conteoEstados,
  filtros,
  paginacion,
  paginaActual,
  debounceSearch,
  cargarEmpresas,
  recargarDatos,
  paginaAnterior,
  paginaSiguiente,
  irAPagina,
  toggleEstadoEmpresa,
  eliminarEmpresa,
  cambiarLimite,
  aplicarFiltros,
  formatDate,
} = useAdminConvenios();

onMounted(() => cargarEmpresas());

// --- Modal importación ---
const mostrarModalImportar = ref(false);
const archivoImportar = ref<File | null>(null);
const importando = ref(false);
const resultadoImportacion = ref<Record<string, any> | null>(null);

const abrirModalImportar = () => {
  archivoImportar.value = null;
  resultadoImportacion.value = null;
  mostrarModalImportar.value = true;
};
const cerrarModalImportar = () => {
  mostrarModalImportar.value = false;
  archivoImportar.value = null;
  resultadoImportacion.value = null;
};

const manejarArchivoSeleccionado = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().match(/\.xlsx?$/)) {
    alert("Por favor, selecciona un archivo Excel (.xlsx o .xls)");
    return;
  }
  archivoImportar.value = file;
};

const importarExcel = async () => {
  if (!archivoImportar.value) return;
  try {
    importando.value = true;
    const formData = new FormData();
    formData.append("file", archivoImportar.value);
    const response = await $fetch("/api/admin/empresas-convenios/import", {
      method: "POST",
      body: formData,
    });
    resultadoImportacion.value = response as Record<string, any>;
    await recargarDatos();
    setTimeout(cerrarModalImportar, 2000);
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } };
    alert(`Error al importar: ${e.data?.message || "Error desconocido"}`);
  } finally {
    importando.value = false;
  }
};

// --- Columnas UTable ---
type Empresa = (typeof empresas.value)[number];

const columns: TableColumn<Empresa>[] = [
  {
    accessorKey: "nit",
    header: "NIT",
  },
  {
    accessorKey: "razon_social",
    header: "Razón Social",
  },
  {
    accessorKey: "representante_nombre",
    header: "Representante",
  },
  {
    accessorKey: "estado",
    header: "Estado",
  },
  {
    accessorKey: "fecha_convenio",
    header: "Fecha Convenio",
    cell: ({ row }) => formatDate(row.getValue("fecha_convenio")),
  },
  {
    accessorKey: "fecha_vencimiento",
    header: "Vencimiento",
    cell: ({ row }) => formatDate(row.getValue("fecha_vencimiento")),
  },
  {
    id: "acciones",
    header: () => "",
    meta: { class: { th: "text-right", td: "text-right" } },
  },
];

// Opciones de página
const opcionesLimite = [
  { label: "10 / pág", value: 10 },
  { label: "20 / pág", value: 20 },
  { label: "50 / pág", value: 50 },
  { label: "100 / pág", value: 100 },
];
const opcionesEstado = [
  { label: "Todos", value: null },
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
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
          <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
          Administración de Convenios
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Gestión de empresas con convenios
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-upload"
          :disabled="loading"
          @click="abrirModalImportar"
        >
          Importar Excel
        </UButton>
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
          to="/admin/convenios/create"
        >
          Nuevo Convenio
        </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        class="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wide">
            Total
          </p>
          <p class="text-2xl font-bold text-foreground">{{ totalEmpresas }}</p>
        </div>
        <UIcon
          name="i-lucide-building-2"
          class="w-8 h-8 text-primary opacity-60"
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
            {{ conteoEstados.Activo || 0 }}
          </p>
        </div>
        <UIcon
          name="i-lucide-circle-check"
          class="w-8 h-8 text-green-500 opacity-70"
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
            {{ conteoEstados.Inactivo || 0 }}
          </p>
        </div>
        <UIcon
          name="i-lucide-ban"
          class="w-8 h-8 text-destructive opacity-70"
        />
      </div>
    </div>

    <!-- Filtros -->
    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Estado">
          <USelect
            v-model="filtros.estado"
            :items="opcionesEstado"
            value-key="value"
            label-key="label"
            @change="aplicarFiltros"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Buscar">
          <UInput
            v-model="filtros.busqueda"
            placeholder="Razón social, NIT, representante..."
            icon="i-lucide-search"
            @input="debounceSearch"
            class="w-full"
          />
        </UFormField>
        <UFormField label="NIT">
          <UInput
            v-model="filtros.nit"
            placeholder="NIT de la empresa..."
            icon="i-lucide-hash"
            @input="debounceSearch"
            class="w-full"
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
          Empresas con convenios
          <UBadge color="neutral" variant="subtle" class="ml-2">{{
            totalEmpresas
          }}</UBadge>
        </p>
        <USelect
          v-model.number="paginacion.limit"
          :items="opcionesLimite"
          value-key="value"
          label-key="label"
          @change="cambiarLimite"
          size="sm"
          class="w-32"
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
        <p class="text-sm">Cargando convenios…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-6">
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
              @click="cargarEmpresas"
              >Reintentar</UButton
            >
          </template>
        </UAlert>
      </div>

      <!-- Empty -->
      <div
        v-else-if="empresas.length === 0"
        class="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground"
      >
        <UIcon name="i-lucide-building-2" class="w-10 h-10 opacity-30" />
        <p class="text-sm">No se encontraron empresas con convenios</p>
      </div>

      <!-- UTable -->
      <UTable v-else :data="empresas" :columns="columns" class="w-full">
        <template #razon_social-cell="{ row }">
          <div>
            <p class="font-medium text-foreground text-sm">
              {{ row.original.razon_social }}
            </p>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <UIcon name="i-lucide-mail" class="w-3 h-3" />
              {{ row.original.correo }}
            </p>
          </div>
        </template>

        <template #representante_nombre-cell="{ row }">
          <div>
            <p class="text-sm text-foreground">
              {{ row.original.representante_nombre }}
            </p>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <UIcon name="i-lucide-id-card" class="w-3 h-3" />
              {{ row.original.representante_documento }}
            </p>
          </div>
        </template>

        <template #estado-cell="{ row }">
          <UBadge
            :color="row.original.estado === 'Activo' ? 'primary' : 'neutral'"
            variant="subtle"
            :icon="
              row.original.estado === 'Activo'
                ? 'i-lucide-circle-check'
                : 'i-lucide-ban'
            "
          >
            {{ row.original.estado }}
          </UBadge>
        </template>

        <template #acciones-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-eye"
              :to="`/admin/convenios/show/${row.original.id}`"
            />
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-pencil"
              :to="`/admin/convenios/edit/${row.original.id}`"
            />
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                row.original.estado === 'Activo'
                  ? 'i-lucide-ban'
                  : 'i-lucide-circle-check'
              "
              :color="
                row.original.estado === 'Activo' ? 'destructive' : 'primary'
              "
              @click="toggleEstadoEmpresa(row.original)"
            />
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-trash-2"
              color="destructive"
              @click="eliminarEmpresa(row.original)"
            />
          </div>
        </template>
      </UTable>

      <!-- Paginación -->
      <div
        class="flex items-center justify-between px-4 py-3 border-t border-border"
      >
        <p class="text-xs text-muted-foreground">
          Mostrando {{ paginacion.offset + 1 }}–{{
            Math.min(paginacion.offset + empresas.length, totalEmpresas)
          }}
          de {{ totalEmpresas }}
        </p>
        <UPagination
          :page="paginaActual"
          :items-per-page="paginacion.limit"
          :total="totalEmpresas"
          @update:page="irAPagina"
        />
      </div>
    </UPageCard>

    <!-- Modal importación -->
    <UModal
      v-model:open="mostrarModalImportar"
      title="Importar Empresas desde Excel"
    >
      <template #body>
        <div v-if="!resultadoImportacion" class="space-y-4">
          <div
            class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1"
          >
            <p class="font-semibold text-foreground">Columnas requeridas:</p>
            <p>
              NIT · Razón Social · Representante Documento · Representante
              Nombre
            </p>
            <p class="font-semibold text-foreground mt-2">Opcionales:</p>
            <p>Teléfono · Correo · Fecha Vencimiento · Estado</p>
          </div>

          <UFormField label="Archivo Excel (.xlsx / .xls)">
            <UInput
              type="file"
              accept=".xlsx,.xls"
              @change="manejarArchivoSeleccionado"
              class="w-full"
            />
          </UFormField>

          <p v-if="archivoImportar" class="text-xs text-muted-foreground">
            {{ archivoImportar.name }} —
            {{ Number((archivoImportar.size / 1024).toFixed(2)) }} KB
          </p>
        </div>

        <!-- Resultado -->
        <div v-else class="space-y-4">
          <UAlert
            color="primary"
            variant="subtle"
            icon="i-lucide-circle-check"
            title="Importación completada"
            :description="resultadoImportacion.message"
          />
          <ul class="text-sm text-muted-foreground space-y-1 pl-1">
            <li>
              Total filas:
              <strong>{{ resultadoImportacion.data.total_filas }}</strong>
            </li>
            <li>
              Procesadas:
              <strong>{{ resultadoImportacion.data.procesadas }}</strong>
            </li>
            <li>
              Creadas: <strong>{{ resultadoImportacion.data.creadas }}</strong>
            </li>
            <li>
              Actualizadas:
              <strong>{{ resultadoImportacion.data.actualizadas }}</strong>
            </li>
          </ul>
          <div v-if="resultadoImportacion.data.errores.length > 0">
            <UAlert
              color="destructive"
              variant="subtle"
              icon="i-lucide-triangle-alert"
              title="Errores encontrados"
            >
              <template #description>
                <p
                  v-for="e in resultadoImportacion.data.errores.slice(0, 5)"
                  :key="e.fila"
                  class="text-xs"
                >
                  Fila {{ e.fila }}: {{ e.error }}
                </p>
                <p
                  v-if="resultadoImportacion.data.errores.length > 5"
                  class="text-xs"
                >
                  … y {{ resultadoImportacion.data.errores.length - 5 }} más
                </p>
              </template>
            </UAlert>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            variant="outline"
            color="neutral"
            :disabled="importando"
            @click="cerrarModalImportar"
          >
            Cancelar
          </UButton>
          <UButton
            v-if="!resultadoImportacion"
            color="primary"
            icon="i-lucide-upload"
            :loading="importando"
            :disabled="!archivoImportar || importando"
            @click="importarExcel"
          >
            Importar
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
