<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

type RoleRow = {
  id: number
  nombre: string
  etiqueta?: string | null
  descripcion?: string | null
  color: string
  orden: number
  activo: boolean
  tipo: string
  permission_ids: number[]
  permission_keys: string[]
};

const api = useApi();
const toast = useToast();
const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const roles = ref<RoleRow[]>([]);
const total = ref(0);
const filtros = ref({ busqueda: "", tipo: null as string | null, activo: null as string | null });
const paginacion = ref({ page: 1, limit: 20 });
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const panelOpen = ref(false);
const editing = ref<RoleRow | null>(null);
const form = ref({
  etiqueta: "",
  descripcion: "",
  color: "#6B7280",
  orden: 0,
  activo: true,
  tipo: "sistema"
});
const createOpen = ref(false);
const createForm = ref({
  nombre: "",
  etiqueta: "",
  descripcion: "",
  color: "#6B7280",
  orden: 99,
  tipo: "sistema" as "sistema" | "firmante"
});
const deleteOpen = ref(false);
const deleting = ref<RoleRow | null>(null);
const deleteLoading = ref(false);

const opcionesLimite = [
  { label: "10 / pág", value: 10 },
  { label: "20 / pág", value: 20 },
  { label: "50 / pág", value: 50 },
  { label: "100 / pág", value: 100 }
];
const opcionesTipo = [
  { label: "Todos", value: null },
  { label: "Sistema", value: "sistema" },
  { label: "Firmante", value: "firmante" }
];
const opcionesActivo = [
  { label: "Todos", value: null },
  { label: "Activo", value: "true" },
  { label: "Inactivo", value: "false" }
];

