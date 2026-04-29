<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="mx-auto max-w-7xl p-4 sm:p-8">
      <!-- Vista para Administradores y Asesores -->
      <div v-if="isAdministrator || isAdviser">
        <DashboardAdminAdviser />
      </div>
      <br />
      <DashboardTrabajador />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissions } from "~/composables/usePermissions";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const { isAdministrator, isAdviser } = usePermissions();
</script>
