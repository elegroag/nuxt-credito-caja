<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useAdminContenido } from "~/composables/admin/useAdminContenido";
import type { CmsFieldInput } from "~~/shared/types/cms";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const { isAdministrator } = usePermissions();
const { ready } = useSession();
await ready;
if (!isAdministrator.value) {
  await navigateTo("/dash");
}

const SLUG = "inicio";
const FIELD_CLAVE = "cms.inicio.carrusel.slides";

interface Slide {
  id: string;
  eyebrow: string;
  titulo: string;
  titulo_acento: string;
  descripcion: string;
  imagen: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  alineacion: "left" | "center" | "right";
}

const { obtenerPagina, guardarPagina, subirImagen } = useAdminContenido();

const slides = reactive<Slide[]>([]);
const originalJson = ref<string>("");
const loading = ref(true);
const saving = ref(false);
const uploadingIndex = ref<number | null>(null);
const error = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const crearSlideVacia = (): Slide => ({
  id: `slide-${Date.now().toString(36)}`,
  eyebrow: "",
  titulo: "",
  titulo_acento: "",
  descripcion: "",
  imagen: "",
  primary_label: "",
  primary_href: "",
  secondary_label: "",
  secondary_href: "",
  alineacion: "left"
});

const cargar = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await obtenerPagina(SLUG);
    const field = data.fields?.["carrusel.slides"];
    if (field?.valor) {
      originalJson.value = field.valor;
      try {
        const parsed = JSON.parse(field.valor);
        if (Array.isArray(parsed) && parsed.length) {
          slides.splice(0, slides.length, ...(parsed as Slide[]));
        } else {
          slides.splice(0, slides.length, crearSlideVacia());
        }
      } catch {
        slides.splice(0, slides.length, crearSlideVacia());
      }
    } else {
      slides.splice(0, slides.length, crearSlideVacia());
    }
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al cargar el carrusel";
  } finally {
    loading.value = false;
  }
};

const agregarSlide = () => {
  slides.push(crearSlideVacia());
};

const eliminarSlide = (idx: number) => {
  slides.splice(idx, 1);
  if (slides.length === 0) {
    slides.push(crearSlideVacia());
  }
};

const moverSlide = (idx: number, dir: -1 | 1) => {
  const target = idx + dir;
  if (target < 0 || target >= slides.length) return;
  const temp = slides[idx];
  if (!temp) return;
  slides[idx] = slides[target] as Slide;
  slides[target] = temp;
};

const onImagenSeleccionada = async (event: Event, idx: number) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploadingIndex.value = idx;
  error.value = null;
  try {
    const result = await subirImagen(SLUG, file);
    const slide = slides[idx];
    if (slide) slide.imagen = result.url;
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al subir la imagen";
  } finally {
    uploadingIndex.value = null;
    input.value = "";
  }
};

const limpiarImagen = (idx: number) => {
  const slide = slides[idx];
  if (slide) slide.imagen = "";
};

const guardar = async () => {
  saving.value = true;
  error.value = null;
  successMsg.value = null;
  try {
    const slidesLimpios = slides.filter(
      (s) =>
        s.titulo.trim() ||
        s.titulo_acento.trim() ||
        s.descripcion.trim() ||
        s.imagen.trim()
    );
    const fields: CmsFieldInput[] = [
      {
        clave: FIELD_CLAVE,
        valor: JSON.stringify(slidesLimpios.length ? slidesLimpios : []),
        tipo: "json",
        descripcion: "Slides del carrusel hero de la página principal"
      }
    ];
    await guardarPagina(SLUG, fields);
    successMsg.value = `Se guardaron ${slidesLimpios.length} slide(s) correctamente.`;
    await cargar();
  } catch (e: unknown) {
    const err = e as { data?: { error?: string }; message?: string };
    error.value = err?.data?.error || err?.message || "Error al guardar";
  } finally {
    saving.value = false;
  }
};

const descartar = async () => {
  await cargar();
  successMsg.value = null;
};

const totalSlides = computed(() => slides.length);
const opcionesAlineacion = [
  { label: "Izquierda", value: "left" },
  { label: "Centro", value: "center" },
  { label: "Derecha", value: "right" }
];

