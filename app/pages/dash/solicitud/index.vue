<template>
  <div class="flex min-h-[400px] items-center justify-center">
    <div class="text-center">
      <div
        class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"
      ></div>
      <p class="text-muted-foreground">Preparando solicitud...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import {
  DEFAULT_WIZARD_STEP_KEY,
  getStoredWizardStepKey,
} from "~/composables/solicitud/useWizardSolicitud";

const router = useRouter();

onMounted(async () => {
  const stepKey = process.client
    ? getStoredWizardStepKey()
    : DEFAULT_WIZARD_STEP_KEY;
  await router.replace(`/solicitud/${stepKey}`);
});
</script>
