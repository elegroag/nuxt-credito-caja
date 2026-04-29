<template>
  <!-- Sidebar Desktop -->
  <aside :class="sidebarDesktopClasses">
    <div
      class="flex h-16 items-center gap-3 border-b border-sidebar-border px-6"
    >
      <div
        class="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm"
      >
        CC
      </div>
      <span
        v-if="!sidebarCollapsed"
        class="text-lg font-semibold text-sidebar-foreground"
        >Comfaca Crédito</span
      >
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <template
        v-for="(group, categoryName) in groupedNavItems"
        :key="categoryName"
      >
        <div
          v-show="!sidebarCollapsed && group.length > 0"
          class="mb-2 mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60"
        >
          {{ categoryName === "admin" ? "ADMINISTRACIÓN" : "MENÚ" }}
        </div>
        <div class="space-y-1">
          <NuxtLink
            v-for="item in group"
            :key="item.to"
            :to="item.to"
            :class="getMenuItemClasses(item.to)"
            :title="sidebarCollapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span v-show="!sidebarCollapsed">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </template>
    </nav>

    <div class="border-t border-sidebar-border p-4">
      <div
        class="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm"
        >
          {{ _abbr(session.user?.username || "Usuario") }}
        </div>
        <div v-show="!sidebarCollapsed" class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-sidebar-foreground">
            {{ session.user?.username || "Usuario" }}
          </div>
          <div class="truncate text-xs text-sidebar-foreground/60">
            {{ getPrimaryRoleDisplay }}
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Sidebar Overlay -->
  <div
    v-if="sidebarOpen"
    class="fixed inset-0 z-40 bg-black/50 lg:hidden"
    @click="sidebarOpen = false"
  />

  <!-- Mobile Sidebar -->
  <aside :class="sidebarMobileClasses">
    <div
      class="flex h-16 items-center justify-between border-b border-sidebar-border px-6"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm"
        >
          CC
        </div>
        <span class="text-lg font-semibold text-sidebar-foreground"
          >Comfaca Crédito</span
        >
      </div>
      <UButton
        variant="ghost"
        size="md"
        @click="sidebarOpen = false"
        class="text-sidebar-foreground"
      >
        <X class="h-5 w-5" />
      </UButton>
    </div>

    <nav class="overflow-y-auto px-3 py-4">
      <template
        v-for="(group, categoryName) in groupedNavItems"
        :key="categoryName"
      >
        <div
          v-show="group.length > 0"
          class="mb-2 mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60"
        >
          {{ categoryName === "admin" ? "ADMINISTRACIÓN" : "MENÚ" }}
        </div>
        <div class="space-y-1">
          <NuxtLink
            v-for="item in group"
            :key="item.to"
            :to="item.to"
            @click="sidebarOpen = false"
            :class="getMobileMenuItemClasses(item.to)"
          >
            <component :is="item.icon" class="h-5 w-5" />
            {{ item.label }}
          </NuxtLink>
        </div>
      </template>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { X } from "lucide-vue-next";
import { cn } from "@/lib/utils";

import { useDashboardLayout } from "~/composables/layout/useDashboardLayout";
import { usePermissions } from "~/composables/usePermissions";

const {
  session,
  sidebarOpen,
  sidebarCollapsed,
  navItems,
  groupedNavItems,
  isActive,
  _abbr,
} = useDashboardLayout();

const { getPrimaryRoleDisplay } = usePermissions();

const sidebarDesktopClasses = computed(() => {
  const baseClasses =
    "hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex shrink-0";
  const widthClass = sidebarCollapsed.value ? "w-16" : "w-64";
  return cn(baseClasses, widthClass);
});

const sidebarMobileClasses = computed(() => {
  const baseClasses =
    "fixed inset-y-0 left-0 z-50 w-64 h-screen transform border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:hidden";
  const transformClass = sidebarOpen.value
    ? "translate-x-0"
    : "-translate-x-full";
  return cn(baseClasses, transformClass);
});

const getMenuItemClasses = (href: string) => {
  const baseClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  const activeClasses = isActive(href)
    ? "bg-sidebar-primary text-sidebar-primary-foreground"
    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const collapsedClass = sidebarCollapsed.value ? "justify-center" : "";

  return cn(baseClasses, activeClasses, collapsedClass);
};

const getMobileMenuItemClasses = (href: string) => {
  const baseClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  const activeClasses = isActive(href)
    ? "bg-sidebar-primary text-sidebar-primary-foreground"
    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return cn(baseClasses, activeClasses);
};
</script>
