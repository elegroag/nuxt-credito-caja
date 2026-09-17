<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

type Permission = {
  id: number
  key: string
  etiqueta: string
  descripcion?: string | null
  activo: boolean
};

const api = useApi();
const toast = useToast();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const rows = ref<Permission[]>([]);
const total = ref(0);
const filtros = ref({ busqueda: "", activo: null as string | null });
const paginacion = ref({ page: 1, limit: 20 });
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const createOpen = ref(false);
const editOpen = ref(false);
const editing = ref<Permission | null>(null);
const createForm = ref({ key: "", etiqueta: "", descripcion: "" });
const editForm = ref({ etiqueta: "", descripcion: "", activo: true });
const deleteOpen = ref(false);
const deleting = ref<Permission | null>(null);
const deleteLoading = ref(false);

const opcionesLimite = [
  { label: "10 / pág", value: 10 },
  { label: "20 / pág", value: 20 },
  { label: "50 / pág", value: 50 },
  { label: "100 / pág", value: 100 }
];
const opcionesActivo = [
  { label: "Todos", value: null },
  { label: "Activo", value: "true" },
  { label: "Inactivo", value: "false" }
];

const columns: TableColumn<Permission>[] = [
  { accessorKey: "key", header: "Key" },
  { accessorKey: "etiqueta", header: "Etiqueta" },
  { accessorKey: "descripcion", header: "Descripción" },
  { id: "activo", header: "Estado" },
  { id: "acciones", header: "" }
];

const offset = computed(() => (paginacion.value.page - 1) * paginacion.value.limit);

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const params = new URLSearchParams({
      page: String(paginacion.value.page),
      limit: String(paginacion.value.limit)
    });
    if (filtros.value.busqueda) params.set("busqueda", filtros.value.busqueda);
    if (filtros.value.activo) params.set("activo", filtros.value.activo);

    const res = await api.getJson<{
      success: boolean
      data?: { items?: Permission[], total?: number, pagination?: { page: number, limit: number } }
      message?: string
    }>(`/api/admin/rbac/permissions?${params}`, { auth: true });

    if (!res.success) throw new Error(res.message || "No se pudieron cargar permisos");
    rows.value = res.data?.items || [];
    total.value = res.data?.total || 0;
    if (res.data?.pagination) {
      paginacion.value.page = res.data.pagination.page;
      paginacion.value.limit = res.data.pagination.limit;
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message || "Error al cargar";
  } finally {
    loading.value = false;
  }
};

const aplicarFiltros = () => {
  paginacion.value.page = 1;
  void load();
};

const debounceSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    paginacion.value.page = 1;
    void load();
  }, 350);
};

const irAPagina = (page: number) => {
  paginacion.value.page = page;
  void load();
};

const cambiarLimite = () => {
  paginacion.value.page = 1;
  void load();
};

watch(() => paginacion.value.limit, () => cambiarLimite());

const openEdit = (row: Permission) => {
  editing.value = row;
  editForm.value = {
    etiqueta: row.etiqueta,
    descripcion: row.descripcion || "",
    activo: row.activo
  };
  editOpen.value = true;
};

const saveEdit = async () => {
  if (!editing.value) return;
  saving.value = true;
  try {
    const res = await api.putJson<{ success: boolean, message?: string }>(
      `/api/admin/rbac/permissions/${editing.value.id}`,
      editForm.value,
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "Error");
    toast.add({ title: "Permiso actualizado", color: "success" });
    editOpen.value = false;
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    saving.value = false;
  }
};

const createPermission = async () => {
  saving.value = true;
  try {
    const res = await api.postJson<{ success: boolean, message?: string }>(
      "/api/admin/rbac/permissions",
      createForm.value,
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "Error");
    toast.add({ title: "Permiso creado", color: "success" });
    createOpen.value = false;
    createForm.value = { key: "", etiqueta: "", descripcion: "" };
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    saving.value = false;
  }
};

