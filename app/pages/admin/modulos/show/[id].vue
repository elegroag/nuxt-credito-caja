<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { useApi } from "~/composables/useApi";

const draggable = defineAsyncComponent(() => import("vuedraggable"));

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

type PermissionItem = {
  id: number
  key: string
  etiqueta: string
};

type ModuleDetail = {
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
  permissions: PermissionItem[]
  permission_ids: number[]
};

const route = useRoute();
const router = useRouter();
const api = useApi();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const mod = ref<ModuleDetail | null>(null);
const catalog = ref<PermissionItem[]>([]);
const assigned = ref<PermissionItem[]>([]);
const available = ref<PermissionItem[]>([]);
const filterAvailable = ref("");
const filterAssigned = ref("");
const initialIds = ref<number[]>([]);

const moduleId = computed(() => Number(route.params.id));

const dirty = computed(() => {
  const current = [...assigned.value.map(p => p.id)].sort((a, b) => a - b);
  const initial = [...initialIds.value].sort((a, b) => a - b);
  if (current.length !== initial.length) return true;
  return current.some((id, i) => id !== initial[i]);
});

const rolesList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  return [];
};

const matchesFilter = (p: PermissionItem, q: string) => {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return p.key.toLowerCase().includes(needle) || p.etiqueta.toLowerCase().includes(needle);
};

const goBack = () => {
  router.push("/admin/modulos");
};

const rebuildLists = (moduleData: ModuleDetail, allPerms: PermissionItem[]) => {
  const assignedIds = new Set(moduleData.permission_ids || []);
  assigned.value = allPerms
    .filter(p => assignedIds.has(p.id))
    .sort((a, b) => a.key.localeCompare(b.key));
  available.value = allPerms
    .filter(p => !assignedIds.has(p.id))
    .sort((a, b) => a.key.localeCompare(b.key));
  initialIds.value = assigned.value.map(p => p.id);
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    if (!Number.isFinite(moduleId.value) || moduleId.value <= 0) {
      throw new Error("ID de módulo inválido");
    }

    const [modRes, catalogRes] = await Promise.all([
      api.getJson<{ success: boolean, data?: ModuleDetail, message?: string }>(
        `/api/admin/rbac/modules/${moduleId.value}`,
        { auth: true }
      ),
      api.getJson<{ success: boolean, data?: { items?: PermissionItem[] } }>(
        "/api/admin/rbac/permissions?catalog=true",
        { auth: true }
      )
    ]);

    if (!modRes.success || !modRes.data) {
      throw new Error(modRes.message || "No se pudo cargar el módulo");
    }

    mod.value = modRes.data;
    catalog.value = catalogRes.data?.items || [];
    rebuildLists(modRes.data, catalog.value);
  } catch (e: unknown) {
    error.value = (e as Error)?.message || "Error al cargar";
    mod.value = null;
  } finally {
    loading.value = false;
  }
};

const savePermissions = async () => {
  if (!mod.value) return;
  saving.value = true;
  try {
    const res = await api.putJson<{ success: boolean, data?: ModuleDetail, message?: string, error?: string }>(
      `/api/admin/rbac/modules/${mod.value.id}`,
      { permission_ids: assigned.value.map(p => p.id) },
      { auth: true }
    );
    if (!res.success) throw new Error(res.error || res.message || "No se pudo guardar");
    if (res.data) {
      mod.value = res.data;
      rebuildLists(res.data, catalog.value);
    } else {
      initialIds.value = assigned.value.map(p => p.id);
    }
    toast.add({ title: "Permisos del módulo actualizados", color: "success" });
  } catch (e: unknown) {
    const err = e as { data?: { error?: string, message?: string }, message?: string };
    toast.add({
      title: err?.data?.error || err?.data?.message || err?.message || "Error",
      color: "error"
    });
  } finally {
    saving.value = false;
  }
};

const discardChanges = () => {
  if (!mod.value) return;
  rebuildLists(mod.value, catalog.value);
};

