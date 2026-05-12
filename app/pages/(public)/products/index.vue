<script lang="ts" setup>
definePageMeta({
  layout: "public"
});

const products = [
  {
    id: 1,
    name: "Libre Inversión",
    description:
      "Haz realidad lo que tienes en mente. Sin restricciones de uso, libre destinación.",
    icon: "i-lucide-sparkles",
    color: "primary",
    featured: true,
    amount: "$1M - $50M",
    term: "12 - 60 meses"
  },
  {
    id: 2,
    name: "Vivienda",
    description:
      "El hogar de tus sueños empieza aquí. Tasas preferenciales y plazos extendidos.",
    icon: "i-lucide-home",
    color: "accent",
    amount: "$50M - $500M",
    term: "60 - 240 meses"
  },
  {
    id: 3,
    name: "Educación",
    description:
      "Invierte en tu futuro profesional. Financia tu educación o la de tu familia.",
    icon: "i-lucide-graduation-cap",
    color: "secondary",
    amount: "$1M - $30M",
    term: "12 - 48 meses"
  },
  {
    id: 4,
    name: "Turismo",
    description:
      "Escápate sin preocupaciones. Vive experiencias únicas en cualquier destino.",
    icon: "i-lucide-plane",
    color: "primary",
    amount: "$500K - $20M",
    term: "6 - 24 meses"
  },
  {
    id: 5,
    name: "Vestuario",
    description:
      "Renueva tu estilo hoy mismo. Aprobación inmediata para tu guardarropa.",
    icon: "i-lucide-shirt",
    color: "accent",
    amount: "$500K - $10M",
    term: "3 - 18 meses"
  },
  {
    id: 6,
    name: "Personalizado",
    description:
      "Soluciones a tu medida. Cuéntanos qué necesitas y lo hacemos realidad.",
    icon: "i-lucide-settings",
    color: "muted",
    amount: "A convenir",
    term: "Flexible"
  }
];

const features = [
  {
    icon: "i-lucide-zap",
    title: "Aprobación rápida",
    desc: "Respuesta en minutos"
  },
  {
    icon: "i-lucide-shield-check",
    title: "100% Seguro",
    desc: "Tus datos protegidos"
  },
  { icon: "i-lucide-file-check", title: "Sin papeleo", desc: "Todo digital" },
  { icon: "i-lucide-clock", title: "24/7", desc: "Solicita cuando quieras" }
];

const getColorClass = (color: string) => {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    accent: "bg-accent/10 text-accent group-hover:bg-accent/20",
    secondary: "bg-secondary/10 text-secondary group-hover:bg-secondary/20",
    muted: "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
  };
  return map[color] || map.primary;
};
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
          Nuestros créditos
        </h1>
        <p
          class="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Soluciones financieras diseñadas para cada momento de tu vida.
          Encuentra el crédito perfecto para ti.
        </p>

        <!-- Features -->
        <div class="pt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="bg-card rounded-2xl p-4 border border-border/50"
          >
            <UIcon
              :name="feature.icon"
              class="w-5 h-5 text-primary mx-auto mb-2"
            />
            <p class="text-sm font-medium text-foreground">
              {{ feature.title }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ feature.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="pb-20 mt-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="product in products"
            :key="product.id"
            class="group relative bg-card rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-primary/20 cursor-pointer"
          >
            <!-- Featured badge -->
            <div
              v-if="product.featured"
              class="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full"
            >
              Popular
            </div>

            <!-- Icon -->
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
              :class="getColorClass(product.color)"
            >
              <UIcon
                :name="product.icon"
                class="w-5 h-5"
              />
            </div>

            <!-- Content -->
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ product.name }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed mb-4">
              {{ product.description }}
            </p>

            <!-- Details -->
            <div
              class="flex items-center gap-4 text-xs text-muted-foreground mb-4"
            >
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-banknote"
                  class="w-3.5 h-3.5"
                />
                <span>{{ product.amount }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-calendar"
                  class="w-3.5 h-3.5"
                />
                <span>{{ product.term }}</span>
              </div>
            </div>

            <!-- CTA -->
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
            ¿Necesitas ayuda para elegir?
          </h2>
          <p class="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Nuestros asesores te guiarán para encontrar la mejor opción según
            tus necesidades.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/contact"
              color="neutral"
              variant="solid"
              size="lg"
            >
              Hablar con un asesor
            </UButton>
            <UButton
              to="/"
              color="neutral"
              variant="outline"
              size="lg"
            >
              Simular crédito
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
