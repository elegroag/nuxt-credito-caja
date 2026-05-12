<template>
  <div class="min-h-dvh bg-background text-foreground">
    <div class="flex h-screen overflow-hidden">
      <DashboardSidebar />

      <!-- Main Content -->
      <div class="flex flex-1 flex-col overflow-hidden w-full">
        <DashboardHeader class="w-full" />

        <main class="flex-1 overflow-y-auto p-4 sm:p-6">
          <slot />
        </main>
        <DashboardFooter />

        <!-- Overlay para cerrar menú de usuario al hacer click fuera -->
        <div
          v-if="userMenuOpen"
          class="fixed inset-0 z-40"
          @click="userMenuOpen = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDashboardLayout } from "~/composables/layout/useDashboardLayout";

const { userMenuOpen } = useDashboardLayout();
</script>
