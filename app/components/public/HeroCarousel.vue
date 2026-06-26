<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useContenidoPagina } from "~/composables/public/useContenidoPagina";

interface Slide {
  id?: string
  eyebrow?: string
  titulo?: string
  titulo_acento?: string
  descripcion?: string
  imagen?: string
  primary_label?: string
  primary_href?: string
  secondary_label?: string
  secondary_href?: string
  alineacion?: "left" | "center" | "right"
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "default-1",
    eyebrow: "Comfaca Créditos",
    titulo: "Tu aliado financiero",
    titulo_acento: "de confianza",
    descripcion:
      "Más de 10 años ayudando a familias colombianas a cumplir sus sueños.",
    primary_label: "Conócenos",
    primary_href: "/about",
    secondary_label: "Contáctanos",
    secondary_href: "/contact",
    alineacion: "left"
  }
];

const { state, field, fetchContent } = await useContenidoPagina("inicio");
const cmsError = computed(() => state.value.error);

const parseList = (raw: string | undefined, fallback: Slide[]): Slide[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? (parsed as Slide[]) : fallback;
  } catch {
    return fallback;
  }
};

const cmsSlides = computed<Slide[]>(() => {
  const raw = field("carrusel", "slides")?.valor;
  return parseList(raw, []);
});

const slides = computed<Slide[]>(() =>
  cmsSlides.value.length ? cmsSlides.value : DEFAULT_SLIDES
);

const isUsingFallback = computed(
  () => cmsSlides.value.length === 0 && !cmsError.value
);

const activeIndex = ref(0);
const slidesCount = computed(() => slides.value.length);

const goTo = (idx: number) => {
  const total = slidesCount.value;
  if (!total) return;
  const next = ((idx % total) + total) % total;
  activeIndex.value = next;
};

const next = () => goTo(activeIndex.value + 1);
const prev = () => goTo(activeIndex.value - 1);

const AUTOPLAY_MS = 6000;
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

const startAutoplay = () => {
  stopAutoplay();
  if (slidesCount.value <= 1) return;
  autoplayTimer = setInterval(() => {
    next();
  }, AUTOPLAY_MS);
};

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
};

const resetAutoplay = () => {
  startAutoplay();
};

onMounted(() => {
  startAutoplay();
});

onBeforeUnmount(() => {
  stopAutoplay();
});

watch(slidesCount, () => {
  activeIndex.value = 0;
  resetAutoplay();
});

const alignClass = (align?: string) => {
  if (align === "center") return "text-center items-center";
  if (align === "right") return "text-right items-end";
  return "text-left items-start";
};
</script>

<template>
  <section
    id="inicio"
    class="relative min-h-[80vh] lg:min-h-screen w-full overflow-hidden bg-background"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <div
      class="absolute inset-0 bg-linear-to-br from-background via-background to-secondary/30 pointer-events-none"
    ></div>
    <div
      class="absolute inset-0 opacity-[0.02] pointer-events-none"
      style="
        background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);
      "
    ></div>

    <UAlert
      v-if="cmsError"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="`No se pudo cargar el carrusel: ${cmsError}`"
      class="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-xl"
    />

    <div class="relative h-full min-h-[80vh] lg:min-h-screen">
      <div
        v-for="(slide, idx) in slides"
        :key="slide.id ?? idx"
        class="absolute inset-0 transition-opacity duration-700 ease-in-out"
        :class="idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'"
        :aria-hidden="idx !== activeIndex"
      >
        <div class="relative h-full w-full">
          <img
            v-if="slide.imagen"
            :src="slide.imagen"
            :alt="slide.titulo || ''"
            class="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          >
          <div
            v-else
            class="absolute inset-0"
            style="
              background:
                radial-gradient(ellipse at top right, hsl(var(--primary) / 0.15), transparent 60%),
                radial-gradient(ellipse at bottom left, hsl(var(--accent) / 0.18), transparent 60%);
            "
          ></div>

          <div
            class="absolute inset-0"
            :class="slide.imagen ? 'bg-black/40' : 'bg-transparent'"
          ></div>

          <div
            class="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex"
          >
            <div
              class="flex flex-col justify-center gap-6 max-w-2xl"
              :class="alignClass(slide.alineacion)"
            >
              <div
                v-if="slide.eyebrow"
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium w-fit"
              >
                <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                {{ slide.eyebrow }}
              </div>

              <h1
                class="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight text-balance"
                :class="slide.imagen ? 'text-white' : 'text-foreground'"
              >
                {{ slide.titulo }}
                <span v-if="slide.titulo_acento" class="text-primary">
                  {{ slide.titulo_acento }}
                </span>
              </h1>

              <p
                v-if="slide.descripcion"
                class="text-lg max-w-xl text-pretty"
                :class="slide.imagen ? 'text-white/90' : 'text-muted-foreground'"
              >
                {{ slide.descripcion }}
              </p>

              <div
                v-if="slide.primary_label || slide.secondary_label"
                class="mt-2 flex flex-col sm:flex-row gap-4"
                :class="slide.alineacion === 'right' ? 'sm:justify-end' : slide.alineacion === 'center' ? 'sm:justify-center' : 'sm:justify-start'"
              >
                <a
                  v-if="slide.primary_label && slide.primary_href"
                  :href="slide.primary_href"
                  class="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  {{ slide.primary_label }}
                  <UIcon name="i-lucide-arrow-right" class="ml-2 w-5 h-5" />
                </a>
                <a
                  v-if="slide.secondary_label && slide.secondary_href"
                  :href="slide.secondary_href"
                  class="inline-flex items-center justify-center px-8 py-4 font-medium rounded-xl border transition-colors"
                  :class="slide.imagen
                    ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                    : 'bg-card text-foreground border-border hover:bg-secondary'"
                >
                  {{ slide.secondary_label }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UAlert
      v-if="isUsingFallback"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Mostrando slide por defecto"
      description="Edita el carrusel en /admin/contenido/inicio para mostrar contenido personalizado."
      class="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-xl"
    />

    <button
      v-if="slidesCount > 1"
      type="button"
      class="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-background/80 backdrop-blur text-foreground border border-border hover:bg-background transition-colors"
      aria-label="Slide anterior"
      @click="prev"
    >
      <UIcon name="i-lucide-chevron-left" class="w-5 h-5" />
    </button>
    <button
      v-if="slidesCount > 1"
      type="button"
      class="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center w-11 h-11 rounded-full bg-background/80 backdrop-blur text-foreground border border-border hover:bg-background transition-colors"
      aria-label="Siguiente slide"
      @click="next"
    >
      <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
    </button>

    <div
      v-if="slidesCount > 1"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      role="tablist"
      aria-label="Seleccionar slide"
    >
      <button
        v-for="(_, idx) in slides"
        :key="idx"
        type="button"
        class="h-2.5 rounded-full transition-all"
        :class="idx === activeIndex ? 'w-8 bg-primary' : 'w-2.5 bg-foreground/30 hover:bg-foreground/50'"
        :aria-label="`Ir al slide ${idx + 1}`"
        :aria-current="idx === activeIndex ? 'true' : 'false'"
        @click="goTo(idx)"
      />
    </div>

    <span
      v-if="slidesCount > 1"
      class="absolute bottom-6 right-6 z-20 text-xs text-foreground/60 font-mono"
      aria-live="polite"
    >
      {{ activeIndex + 1 }} / {{ slidesCount }}
    </span>
  </section>
</template>