onMounted(() => load());
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-arrow-left"
          @click="goBack"
        />
        <div>
          <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <UIcon name="i-lucide-layout-list" class="w-5 h-5 text-primary" />
            Detalle del módulo
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Consulta y asigna permisos requeridos arrastrando entre columnas
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="load"
        />
        <UButton
          v-if="dirty"
          variant="ghost"
          color="neutral"
          label="Descartar"
          @click="discardChanges"
        />
        <UButton
          icon="i-lucide-save"
          label="Guardar permisos"
          :disabled="!dirty || !mod"
          :loading="saving"
          @click="savePermissions"
        />
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando módulo…</p>
    </div>

    <div v-else-if="error" class="space-y-4">
      <UAlert color="error" variant="subtle" :title="error" />
      <UButton variant="outline" @click="load">Reintentar</UButton>
    </div>

    <template v-else-if="mod">
      <UPageCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-1">
          <div class="flex items-start gap-4">
            <div class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon :name="mod.icon || 'i-lucide-layout-list'" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-foreground">
                {{ mod.title }}
              </h2>
              <p class="text-sm text-muted-foreground mt-0.5">
                Key: <code class="text-foreground">{{ mod.key }}</code>
              </p>
              <p v-if="mod.description" class="text-sm text-muted-foreground mt-2 max-w-xl">
                {{ mod.description }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <UBadge variant="subtle" color="neutral">{{ mod.section }}</UBadge>
            <UBadge :color="mod.active === 'S' ? 'success' : 'neutral'" variant="subtle">
              {{ mod.active === 'S' ? 'Activo' : 'Inactivo' }}
            </UBadge>
            <UBadge variant="subtle" color="primary">
              {{ assigned.length }} permiso{{ assigned.length === 1 ? '' : 's' }}
            </UBadge>
            <UBadge v-if="dirty" color="warning" variant="subtle">Sin guardar</UBadge>
          </div>
        </div>
        <dl class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-t border-border pt-4">
          <div>
            <dt class="text-muted-foreground">Ruta</dt>
            <dd class="font-medium text-foreground font-mono text-xs break-all">{{ mod.href || '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Orden</dt>
            <dd class="font-medium text-foreground">{{ mod.ordering }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">ID</dt>
            <dd class="font-medium text-foreground">{{ mod.id }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Abbr</dt>
            <dd class="font-medium text-foreground">{{ mod.abbr || '—' }}</dd>
          </div>
        </dl>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-border pt-4">
          <div>
            <dt class="text-muted-foreground mb-1">Roles requeridos</dt>
            <dd class="flex flex-wrap gap-1">
              <template v-if="rolesList(mod.required_roles).length">
                <UBadge
                  v-for="r in rolesList(mod.required_roles)"
                  :key="`req-${r}`"
                  variant="subtle"
                  color="info"
                >
                  {{ r }}
                </UBadge>
              </template>
              <span v-else class="text-muted-foreground">Ninguno</span>
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground mb-1">Roles excluidos</dt>
            <dd class="flex flex-wrap gap-1">
              <template v-if="rolesList(mod.excluded_roles).length">
                <UBadge
                  v-for="r in rolesList(mod.excluded_roles)"
                  :key="`exc-${r}`"
                  variant="subtle"
                  color="neutral"
                >
                  {{ r }}
                </UBadge>
              </template>
              <span v-else class="text-muted-foreground">Ninguno</span>
            </dd>
          </div>
        </div>
      </UPageCard>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
          <div class="px-4 pt-4 pb-3 border-b border-border space-y-3">
            <p class="text-sm font-medium text-foreground">
              Disponibles
              <UBadge color="neutral" variant="subtle" class="ml-2">{{ available.length }}</UBadge>
            </p>
            <UInput
              v-model="filterAvailable"
              placeholder="Filtrar disponibles..."
              icon="i-lucide-search"
              size="sm"
              class="w-full"
            />
            <p class="text-xs text-muted-foreground">
              Arrastra hacia «Asignados» para exigir el permiso en el módulo
            </p>
          </div>
          <ClientOnly>
            <draggable
              v-model="available"
              :group="{ name: 'module-permissions' }"
              item-key="id"
              class="min-h-72 max-h-[28rem] overflow-y-auto p-3 space-y-2 bg-muted/20"
              ghost-class="opacity-40"
              drag-class="shadow-lg"
              :disabled="!!filterAvailable.trim()"
            >
              <template #item="{ element }">
                <div
                  v-show="matchesFilter(element, filterAvailable)"
                  class="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
                >
                  <UIcon name="i-lucide-grip-vertical" class="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">{{ element.etiqueta }}</p>
                    <p class="text-xs text-muted-foreground font-mono truncate">{{ element.key }}</p>
                  </div>
                </div>
              </template>
            </draggable>
            <template #fallback>
              <div class="min-h-72 flex items-center justify-center text-sm text-muted-foreground">
                Cargando arrastre…
              </div>
            </template>
          </ClientOnly>
          <p v-if="filterAvailable.trim()" class="px-4 py-2 text-xs text-warning border-t border-border">
            Quita el filtro para arrastrar ítems
          </p>
        </UPageCard>

        <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
          <div class="px-4 pt-4 pb-3 border-b border-border space-y-3">
            <p class="text-sm font-medium text-foreground">
              Asignados (AND)
              <UBadge color="primary" variant="subtle" class="ml-2">{{ assigned.length }}</UBadge>
            </p>
            <UInput
              v-model="filterAssigned"
              placeholder="Filtrar asignados..."
              icon="i-lucide-search"
              size="sm"
              class="w-full"
            />
            <p class="text-xs text-muted-foreground">
              Arrastra hacia «Disponibles» para quitar el permiso requerido
            </p>
          </div>
          <ClientOnly>
            <draggable
              v-model="assigned"
              :group="{ name: 'module-permissions' }"
              item-key="id"
              class="min-h-72 max-h-[28rem] overflow-y-auto p-3 space-y-2 bg-primary/5"
              ghost-class="opacity-40"
              drag-class="shadow-lg"
              :disabled="!!filterAssigned.trim()"
            >
              <template #item="{ element }">
                <div
                  v-show="matchesFilter(element, filterAssigned)"
                  class="flex items-start gap-2 rounded-md border border-primary/20 bg-background px-3 py-2 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                >
                  <UIcon name="i-lucide-grip-vertical" class="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">{{ element.etiqueta }}</p>
                    <p class="text-xs text-muted-foreground font-mono truncate">{{ element.key }}</p>
                  </div>
                </div>
              </template>
            </draggable>
            <template #fallback>
              <div class="min-h-72 flex items-center justify-center text-sm text-muted-foreground">
                Cargando arrastre…
              </div>
            </template>
          </ClientOnly>
          <p v-if="filterAssigned.trim()" class="px-4 py-2 text-xs text-warning border-t border-border">
            Quita el filtro para arrastrar ítems
          </p>
        </UPageCard>
      </div>
    </template>
  </div>
</template>
