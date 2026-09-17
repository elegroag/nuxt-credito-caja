<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

type ModuleRow = {
  id: number
  key: string
  title: string
  href?: string | null
  icon?: string | null
  abbr?: string | null
  section: string
  ordering: number
  active: string
  description?: string | null
  required_roles?: string[] | null
  excluded_roles?: string[] | null
  permission_ids: number[]
  permission_keys: string[]
};

const SECTIONS = [
  { label: "General", value: "General" },
  { label: "Administración", value: "Administración" },
  { label: "Parametrización", value: "Parametrización" }
];

const api = useApi();
const toast = useToast();
const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const modules = ref<ModuleRow[]>([]);
const total = ref(0);
const filtros = ref({
  busqueda: "",
  section: null as string | null,
  active: null as string | null
});
const paginacion = ref({ page: 1, limit: 20 });
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const panelOpen = ref(false);
const createOpen = ref(false);
const editing = ref<ModuleRow | null>(null);
const deleteOpen = ref(false);
const deleting = ref<ModuleRow | null>(null);
const deleteLoading = ref(false);

const emptyForm = () => ({
  title: "",
  href: "",
  icon: "i-lucide-circle",
  abbr: "",
  section: "General",
  ordering: 99,
  active: "S" as "S" | "N",
  description: "",
  required_roles_text: "",
  excluded_roles_text: ""
});

const form = ref(emptyForm());
const createForm = ref({ key: "", ...emptyForm() });

const opcionesLimite = [
  { label: "10 / pág", value: 10 },
  { label: "20 / pág", value: 20 },
  { label: "50 / pág", value: 50 },
  { label: "100 / pág", value: 100 }
];
const opcionesSeccion = [
  { label: "Todas", value: null },
  ...SECTIONS
];
const opcionesActivo = [
  { label: "Todos", value: null },
  { label: "Activo (S)", value: "S" },
  { label: "Inactivo (N)", value: "N" }
];

const columns: TableColumn<ModuleRow>[] = [
  { accessorKey: "title", header: "Título" },
  { accessorKey: "section", header: "Sección" },
  { accessorKey: "href", header: "Ruta" },
  { accessorKey: "ordering", header: "Orden" },
  { id: "activo", header: "Activo" },
  { id: "acciones", header: "" }
];

const offset = computed(() => (paginacion.value.page - 1) * paginacion.value.limit);