const columns: TableColumn<RoleRow>[] = [
  { accessorKey: "nombre", header: "Nombre" },
  { accessorKey: "etiqueta", header: "Etiqueta" },
  { accessorKey: "tipo", header: "Tipo" },
  { accessorKey: "orden", header: "Orden" },
  { id: "permisos", header: "Permisos" },
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
    if (filtros.value.tipo) params.set("tipo", filtros.value.tipo);
    if (filtros.value.activo) params.set("activo", filtros.value.activo);

    const res = await api.getJson<{
      success: boolean
      data?: { items?: RoleRow[], total?: number, pagination?: { page: number, limit: number } }
      message?: string
    }>(`/api/admin/rbac/roles?${params}`, { auth: true });

    if (!res.success) throw new Error(res.message || "No se pudieron cargar roles");
    roles.value = res.data?.items || [];
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

const openEdit = (row: RoleRow) => {
  editing.value = row;
  form.value = {
    etiqueta: row.etiqueta || row.nombre,
    descripcion: row.descripcion || "",
    color: row.color || "#6B7280",
    orden: row.orden,
    activo: row.activo,
    tipo: row.tipo || "sistema"
  };
  panelOpen.value = true;
};

const openShow = (row: RoleRow) => {
  router.push(`/admin/roles/show/${row.id}`);
};

const saveEdit = async () => {
  if (!editing.value) return;
  saving.value = true;
  try {
    const res = await api.putJson<{ success: boolean, message?: string }>(
      `/api/admin/rbac/roles/${editing.value.id}`,
      form.value,
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "No se pudo guardar");
    toast.add({ title: "Rol actualizado", color: "success" });
    panelOpen.value = false;
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    saving.value = false;
  }
};

const createRole = async () => {
  saving.value = true;
  try {
    const res = await api.postJson<{ success: boolean, message?: string }>(
      "/api/admin/rbac/roles",
      createForm.value,
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "No se pudo crear");
    toast.add({ title: "Rol creado", color: "success" });
    createOpen.value = false;
    createForm.value = { nombre: "", etiqueta: "", descripcion: "", color: "#6B7280", orden: 99, tipo: "sistema" };
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    saving.value = false;
  }
};

const askDelete = (row: RoleRow) => {
  deleting.value = row;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!deleting.value) return;
  deleteLoading.value = true;
  try {
    const res = await api.deleteJson<{ success: boolean, message?: string, error?: string }>(
      `/api/admin/rbac/roles/${deleting.value.id}`,
      {},
      { auth: true }
    );
    if (!res.success) throw new Error(res.error || res.message || "No se pudo eliminar");
    toast.add({ title: "Rol eliminado", color: "success" });
    deleteOpen.value = false;
    deleting.value = null;
    await load();
  } catch (e: unknown) {
    const err = e as { data?: { error?: string, message?: string }, message?: string };
    toast.add({
      title: err?.data?.error || err?.data?.message || err?.message || "Error",
      color: "error"
    });
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(async () => {
  await load();
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary" />
          Roles del sistema
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Asignar permisos a roles de tipo sistema o firmante
        </p>
      </div>
      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-refresh-cw" :loading="loading" @click="load" />
        <UButton icon="i-lucide-plus" label="Nuevo rol" @click="createOpen = true" />
      </div>
    </div>

    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Buscar">
          <UInput
            v-model="filtros.busqueda"
            placeholder="Nombre, etiqueta, descripción..."
            icon="i-lucide-search"
            class="w-full"
            @update:model-value="debounceSearch"
          />
        </UFormField>
        <UFormField label="Tipo">
          <USelect
            v-model="filtros.tipo"
            :items="opcionesTipo"
            value-key="value"
            label-key="label"
            class="w-full"
            @update:model-value="aplicarFiltros"
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
          Roles
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
        <p class="text-sm">Cargando roles…</p>
      </div>

      <div v-else-if="error" class="p-6">
        <UAlert color="error" variant="subtle" :title="error" />
      </div>

      <div v-else-if="roles.length === 0" class="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <UIcon name="i-lucide-shield" class="w-10 h-10 opacity-30" />
        <p class="text-sm">No se encontraron roles</p>
      </div>

      <UTable v-else :data="roles" :columns="columns" class="w-full">
        <template #permisos-cell="{ row }">
          <span class="text-xs text-muted-foreground">{{ row.original.permission_keys?.length || 0 }}</span>
        </template>
        <template #activo-cell="{ row }">
          <UBadge :color="row.original.activo ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.activo ? "Activo" : "Inactivo" }}
          </UBadge>
        </template>
        <template #acciones-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              size="sm"
              variant="ghost"
              icon="i-lucide-eye"
              @click="openShow(row.original)"
            />
            <UButton size="sm" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row.original)" />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              :disabled="row.original.nombre === 'administrator'"
              @click="askDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between px-4 py-3 border-t border-border">
        <p class="text-xs text-muted-foreground">
          Mostrando {{ total === 0 ? 0 : offset + 1 }}–{{ Math.min(offset + roles.length, total) }}
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

    <USlideover v-model:open="panelOpen" title="Editar rol">
      <template #body>
        <div v-if="editing" class="space-y-4 p-1">
          <p class="text-sm text-muted-foreground">
            Clave: <code class="text-foreground">{{ editing.nombre }}</code>
          </p>
          <UFormField label="Etiqueta">
            <UInput v-model="form.etiqueta" />
          </UFormField>
          <UFormField label="Descripción">
            <UTextarea v-model="form.descripcion" :rows="2" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Color">
              <UInput v-model="form.color" />
            </UFormField>
            <UFormField label="Orden">
              <UInput v-model.number="form.orden" type="number" />
            </UFormField>
          </div>
          <UFormField label="Tipo">
            <USelect
              v-model="form.tipo"
              :items="[
                { label: 'Sistema', value: 'sistema' },
                { label: 'Firmante', value: 'firmante' }
              ]"
            />
          </UFormField>
          <UCheckbox v-model="form.activo" label="Activo" />
          <p class="text-xs text-muted-foreground">
            Para asignar o quitar permisos, abre el detalle del rol.
          </p>
          <UButton
            v-if="editing"
            variant="outline"
            color="neutral"
            icon="i-lucide-key-round"
            label="Gestionar permisos"
            block
            @click="panelOpen = false; openShow(editing)"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Cancelar" @click="panelOpen = false" />
          <UButton label="Guardar" :loading="saving" @click="saveEdit" />
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="createOpen" title="Nuevo rol">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nombre (clave)" required>
            <UInput v-model="createForm.nombre" placeholder="ej. director_regional" />
          </UFormField>
          <UFormField label="Etiqueta">
            <UInput v-model="createForm.etiqueta" />
          </UFormField>
          <UFormField label="Descripción">
            <UTextarea v-model="createForm.descripcion" :rows="2" />
          </UFormField>
          <UFormField label="Tipo">
            <USelect
              v-model="createForm.tipo"
              :items="[
                { label: 'Sistema', value: 'sistema' },
                { label: 'Firmante', value: 'firmante' }
              ]"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="createOpen = false">Cancelar</UButton>
          <UButton :loading="saving" @click="createRole">Crear</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" title="Eliminar rol">
      <template #body>
        <p class="text-sm text-muted-foreground">
          ¿Eliminar el rol
          <strong class="text-foreground">{{ deleting?.etiqueta || deleting?.nombre }}</strong>?
          Solo se permite si no hay usuarios ni firmantes asociados. También se quitarán las asignaciones de permisos. Esta acción no se puede deshacer.
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
