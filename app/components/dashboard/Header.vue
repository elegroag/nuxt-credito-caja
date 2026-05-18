<template>
  <UHeader
    :ui="{
      root: 'w-full border-b border-border/50',
      container: 'w-full max-w-none px-4 sm:px-6',
      left: 'flex-1',
      center: 'hidden',
      right: 'flex items-center gap-3'
    }"
  >
    <template #left>
      <div class="flex items-center gap-2">
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-menu"
          type="button"
          class="lg:hidden"
          @click="sidebarOpen = !sidebarOpen"
        />
        <UButton
          variant="ghost"
          size="sm"
          :icon="sidebarCollapsed ? 'i-lucide-panel-left' : 'i-lucide-panel-left-close'"
          type="button"
          class="hidden lg:flex"
          @click="sidebarCollapsed = !sidebarCollapsed"
        />
        <span
          class="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          @click="navigateTo('/')"
        >
          Comfaca Crédito
        </span>
        <span class="text-muted-foreground">/</span>
        <span class="text-sm font-semibold text-foreground">{{ sectionTitle }}</span>
      </div>
    </template>

    <template #right>
      <span class="hidden text-sm text-muted-foreground sm:block">
        {{ session.user?.username || "Usuario" }}
        <span class="text-muted-foreground/60">·</span>
        <span class="text-foreground">{{
          (session.user?.roles || []).join(", ") || "sin roles"
        }}</span>
      </span>
      <UColorModeButton />

      <!-- Campana de notificaciones -->
      <NotificationBell />

      <div class="relative">
        <UButton
          variant="ghost"
          size="sm"
          class="relative h-9 w-9 rounded-full border border-border/50 p-0"
          type="button"
          @click.prevent.stop="userMenuOpen = !userMenuOpen"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-offset-background transition-colors hover:bg-primary/20"
          >
            {{ _abbr(session.user?.username || "Usuario") }}
          </div>
        </UButton>

        <div
          v-if="userMenuOpen"
          class="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <NuxtLink
            to="/dash/perfil"
            class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground group"
            @click="userMenuOpen = false"
          >
            <UIcon
              name="i-lucide-user"
              class="mr-2 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground"
            />
            <span class="font-medium">Mi Perfil</span>
          </NuxtLink>

          <div class="h-px bg-border/60 mx-1 my-1" />

          <button
            class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground group"
            @click="logout"
          >
            <UIcon
              name="i-lucide-log-out"
              class="mr-2 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground"
            />
            <span class="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </template>

    <template #body>
      <UNavigationMenu
        :items="mobileMenuItems"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
import { useDashboardLayout } from "~/composables/layout/useDashboardLayout";

const { session, sidebarOpen, sidebarCollapsed, userMenuOpen, sectionTitle, logout, _abbr } =
  useDashboardLayout();

const mobileMenuItems = computed<NavigationMenuItem[]>(() => [
  {
    label: "Mi Perfil",
    to: "/dash/perfil",
    icon: "i-lucide-user"
  },
  {
    label: "Notificaciones",
    to: "/dash/notify",
    icon: "i-lucide-bell"
  },
  {
    label: "Cerrar sesión",
    icon: "i-lucide-log-out",
    onClick: logout
  }
]);
</script>
