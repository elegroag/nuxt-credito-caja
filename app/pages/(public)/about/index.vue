<script setup lang="ts">
import { useContenidoPagina } from "~/composables/public/useContenidoPagina";

definePageMeta({
  layout: "public"
});

interface Stat {
  valor: string
  label: string
}
interface ValueItem {
  icono: string
  titulo: string
  descripcion: string
}
interface TeamMember {
  nombre: string
  rol: string
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

const { field, fetchContent } = await useContenidoPagina("nosotros");

const parseList = (raw: string | undefined, fallback: unknown[]): unknown[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const hero = computed(() => ({
  titulo: field("hero", "titulo")?.valor || "Tu aliado financiero",
  subtitulo:
    field("hero", "subtitulo")?.valor ||
    "Más de 10 años ayudando a familias colombianas a cumplir sus sueños. Transparencia, rapidez y seguridad en cada crédito."
}));

const stats = computed<Stat[]>(() => {
  const raw = field("stats", "items")?.valor;
  const parsed = parseList(raw, []) as Stat[];
  if (parsed.length) return parsed;
  return [
    { valor: "10+", label: "Años de experiencia" },
    { valor: "50K+", label: "Clientes satisfechos" },
    { valor: "98%", label: "Tasa de aprobación" },
    { valor: "24h", label: "Tiempo de respuesta" }
  ];
});

const values = computed<ValueItem[]>(() => {
  const raw = field("valores", "items")?.valor;
  const parsed = parseList(raw, []) as ValueItem[];
  if (parsed.length) {
    return parsed.map((v) => ({
      icono: v.icono || "i-lucide-file-check",
      titulo: v.titulo || "",
      descripcion: v.descripcion || ""
    }));
  }
  return [
    {
      icono: "i-lucide-file-check",
      titulo: "Sin trámites",
      descripcion: "Proceso 100% digital. Olvídate de las filas y el papeleo tradicional."
    },
    {
      icono: "i-lucide-zap",
      titulo: "Rapidez",
      descripcion: "Respuesta en minutos, no en días. Tu tiempo es lo más valioso."
    },
    {
      icono: "i-lucide-shield-check",
      titulo: "Seguridad",
      descripcion: "Tus datos están protegidos con los más altos estándares de seguridad."
    },
    {
      icono: "i-lucide-handshake",
      titulo: "Transparencia",
      descripcion: "Sin letras pequeñas. Términos claros desde el primer momento."
    }
  ];
});

const team = computed<TeamMember[]>(() => {
  const raw = field("equipo", "items")?.valor;
  const parsed = parseList(raw, []) as TeamMember[];
  if (parsed.length) return parsed;
  return [
    {
      nombre: "Equipo Comfaca",
      rol: "Tu aliado financiero",
      descripcion: "Más de una década ayudando a familias colombianas a cumplir sus sueños."
    }
  ];
});

const cta = computed<Cta>(() => ({
  titulo: field("cta", "titulo")?.valor || "¿Listo para empezar?",
  descripcion:
    field("cta", "descripcion")?.valor ||
    "Descubre cómo podemos ayudarte a alcanzar tus metas financieras.",
  primary_label: field("cta", "primary_label")?.valor || "Ver productos",
  primary_href: field("cta", "primary_href")?.valor || "/products",
  secondary_label: field("cta", "secondary_label")?.valor || "Contactar",
  secondary_href: field("cta", "secondary_href")?.valor || "/contact"
}));

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
              {{ stat.valor }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="pb-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-semibold text-foreground">
            {{ field('valores', 'titulo')?.valor || 'Nuestros valores' }}
          </h2>
          <p class="mt-2 text-muted-foreground">
            {{ field('valores', 'subtitulo')?.valor || 'Lo que nos define cada día' }}
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div
            v-for="value in values"
            :key="value.titulo"
            class="group bg-card rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-primary/20"
          >
            <div
              class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
            >
              <UIcon
                :name="value.icono"
                class="w-5 h-5 text-primary"
              />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ value.titulo }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ value.descripcion }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="pb-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-card rounded-3xl p-8 sm:p-12 border border-border/50">
          <div
            v-for="member in team"
            :key="member.nombre"
            class="flex flex-col sm:flex-row items-center gap-8"
          >
            <div
              class="w-32 h-32 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0"
            >
              <UIcon
                name="i-lucide-users"
                class="w-12 h-12 text-primary"
              />
            </div>
            <div class="text-center sm:text-left">
              <h2 class="text-2xl font-semibold text-foreground mb-2">
                {{ member.nombre }}
              </h2>
              <p class="text-primary font-medium mb-3">
                {{ member.rol }}
              </p>
              <p class="text-muted-foreground leading-relaxed">
                {{ member.descripcion }}
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