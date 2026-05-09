<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const stats = [
  { value: "10+", label: "Años de experiencia" },
  { value: "50K+", label: "Clientes satisfechos" },
  { value: "98%", label: "Tasa de aprobación" },
  { value: "24h", label: "Tiempo de respuesta" },
];

const values = [
  {
    icon: "i-lucide-file-check",
    title: "Sin trámites",
    description:
      "Proceso 100% digital. Olvídate de las filas y el papeleo tradicional.",
  },
  {
    icon: "i-lucide-zap",
    title: "Rapidez",
    description:
      "Respuesta en minutos, no en días. Tu tiempo es lo más valioso.",
  },
  {
    icon: "i-lucide-shield-check",
    title: "Seguridad",
    description:
      "Tus datos están protegidos con los más altos estándares de seguridad.",
  },
  {
    icon: "i-lucide-handshake",
    title: "Transparencia",
    description:
      "Sin letras pequeñas. Términos claros desde el primer momento.",
  },
];

interface TeamMember {
  name: string;
  role: string;
  description: string;
}

const team: TeamMember[] = [
  {
    name: "Equipo Comfaca",
    role: "Tu aliado financiero",
    description:
      "Más de una década ayudando a familias colombianas a cumplir sus sueños.",
  },
];
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
          Tu aliado financiero
        </h1>
        <p
          class="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Más de 10 años ayudando a familias colombianas a cumplir sus sueños.
          Transparencia, rapidez y seguridad en cada crédito.
        </p>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="pb-20 mt-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="bg-card rounded-2xl p-6 text-center border border-border/50"
          >
            <p class="text-3xl sm:text-4xl font-bold text-primary">
              {{ stat.value }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="pb-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-semibold text-foreground">
            Nuestros valores
          </h2>
          <p class="mt-2 text-muted-foreground">Lo que nos define cada día</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div
            v-for="value in values"
            :key="value.title"
            class="group bg-card rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-primary/20"
          >
            <div
              class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
            >
              <UIcon :name="value.icon" class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ value.title }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ value.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="pb-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-card rounded-3xl p-8 sm:p-12 border border-border/50">
          <div class="flex flex-col sm:flex-row items-center gap-8">
            <div
              class="w-32 h-32 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0"
            >
              <UIcon name="i-lucide-users" class="w-12 h-12 text-primary" />
            </div>
            <div class="text-center sm:text-left">
              <h2 class="text-2xl font-semibold text-foreground mb-2">
                {{ team[0]?.name }}
              </h2>
              <p class="text-primary font-medium mb-3">{{ team[0]?.role }}</p>
              <p class="text-muted-foreground leading-relaxed">
                {{ team[0]?.description }}
              </p>
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
            ¿Listo para empezar?
          </h2>
          <p class="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Descubre cómo podemos ayudarte a alcanzar tus metas financieras.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton to="/products" color="neutral" variant="solid" size="lg">
              Ver productos
            </UButton>
            <UButton to="/contact" color="neutral" variant="outline" size="lg">
              Contactar
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
