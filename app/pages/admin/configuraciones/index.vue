<template>
  <div class="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-settings" class="w-5 h-5 text-primary" />
          Configuraciones del Sistema
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">Administrar configuraciones de crédito, solicitudes y sistema</p>
      </div>
      <UButton icon="i-lucide-arrow-uturn-left" label="Volver" variant="ghost" to="/dash" />
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando configuraciones…</p>
    </div>

    <UAlert v-else-if="error" color="destructive" variant="subtle" icon="i-lucide-triangle-alert" :title="error" class="mb-6" />

    <div v-else class="space-y-6">
      <UPageCard>
        <template #header>
          <h2 class="text-lg font-semibold text-foreground">Configuraciones de Crédito</h2>
        </template>
        <div class="space-y-4">
          <ConfigField
            v-for="config in creditConfigs"
            :key="config.clave"
            :config="config"
            @update="handleUpdate"
          />
        </div>
      </UPageCard>

      <UPageCard>
        <template #header>
          <h2 class="text-lg font-semibold text-foreground">Configuraciones de Solicitudes</h2>
        </template>
        <div class="space-y-4">
          <ConfigField
            v-for="config in requestConfigs"
            :key="config.clave"
            :config="config"
            @update="handleUpdate"
          />
        </div>
      </UPageCard>

      <UPageCard>
        <template #header>
          <h2 class="text-lg font-semibold text-foreground">Configuraciones del Sistema</h2>
        </template>
        <div class="space-y-4">
          <ConfigField
            v-for="config in systemConfigs"
            :key="config.clave"
            :config="config"
            @update="handleUpdate"
          />
        </div>
      </UPageCard>
    </div>

    <UModal v-model:open="isModalOpen" title="Actualizar Configuración">
      <template #body>
        <div class="space-y-4">
          <UAlert color="neutral" variant="subtle" icon="i-lucide-info" :title="selectedConfig?.clave">
            <template #description>
              {{ selectedConfig?.descripcion }}
            </template>
          </UAlert>
          <UFormField label="Nuevo valor">
            <UInput
              v-model="newValue"
              :type="selectedConfig?.tipo === 'number' ? 'number' : 'text'"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton variant="outline" color="neutral" :disabled="isSaving" @click="isModalOpen = false">
            Cancelar
          </UButton>
          <UButton color="primary" icon="i-lucide-save" :loading="isSaving" @click="saveConfig">
            Guardar
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const { isAdministrator } = usePermissions();

if (!isAdministrator.value) {
  navigateTo("/dash");
}

const { loadConfigurations, updateConfiguration, configurations } = useConfigurations();

const isLoading = ref(true);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const isSaving = ref(false);
const selectedConfig = ref<Configuration | null>(null);
const newValue = ref("");

const creditConfigs = computed(() => configurations.value.filter((c) => c.categoria === "credito"));

const requestConfigs = computed(() =>
  configurations.value.filter((c) => c.categoria === "solicitudes")
);

const systemConfigs = computed(() => configurations.value.filter((c) => c.categoria === "sistema"));

const handleUpdate = (config: Configuration) => {
  selectedConfig.value = config;
  newValue.value = config.valor;
  isModalOpen.value = true;
};

const saveConfig = async () => {
  if (!selectedConfig.value) return;

  isSaving.value = true;
  try {
    await updateConfiguration(selectedConfig.value.clave, newValue.value);
    await loadConfigurations(true);
    isModalOpen.value = false;
  } catch (e: any) {
    error.value = e?.data?.error || "Error al guardar configuración";
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  try {
    await loadConfigurations(true);
  } catch (e) {
    error.value = "Error al cargar configuraciones";
  } finally {
    isLoading.value = false;
  }
});
</script>