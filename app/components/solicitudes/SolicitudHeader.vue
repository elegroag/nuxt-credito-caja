<template>
  <div class="flex items-center gap-4 mb-4">
    <UButton
      variant="ghost"
      size="sm"
      class="text-muted-foreground"
      @click="router.back()"
    >
      ← Volver a inicio
    </UButton>
  </div>
  <div class="rounded-2xl shadow-lg p-6 mb-6 bg-gradient-primary">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-secondary mb-2">
          {{ numeroSolicitud }}
        </h1>
        <p class="text-secondary-foreground">
          Información completa de la solicitud de crédito
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Badge
          :class="badgeClass"
          class="text-sm px-4 py-2 bg-gradient-accent border-0"
        >
          {{ estadoNombre }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import Badge from "@/components/shared/Badge.vue";

interface Props {
  numeroSolicitud: string
  estadoNombre: string
  badgeClass: string
}

const props = defineProps<Props>();
const router = useRouter();
</script>
