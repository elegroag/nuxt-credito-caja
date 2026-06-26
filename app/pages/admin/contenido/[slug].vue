<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAdminContenido } from "~/composables/admin/useAdminContenido";
import type { CmsField, CmsFieldInput } from "~~/shared/types/cms";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const { isAdministrator } = usePermissions();
if (!isAdministrator.value) {
  navigateTo("/dash");
}

const route = useRoute();
const slug = computed(() => String(route.params.slug || ""));

const slugLabels: Record<string, string> = {
  productos: "Productos",
  nosotros: "Nosotros",
  contacto: "Contacto"
};

const { obtenerPagina, guardarPagina, subirImagen } = useAdminContenido();

interface FieldDraft {
  clave: string
  label: string
  tipo: "text" | "html" | "image" | "json"
  valor: string
  descripcion: string | null
  dirty: boolean
}

const sections = reactive<Record<string, FieldDraft[]>>({});
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const successMsg = ref<string | null>(null);
const uploadingField = ref<string | null>(null);

const slugDescripcion: Record<string, string> = {
  productos: "Página de productos: títulos, descripciones y tarjetas.",
  nosotros: "Página institucional: misión, valores y equipo.",
  contacto: "Página de contacto: información institucional y redes."
};

const inferirLabel = (campo: string): string => {
  return campo
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
};

const inferirTipo = (campo: string, rawTipo: string): "text" | "html" | "image" | "json" => {
  const allowed = ["text", "html", "image", "json"];
  if (allowed.includes(rawTipo)) return rawTipo as "text" | "html" | "image" | "json";
  if (campo.includes("imagen") || campo.includes("foto") || campo.includes("icono")) return "image";
  if (campo.includes("html") || campo.includes("descripcion_larga")) return "html";
  if (campo.includes("json") || campo.includes("lista") || campo.includes("items")) return "json";
  return "text";
};

const cargar = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await obtenerPagina(slug.value);
    for (const key of Object.keys(sections)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete sections[key];
    }

    const ordenSecciones = Object.keys(data.sections || {}).sort();
    for (const seccion of ordenSecciones) {
      const campos = Object.values(data.sections[seccion] || {});
      sections[seccion] = campos
        .sort((a, b) => a.orden - b.orden)
        .map((c: CmsField) => ({
          clave: c.clave,
          label: inferirLabel(c.clave.split(".").slice(2).join(".")),
          tipo: inferirTipo(c.clave, c.tipo),
          valor: c.valor,
          descripcion: c.descripcion,
          dirty: false
        }));
    }
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al cargar la página";
  } finally {
    loading.value = false;
  }
};

const marcarDirty = (seccion: string, idx: number) => {
  const field = sections[seccion]?.[idx];
  if (field) field.dirty = true;
};

const totalCampos = computed(() =>
  Object.values(sections).reduce((acc, items) => acc + items.length, 0)
);
const totalDirty = computed(() =>
  Object.values(sections).reduce(
    (acc, items) => acc + items.filter((f) => f.dirty).length,
    0
  )
);

const guardar = async (): Promise<void> => {
  if (totalDirty.value === 0) return;
  saving.value = true;
  error.value = null;
  successMsg.value = null;
  try {
    const fields: CmsFieldInput[] = [];
    for (const [_seccion, items] of Object.entries(sections)) {
      for (const item of items) {
        if (!item.dirty) continue;
        fields.push({
          clave: item.clave,
          valor: item.valor,
          tipo: item.tipo,
          descripcion: item.descripcion
        });
      }
    }
    await guardarPagina(slug.value, fields);
    successMsg.value = `Se guardaron ${fields.length} cambios correctamente.`;
    await cargar();
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al guardar";
  } finally {
    saving.value = false;
  }
};

const onGuardar = async (): Promise<void> => {
  await guardar();
};

const descartar = async () => {
  await cargar();
};

const onFileSelected = async (
  event: Event,
  seccion: string,
  idx: number
) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploadingField.value = `${seccion}.${idx}`;
  error.value = null;
  try {
    const result = await subirImagen(slug.value, file);
    const field = sections[seccion]?.[idx];
    if (field) {
      field.valor = result.url;
      field.dirty = true;
    }
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al subir la imagen";
  } finally {
    uploadingField.value = null;
    input.value = "";
  }
};

