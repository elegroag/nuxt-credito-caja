<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="mx-auto max-w-7xl p-4 sm:p-8">
      <div v-if="isAdministrator || isAdviser">
        <DashboardAdminAdviser />
      </div>

      <DashboardTrabajador v-if="canCreateSolicitud || (!isCodeudor && !isAdministrator && !isAdviser)" />

      <!-- Contratos como codeudor/firmante (trabajador y/o codeudor) -->
      <DashboardCodeudorResponsabilidades v-if="isCodeudor || isTrabajador" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissions } from "~/composables/usePermissions";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  isAdministrator,
  isAdviser,
  isCodeudor,
  isTrabajador,
  canCreateSolicitud
} = usePermissions();
</script>
