<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const { clearSession, isAuthenticated } = useSession();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Productos",
    to: "/products",
    active: route.path.startsWith("/products")
  },
  {
    label: "Nosotros",
    to: "/about"
  },
  {
    label: "Contacto",
    to: "/contact"
  }
]);

const isLoginPage = computed(() => route.path === "/login");
const isRegistroPage = computed(() => route.path === "/registro");

const responsiveMenu = computed(() => [
  ...items.value,
  isLoginPage.value
    ? { label: "Crear cuenta", to: "/registro", active: false }
    : { label: "Iniciar sesión", to: "/login", active: isLoginPage.value }
]);
</script>

<template>
  <UHeader>
    <template #title>
      <NuxtLink
        to="/"
        class="flex items-center gap-2"
      >
        <div
          class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <span class="text-xl font-semibold text-foreground">Comfaca Crédito</span>
      </NuxtLink>
    </template>

    <UNavigationMenu :items="items" />

    <!-- Solución Real  -->
    <ClientOnly>
      <UNavigationMenu
        v-if="isAuthenticated"
        :items="[
          {
            label: 'Dashboard',
            to: '/dash'
          }
        ]"
      />
    </ClientOnly>

    <template #right>
      <UColorModeButton />

      <UTooltip
        text="Open on GitHub"
        :kbds="['meta', 'G']"
      >
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/nuxt/ui"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>

      <ClientOnly>
        <template v-if="!isAuthenticated">
          <!-- En login: mostrar Registro -->
          <UButton
            v-if="isLoginPage"
            color="primary"
            variant="soft"
            icon="i-lucide-user-plus"
            to="/registro"
            label="Crear cuenta"
          />
          <!-- En registro: mostrar Login -->
          <UButton
            v-else="isRegistroPage"
            color="primary"
            variant="solid"
            icon="i-lucide-log-in"
            to="/login"
            label="Iniciar sesión"
          />
        </template>

        <UButton
          v-else
          variant="ghost"
          icon="i-lucide-log-out"
          label="Cerrar sesión"
          @click="clearSession"
        />
      </ClientOnly>
    </template>

    <template #body>
      <UNavigationMenu
        :items="responsiveMenu"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
