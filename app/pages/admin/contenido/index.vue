<script setup lang="ts">
import { useAdminContenido } from "~/composables/admin/useAdminContenido";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

// La sesión se hidrata asíncronamente desde localStorage en el cliente.
// Sin await ready, isAdministrator.value es false en el primer render
// y se redirige a /dash aunque el usuario sí sea administrador.
const { isAdministrator } = usePermissions();
const { ready } = useSession();
await ready;
if (!isAdministrator.value) {
  await navigateTo("/dash");
}

const { listarPaginas } = useAdminContenido();

interface PaginaResumen {
  slug: string
  fields: Record<string, unknown>
  sections: Record<string, unknown>
  updatedAt: string | null
}

const paginas = ref<PaginaResumen[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const slugLabels: Record<string, string> = {
  inicio: "Inicio (carrusel)",
  productos: "Productos",
  nosotros: "Nosotros",
  contacto: "Contacto"
};

const isCarruselEditor = (slug: string) => slug === "inicio";

// La sesión ya está hidratada al llegar aquí (gracias a `await ready` arriba),
// por lo que `listarPaginas()` puede enviar el token de inmediato.
const cargar = async () => {
  loading.value = true;
  error.value = null;
  try {
    paginas.value = await listarPaginas();
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al cargar las páginas";
  } finally {
    loading.value = false;
  }
};

await cargar();

const totalCampos = (pagina: PaginaResumen) =>
  Object.keys(pagina.fields || {}).length;

const totalSecciones = (pagina: PaginaResumen) =>
  Object.keys(pagina.sections || {}).length;

const formatFecha = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
};
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
          Contenido público
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Edita los textos e imágenes de las páginas públicas del sitio.
        </p>
      </div>
      <UButton icon="i-lucide-arrow-uturn-left" label="Volver" variant="ghost" to="/dash" />
    </div>

    <UAlert
      v-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="error"
    />

    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando páginas…</p>
    </div>

    <div v-else-if="paginas.length === 0" class="bg-card rounded-3xl p-12 text-center border border-border/50">
      <UIcon name="i-lucide-file-x" class="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">
        Aún no hay contenido público editable. Ejecuta el seed inicial para poblar las páginas.
      </p>
    </div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="pagina in paginas"
        :key="pagina.slug"
        :ui="{ body: 'p-5 sm:p-6 space-y-4' }"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted-foreground">/{{ pagina.slug }}</p>
            <h2 class="text-lg font-semibold text-foreground">
              {{ slugLabels[pagina.slug] || pagina.slug }}
            </h2>
          </div>
          <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary shrink-0" />
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-muted/40 rounded-xl p-3">
            <p class="text-xs text-muted-foreground">Campos</p>
            <p class="font-semibold text-foreground">{{ totalCampos(pagina) }}</p>
          </div>
          <div class="bg-muted/40 rounded-xl p-3">
            <p class="text-xs text-muted-foreground">Secciones</p>
            <p class="font-semibold text-foreground">{{ totalSecciones(pagina) }}</p>
          </div>
        </div>

        <div class="text-xs text-muted-foreground">
          Última edición:
          <span class="font-medium text-foreground">{{ formatFecha(pagina.updatedAt) }}</span>
        </div>

        <UButton
          color="primary"
          variant="soft"
          :icon="isCarruselEditor(pagina.slug) ? 'i-lucide-images' : 'i-lucide-pencil'"
          :to="isCarruselEditor(pagina.slug) ? '/admin/carrusel' : `/admin/contenido/${pagina.slug}`"
          class="w-full justify-center"
        >
          {{ isCarruselEditor(pagina.slug) ? "Editar carrusel" : "Editar" }}
        </UButton>
      </UCard>
    </div>
  </div>
</template>