const askDelete = (row: Permission) => {
  deleting.value = row;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!deleting.value) return;
  deleteLoading.value = true;
  try {
    const res = await api.deleteJson<{ success: boolean, message?: string }>(
      `/api/admin/rbac/permissions/${deleting.value.id}`,
      {},
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "No se pudo eliminar");
    toast.add({ title: "Permiso eliminado", color: "success" });
    deleteOpen.value = false;
    deleting.value = null;
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => load());
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-key-round" class="w-5 h-5 text-primary" />
          Permisos
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Catálogo de permisos del sistema (vocabulario recurso.accion)
        </p>
      </div>
      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-refresh-cw" :loading="loading" @click="load" />
        <UButton icon="i-lucide-plus" label="Nuevo permiso" @click="createOpen = true" />
      </div>
    </div>

    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Buscar">
          <UInput
            v-model="filtros.busqueda"
            placeholder="Key, etiqueta, descripción..."
            icon="i-lucide-search"
            class="w-full"
            @update:model-value="debounceSearch"
          />
        </UFormField>
        <UFormField label="Estado">
          <USelect
            v-model="filtros.activo"
            :items="opcionesActivo"
            value-key="value"
            label-key="label"
            class="w-full"
            @update:model-value="aplicarFiltros"
          />
        </UFormField>
      </div>
    </UPageCard>

    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <p class="text-sm font-medium text-foreground">
          Permisos
          <UBadge color="neutral" variant="subtle" class="ml-2">{{ total }}</UBadge>
        </p>
        <USelect
          v-model.number="paginacion.limit"
          :items="opcionesLimite"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-32"
        />
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
        <p class="text-sm">Cargando permisos…</p>
      </div>

      <div v-else-if="error" class="p-6">
        <UAlert color="error" variant="subtle" :title="error" />
      </div>

      <div v-else-if="rows.length === 0" class="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <UIcon name="i-lucide-key-round" class="w-10 h-10 opacity-30" />
        <p class="text-sm">No se encontraron permisos</p>
      </div>

      <UTable v-else :data="rows" :columns="columns" class="w-full">
        <template #activo-cell="{ row }">
          <UBadge :color="row.original.activo ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.activo ? "Activo" : "Inactivo" }}
          </UBadge>
        </template>
        <template #acciones-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton size="sm" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row.original)" />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              :disabled="row.original.key === 'system.admin'"
              @click="askDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between px-4 py-3 border-t border-border">
        <p class="text-xs text-muted-foreground">
          Mostrando {{ total === 0 ? 0 : offset + 1 }}–{{ Math.min(offset + rows.length, total) }}
          de {{ total }}
        </p>
        <UPagination
          :page="paginacion.page"
          :items-per-page="paginacion.limit"
          :total="total"
          @update:page="irAPagina"
        />
      </div>
    </UPageCard>

    <UModal v-model:open="createOpen" title="Nuevo permiso">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Key" required hint="ej. reportes.export">
            <UInput v-model="createForm.key" placeholder="recurso.accion" />
          </UFormField>
          <UFormField label="Etiqueta" required>
            <UInput v-model="createForm.etiqueta" />
          </UFormField>
          <UFormField label="Descripción">
            <UTextarea v-model="createForm.descripcion" :rows="2" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="createOpen = false">Cancelar</UButton>
          <UButton :loading="saving" @click="createPermission">Crear</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="editOpen" title="Editar permiso">
      <template #body>
        <div v-if="editing" class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Key: <code>{{ editing.key }}</code> (no editable)
          </p>
          <UFormField label="Etiqueta">
            <UInput v-model="editForm.etiqueta" />
          </UFormField>
          <UFormField label="Descripción">
            <UTextarea v-model="editForm.descripcion" :rows="2" />
          </UFormField>
          <UCheckbox v-model="editForm.activo" label="Activo" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="editOpen = false">Cancelar</UButton>
          <UButton :loading="saving" @click="saveEdit">Guardar</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" title="Eliminar permiso">
      <template #body>
        <p class="text-sm text-muted-foreground">
          ¿Eliminar el permiso
          <strong class="text-foreground">{{ deleting?.key }}</strong>
          ({{ deleting?.etiqueta }})?
          Se quitarán también sus asignaciones a roles y módulos. Esta acción no se puede deshacer.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="deleteOpen = false">Cancelar</UButton>
          <UButton color="error" :loading="deleteLoading" @click="confirmDelete">Eliminar</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