const parseRoles = (text: string): string[] | null => {
  const parts = text.split(",").map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const params = new URLSearchParams({
      page: String(paginacion.value.page),
      limit: String(paginacion.value.limit)
    });
    if (filtros.value.busqueda) params.set("busqueda", filtros.value.busqueda);
    if (filtros.value.section) params.set("section", filtros.value.section);
    if (filtros.value.active) params.set("active", filtros.value.active);

    const res = await api.getJson<{
      success: boolean
      data?: { items?: ModuleRow[], total?: number, pagination?: { page: number, limit: number } }
      message?: string
    }>(`/api/admin/rbac/modules?${params}`, { auth: true });

    if (!res.success) throw new Error(res.message || "No se pudieron cargar módulos");
    modules.value = res.data?.items || [];
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

const openEdit = (row: ModuleRow) => {
  editing.value = row;
  form.value = {
    title: row.title,
    href: row.href || "",
    icon: row.icon || "i-lucide-circle",
    abbr: row.abbr || "",
    section: row.section || "General",
    ordering: row.ordering,
    active: row.active === "N" ? "N" : "S",
    description: row.description || "",
    required_roles_text: Array.isArray(row.required_roles) ? row.required_roles.join(", ") : "",
    excluded_roles_text: Array.isArray(row.excluded_roles) ? row.excluded_roles.join(", ") : ""
  };
  panelOpen.value = true;
};

const openShow = (row: ModuleRow) => {
  router.push(`/admin/modulos/show/${row.id}`);
};

const saveEdit = async () => {
  if (!editing.value) return;
  saving.value = true;
  try {
    const res = await api.putJson<{ success: boolean, message?: string }>(
      `/api/admin/rbac/modules/${editing.value.id}`,
      {
        title: form.value.title,
        href: form.value.href || null,
        icon: form.value.icon || null,
        abbr: form.value.abbr || null,
        section: form.value.section,
        ordering: form.value.ordering,
        active: form.value.active,
        description: form.value.description || null,
        required_roles: parseRoles(form.value.required_roles_text),
        excluded_roles: parseRoles(form.value.excluded_roles_text)
      },
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "Error");
    toast.add({ title: "Módulo actualizado", color: "success" });
    panelOpen.value = false;
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    saving.value = false;
  }
};

const createModule = async () => {
  saving.value = true;
  try {
    const res = await api.postJson<{ success: boolean, data?: { id?: number }, message?: string }>(
      "/api/admin/rbac/modules",
      {
        key: createForm.value.key,
        title: createForm.value.title,
        href: createForm.value.href || null,
        icon: createForm.value.icon || null,
        abbr: createForm.value.abbr || null,
        section: createForm.value.section,
        ordering: createForm.value.ordering,
        active: createForm.value.active,
        description: createForm.value.description || null,
        required_roles: parseRoles(createForm.value.required_roles_text),
        excluded_roles: parseRoles(createForm.value.excluded_roles_text)
      },
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "Error");
    toast.add({ title: "Módulo creado", color: "success" });
    createOpen.value = false;
    createForm.value = { key: "", ...emptyForm() };
    const newId = res.data?.id;
    if (newId) {
      router.push(`/admin/modulos/show/${newId}`);
      return;
    }
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
  } finally {
    saving.value = false;
  }
};

const askDelete = (row: ModuleRow) => {
  deleting.value = row;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!deleting.value) return;
  deleteLoading.value = true;
  try {
    const res = await api.deleteJson<{ success: boolean, message?: string }>(
      `/api/admin/rbac/modules/${deleting.value.id}`,
      {},
      { auth: true }
    );
    if (!res.success) throw new Error(res.message || "No se pudo eliminar");
    toast.add({ title: "Módulo eliminado", color: "success" });
    deleteOpen.value = false;
    deleting.value = null;
    await load();
  } catch (e: unknown) {
    toast.add({ title: (e as Error)?.message || "Error", color: "error" });
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
          <UIcon name="i-lucide-layout-list" class="w-5 h-5 text-primary" />
          Módulos de menú
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Secciones General / Administración / Parametrización, rutas y permisos
        </p>
      </div>
      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-refresh-cw" :loading="loading" @click="load" />
        <UButton icon="i-lucide-plus" label="Nuevo módulo" @click="createOpen = true" />
      </div>
    </div>

    <UPageCard :ui="{ container: 'sm:p-4' }">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Buscar">
          <UInput
            v-model="filtros.busqueda"
            placeholder="Título, key, ruta..."
            icon="i-lucide-search"
            class="w-full"
            @update:model-value="debounceSearch"
          />
        </UFormField>
        <UFormField label="Sección">
          <USelect
            v-model="filtros.section"
            :items="opcionesSeccion"
            value-key="value"
            label-key="label"
            class="w-full"
            @update:model-value="aplicarFiltros"
          />
        </UFormField>
        <UFormField label="Activo">
          <USelect
            v-model="filtros.active"
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
          Módulos
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
        <p class="text-sm">Cargando módulos…</p>
      </div>

      <div v-else-if="error" class="p-6">
        <UAlert color="error" variant="subtle" :title="error" />
      </div>

      <div v-else-if="modules.length === 0" class="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <UIcon name="i-lucide-layout-list" class="w-10 h-10 opacity-30" />
        <p class="text-sm">No se encontraron módulos</p>
      </div>

      <UTable v-else :data="modules" :columns="columns" class="w-full">
        <template #activo-cell="{ row }">
          <UBadge :color="row.original.active === 'S' ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.active === 'S' ? 'S' : 'N' }}
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
              @click="askDelete(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between px-4 py-3 border-t border-border">
        <p class="text-xs text-muted-foreground">
          Mostrando {{ total === 0 ? 0 : offset + 1 }}–{{ Math.min(offset + modules.length, total) }}
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

    <USlideover v-model:open="panelOpen" title="Editar módulo">
      <template #body>
        <div v-if="editing" class="space-y-4 p-1">
          <p class="text-sm text-muted-foreground">
            Key: <code>{{ editing.key }}</code>
          </p>
          <UFormField label="Título">
            <UInput v-model="form.title" />
          </UFormField>
          <UFormField label="Href">
            <UInput v-model="form.href" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Icono">
              <UInput v-model="form.icon" />
            </UFormField>
            <UFormField label="Abbr">
              <UInput v-model="form.abbr" />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Sección">
              <USelect v-model="form.section" :items="SECTIONS" />
            </UFormField>
            <UFormField label="Orden">
              <UInput v-model.number="form.ordering" type="number" />
            </UFormField>
          </div>
          <UFormField label="Activo">
            <USelect
              v-model="form.active"
              :items="[
                { label: 'Sí (S)', value: 'S' },
                { label: 'No (N)', value: 'N' }
              ]"
            />
          </UFormField>
          <UFormField label="Roles requeridos (coma)" hint="OR — al menos uno">
            <UInput v-model="form.required_roles_text" placeholder="user_trabajador, adviser" />
          </UFormField>
          <UFormField label="Roles excluidos (coma)">
            <UInput v-model="form.excluded_roles_text" placeholder="user_trabajador" />
          </UFormField>
          <p class="text-xs text-muted-foreground">
            Para asignar o quitar permisos requeridos, abre el detalle del módulo.
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
          <UButton variant="ghost" @click="panelOpen = false">Cancelar</UButton>
          <UButton :loading="saving" @click="saveEdit">Guardar</UButton>
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="createOpen" title="Nuevo módulo">
      <template #body>
        <div class="space-y-4 max-h-[70vh] overflow-y-auto">
          <UFormField label="Key" required>
            <UInput v-model="createForm.key" placeholder="admin.ejemplo" />
          </UFormField>
          <UFormField label="Título" required>
            <UInput v-model="createForm.title" />
          </UFormField>
          <UFormField label="Href">
            <UInput v-model="createForm.href" placeholder="/admin/ejemplo" />
          </UFormField>
          <UFormField label="Sección">
            <USelect v-model="createForm.section" :items="SECTIONS" />
          </UFormField>
          <UFormField label="Icono">
            <UInput v-model="createForm.icon" />
          </UFormField>
          <p class="text-xs text-muted-foreground">
            Tras crear el módulo podrás asignar permisos en la vista de detalle.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="createOpen = false">Cancelar</UButton>
          <UButton :loading="saving" @click="createModule">Crear</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" title="Eliminar módulo">
      <template #body>
        <p class="text-sm text-muted-foreground">
          ¿Eliminar el módulo
          <strong class="text-foreground">{{ deleting?.title }}</strong>
          <span v-if="deleting?.key">({{ deleting.key }})</span>?
          Dejará de aparecer en el menú. Esta acción no se puede deshacer.
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
