<script lang="ts" setup>
import { useContenidoPagina } from "~/composables/public/useContenidoPagina";

definePageMeta({
  layout: "public"
});

interface Product {
  id: number
  nombre: string
  descripcion: string
  monto: string
  plazo: string
  icono: string
  color: string
  destacado: boolean
}

interface Feature {
  icono: string
  titulo: string
  descripcion: string
}

interface Cta {
  titulo: string
  descripcion: string
  primary_label: string
  primary_href: string
  secondary_label: string
  secondary_href: string
}

interface Hero {
  titulo: string
  subtitulo: string
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    nombre: "Libre Inversión",
    descripcion: "Haz realidad lo que tienes en mente. Sin restricciones de uso, libre destinación.",
    icono: "i-lucide-sparkles",
    color: "primary",
    destacado: true,
    monto: "$1M - $50M",
    plazo: "12 - 60 meses"
  },
  {
    id: 2,
    nombre: "Vivienda",
    descripcion: "El hogar de tus sueños empieza aquí. Tasas preferenciales y plazos extendidos.",
    icono: "i-lucide-home",
    color: "accent",
    destacado: false,
    monto: "$50M - $500M",
    plazo: "60 - 240 meses"
  },
  {
    id: 3,
    nombre: "Educación",
    descripcion: "Invierte en tu futuro profesional. Financia tu educación o la de tu familia.",
    icono: "i-lucide-graduation-cap",
    color: "secondary",
    destacado: false,
    monto: "$1M - $30M",
    plazo: "12 - 48 meses"
  },
  {
    id: 4,
    nombre: "Turismo",
    descripcion: "Escápate sin preocupaciones. Vive experiencias únicas en cualquier destino.",
    icono: "i-lucide-plane",
    color: "primary",
    destacado: false,
    monto: "$500K - $20M",
    plazo: "6 - 24 meses"
  },
  {
    id: 5,
    nombre: "Vestuario",
    descripcion: "Renueva tu estilo hoy mismo. Aprobación inmediata para tu guardarropa.",
    icono: "i-lucide-shirt",
    color: "accent",
    destacado: false,
    monto: "$500K - $10M",
    plazo: "3 - 18 meses"
  },
  {
    id: 6,
    nombre: "Personalizado",
    descripcion: "Soluciones a tu medida. Cuéntanos qué necesitas y lo hacemos realidad.",
    icono: "i-lucide-settings",
    color: "muted",
    destacado: false,
    monto: "A convenir",
    plazo: "Flexible"
  }
];

const { state, field, fetchContent } = await useContenidoPagina("productos");
const cmsError = computed(() => state.value.error);