// La sesión ya está hidratada arriba, por lo que cargar() puede ejecutarse
// de inmediato y enviar el token sin esperar a onMounted.
await cargar();
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <NuxtLink to="/admin/contenido" class="hover:underline">Contenido</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
          <span>Inicio</span>
        </div>
        <h1 class="mt-1 text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-images" class="w-5 h-5 text-primary" />
          Carrusel del Hero
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Edita los slides que se muestran en la página principal. Se reproducen automáticamente.
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
      <p class="text-sm">Cargando carrusel…</p>
    </div>

    <template v-else>
      <div class="space-y-6">
        <div
          v-for="(slide, idx) in slides"
          :key="slide.id || idx"
          class="bg-card rounded-3xl border border-border/50 p-6 sm:p-8 space-y-5"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="soft" size="sm">Slide {{ idx + 1 }}</UBadge>
              <span class="text-xs text-muted-foreground font-mono">{{ slide.id }}</span>
            </div>
            <div class="flex items-center gap-1">
              <UButton
                icon="i-lucide-arrow-up"
                size="xs"
                variant="ghost"
                color="neutral"
                :disabled="idx === 0"
                @click="moverSlide(idx, -1)"
              />
              <UButton
                icon="i-lucide-arrow-down"
                size="xs"
                variant="ghost"
                color="neutral"
                :disabled="idx === totalSlides - 1"
                @click="moverSlide(idx, 1)"
              />
              <UButton
                icon="i-lucide-trash"
                size="xs"
                variant="ghost"
                color="destructive"
                @click="eliminarSlide(idx)"
              />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField label="Etiqueta superior (eyebrow)">
              <UInput v-model="slide.eyebrow" placeholder="100% Online y Seguro" class="w-full" />
            </UFormField>
            <UFormField label="Alineación del texto">
              <USelectMenu
                v-model="slide.alineacion"
                :items="opcionesAlineacion"
                value-key="value"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField label="Título (parte 1)">
              <UInput v-model="slide.titulo" placeholder="El impulso que necesitas," class="w-full" />
            </UFormField>
            <UFormField label="Título (parte acentuada)">
              <UInput v-model="slide.titulo_acento" placeholder="a un clic de distancia" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Descripción">
            <UTextarea
              v-model="slide.descripcion"
              :rows="3"
              placeholder="Mensaje principal del slide"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Imagen de fondo (opcional)">
            <div class="space-y-3">
              <div class="flex items-center gap-4">
                <div class="w-32 h-20 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-center overflow-hidden">
                  <img
                    v-if="slide.imagen"
                    :src="slide.imagen"
                    :alt="slide.titulo || 'Slide'"
                    class="w-full h-full object-cover"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  >
                  <UIcon v-else name="i-lucide-image" class="w-6 h-6 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground break-all">{{ slide.imagen || "Sin imagen (fondo decorativo)" }}</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <label class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium cursor-pointer hover:bg-primary/20 transition">
                  <UIcon
                    :name="uploadingIndex === idx ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
                    :class="['w-4 h-4', uploadingIndex === idx && 'animate-spin']"
                  />
                  {{ uploadingIndex === idx ? 'Subiendo…' : 'Subir imagen' }}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    class="hidden"
                    :disabled="uploadingIndex !== null"
                    @change="(e) => onImagenSeleccionada(e, idx)"
                  >
                </label>
                <UButton
                  v-if="slide.imagen"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-x"
                  @click="limpiarImagen(idx)"
                >
                  Quitar imagen
                </UButton>
                <UInput
                  v-model="slide.imagen"
                  placeholder="/api/public/storage/cms/.../archivo.jpg"
                  size="sm"
                  class="flex-1 min-w-[200px]"
                />
              </div>
            </div>
          </UFormField>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <UFormField label="Botón principal">
                <UInput v-model="slide.primary_label" placeholder="Ver opciones" class="w-full" />
              </UFormField>
              <UFormField label="URL botón principal">
                <UInput v-model="slide.primary_href" placeholder="/products" class="w-full" />
              </UFormField>
            </div>
            <div class="space-y-2">
              <UFormField label="Botón secundario">
                <UInput v-model="slide.secondary_label" placeholder="Conoce el proceso" class="w-full" />
              </UFormField>
              <UFormField label="URL botón secundario">
                <UInput v-model="slide.secondary_href" placeholder="#proceso" class="w-full" />
              </UFormField>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-plus"
          @click="agregarSlide"
        >
          Agregar slide
        </UButton>

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="saving"
            @click="descartar"
          >
            Recargar
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="saving"
            @click="guardar"
          >
            Guardar carrusel
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>