const sectionMeta = (key: string) => {
  return {
    title: inferirLabel(key),
    descripcion: `Edita los textos de la sección ${inferirLabel(key)}.`
  };
};

onMounted(cargar);

watch(
  () => route.params.slug,
  () => {
    if (slug.value) cargar();
  }
);
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <NuxtLink to="/admin/contenido" class="hover:underline">Contenido</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
          <span>/{{ slug }}</span>
        </div>
        <h1 class="mt-1 text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
          {{ slugLabels[slug] || slug }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ slugDescripcion[slug] || "Edita los textos de esta página." }}
        </p>
      </div>
      <UButton icon="i-lucide-arrow-uturn-left" label="Volver" variant="ghost" to="/admin/contenido" />
    </div>

    <UAlert
      v-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="error"
    />

    <UAlert
      v-if="successMsg"
      color="primary"
      variant="subtle"
      icon="i-lucide-check-circle-2"
      :title="successMsg"
    />

    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando contenido…</p>
    </div>

    <div v-else-if="totalCampos === 0" class="bg-card rounded-3xl p-12 text-center border border-border/50">
      <UIcon name="i-lucide-file-x" class="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">
        Esta página aún no tiene contenido editable. Pídele al administrador que ejecute el seed.
      </p>
    </div>

    <template v-else>
      <div
        v-for="(items, seccion) in sections"
        :key="seccion"
        class="bg-card rounded-3xl border border-border/50 p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            {{ sectionMeta(seccion).title }}
          </h2>
          <p class="text-xs text-muted-foreground mt-1">
            {{ sectionMeta(seccion).descripcion }}
          </p>
        </div>

        <div class="space-y-5">
          <div
            v-for="(item, idx) in items"
            :key="item.clave"
            class="space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <UFormField :label="item.label" class="flex-1">
                <template #help>
                  <span class="text-xs text-muted-foreground font-mono">{{ item.clave }}</span>
                </template>
              </UFormField>
              <UBadge
                v-if="item.dirty"
                color="primary"
                variant="soft"
                size="xs"
              >
                Pendiente
              </UBadge>
            </div>

            <UTextarea
              v-if="item.tipo === 'html' || item.tipo === 'json'"
              v-model="item.valor"
              :rows="item.tipo === 'json' ? 6 : 4"
              :placeholder="item.tipo === 'json' ? '[ ] o { }' : 'Contenido HTML…'"
              class="w-full font-mono text-sm"
              @update:model-value="marcarDirty(seccion, idx)"
            />

            <div v-else-if="item.tipo === 'image'" class="space-y-3">
              <div class="flex flex-wrap items-center gap-4">
                <div class="w-32 h-20 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-center overflow-hidden">
                  <img
                    v-if="item.valor"
                    :src="item.valor"
                    :alt="item.label"
                    class="w-full h-full object-cover"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  >
                  <UIcon v-else name="i-lucide-image" class="w-6 h-6 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground break-all">{{ item.valor || 'Sin imagen' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium cursor-pointer hover:bg-primary/20 transition">
                  <UIcon
                    :name="uploadingField === `${seccion}.${idx}` ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
                    :class="['w-4 h-4', uploadingField === `${seccion}.${idx}` && 'animate-spin']"
                  />
                  {{ uploadingField === `${seccion}.${idx}` ? 'Subiendo…' : 'Subir imagen' }}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    class="hidden"
                    :disabled="uploadingField !== null"
                    @change="(e) => onFileSelected(e, seccion, idx)"
                  >
                </label>
                <UInput
                  v-model="item.valor"
                  placeholder="/api/public/storage/cms/.../archivo.jpg"
                  size="sm"
                  class="flex-1"
                  @update:model-value="marcarDirty(seccion, idx)"
                />
              </div>
            </div>

            <UInput
              v-else
              v-model="item.valor"
              placeholder="Texto…"
              class="w-full"
              @update:model-value="marcarDirty(seccion, idx)"
            />
          </div>
        </div>
      </div>

      <div class="sticky bottom-4 z-10 bg-card/95 backdrop-blur rounded-2xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
        <div class="text-sm text-muted-foreground">
          <span class="font-semibold text-foreground">{{ totalDirty }}</span>
          de {{ totalCampos }} campos modificados
        </div>
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="saving || totalDirty === 0"
            @click="descartar"
          >
            Descartar
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="saving"
            :disabled="totalDirty === 0"
            @click="onGuardar"
          >
            Guardar cambios
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>