const parseList = (raw: string | undefined, fallback: unknown[]): unknown[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const mapProducts = (parsed: Array<Partial<Product>>): Product[] =>
  parsed.map((p, index) => ({
    id: index + 1,
    nombre: p.nombre || "",
    descripcion: p.descripcion || "",
    monto: p.monto || "",
    plazo: p.plazo || "",
    icono: p.icono || "i-lucide-sparkles",
    color: p.color || "primary",
    destacado: Boolean(p.destacado)
  }));

const cmsProducts = computed(() => {
  const raw = field("productos", "items")?.valor;
  const parsed = parseList(raw, []) as Array<Partial<Product>>;
  return parsed.length ? mapProducts(parsed) : [];
});

const products = computed<Product[]>(() =>
  cmsProducts.value.length ? cmsProducts.value : DEFAULT_PRODUCTS
);

const usingFallbackProducts = computed(
  () => cmsProducts.value.length === 0 && !cmsError.value
);

const hero = computed<Hero>(() => ({
  titulo: field("hero", "titulo")?.valor || "Nuestros créditos",
  subtitulo:
    field("hero", "subtitulo")?.valor ||
    "Soluciones financieras diseñadas para cada momento de tu vida. Encuentra el crédito perfecto para ti."
}));

const features = computed<Feature[]>(() => {
  const raw = field("features", "items")?.valor;
  const parsed = parseList(raw, []) as Feature[];
  if (parsed.length) {
    return parsed.map((f) => ({
      icono: f.icono || "i-lucide-sparkles",
      titulo: f.titulo || "",
      descripcion: f.descripcion || ""
    }));
  }
  return [
    { icono: "i-lucide-zap", titulo: "Aprobación rápida", descripcion: "Respuesta en minutos" },
    { icono: "i-lucide-shield-check", titulo: "100% Seguro", descripcion: "Tus datos protegidos" },
    { icono: "i-lucide-file-check", titulo: "Sin papeleo", descripcion: "Todo digital" },
    { icono: "i-lucide-clock", titulo: "24/7", descripcion: "Solicita cuando quieras" }
  ];
});

const cta = computed<Cta>(() => ({
  titulo: field("cta", "titulo")?.valor || "¿Necesitas ayuda para elegir?",
  descripcion:
    field("cta", "descripcion")?.valor ||
    "Nuestros asesores te guiarán para encontrar la mejor opción según tus necesidades.",
  primary_label: field("cta", "primary_label")?.valor || "Hablar con un asesor",
  primary_href: field("cta", "primary_href")?.valor || "/contact",
  secondary_label: field("cta", "secondary_label")?.valor || "Simular crédito",
  secondary_href: field("cta", "secondary_href")?.valor || "/"
}));

const getColorClass = (color: string) => {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    accent: "bg-accent/10 text-accent group-hover:bg-accent/20",
    secondary: "bg-secondary/10 text-secondary group-hover:bg-secondary/20",
    muted: "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
  };
  return map[color] || map.primary;
};

await fetchContent();
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-20 pb-16">
      <div
        class="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5"
      />
      <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1
          class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight"
        >
          {{ hero.titulo }}
        </h1>
        <p
          class="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          {{ hero.subtitulo }}
        </p>

        <!-- Features -->
        <div class="pt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="feature in features"
            :key="feature.titulo"
            class="bg-card rounded-2xl p-4 border border-border/50"
          >
            <UIcon
              :name="feature.icono"
              class="w-5 h-5 text-primary mx-auto mb-2"
            />
            <p class="text-sm font-medium text-foreground">
              {{ feature.titulo }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ feature.descripcion }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="pb-20 mt-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <UAlert
          v-if="cmsError"
          color="destructive"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="`No se pudo cargar el contenido dinámico: ${cmsError}`"
          class="mb-4"
        />
        <UAlert
          v-else-if="usingFallbackProducts"
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          title="Mostrando productos por defecto"
          description="El CMS aún no tiene productos publicados. Ejecuta pnpm db:seed o edítalos en /admin/contenido/productos."
          class="mb-4"
        />
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="product in products"
            :key="product.id"
            class="group relative bg-card rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-primary/20 cursor-pointer"
          >
            <div
              v-if="product.destacado"
              class="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full"
            >
              Popular
            </div>

            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
              :class="getColorClass(product.color)"
            >
              <UIcon
                :name="product.icono"
                class="w-5 h-5"
              />
            </div>

            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ product.nombre }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed mb-4">
              {{ product.descripcion }}
            </p>

            <div
              class="flex items-center gap-4 text-xs text-muted-foreground mb-4"
            >
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-banknote"
                  class="w-3.5 h-3.5"
                />
                <span>{{ product.monto }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-calendar"
                  class="w-3.5 h-3.5"
                />
                <span>{{ product.plazo }}</span>
              </div>
            </div>

            <div class="flex items-center text-primary text-sm font-medium">
              <span>Solicitar</span>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="pb-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-primary rounded-3xl p-8 sm:p-12 text-center">
          <h2
            class="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4"
          >
            {{ cta.titulo }}
          </h2>
          <p class="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            {{ cta.descripcion }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              :to="cta.primary_href"
              color="neutral"
              variant="solid"
              size="lg"
            >
              {{ cta.primary_label }}
            </UButton>
            <UButton
              :to="cta.secondary_href"
              color="neutral"
              variant="outline"
              size="lg"
            >
              {{ cta.secondary_label }}
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>