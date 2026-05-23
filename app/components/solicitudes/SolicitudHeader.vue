<template>
  <div class="space-y-4">
    <!-- Back Navigation -->
    <UButton
      variant="ghost"
      size="sm"
      class="text-muted-foreground hover:text-foreground"
      @click="router.back()"
    >
      <UIcon name="i-lucide-arrow-left" />
      Volver
    </UButton>

    <!-- Header Card -->
    <UCard
      class="overflow-hidden"
      :ui="{
        root: 'border-0 shadow-md',
        body: 'px-6 py-6 sm:px-8 sm:py-8'
      }"
    >
      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <!-- Left: Solicitud Info -->
        <div class="flex-1 min-w-0">
          <!-- Solicitud Number -->
          <div class="flex items-center gap-3 mb-2">
            <div class="flex-none">
              <div class="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <UIcon name="i-lucide-file-text" class="w-6 h-6 text-primary" />
              </div>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {{ numeroSolicitud }}
              </h1>
              <p class="text-sm text-muted-foreground mt-0.5">
                Solicitud de crédito
              </p>
            </div>
          </div>

          <!-- Estado Description -->
          <div
            v-if="estadoDescripcion"
            class="mt-4 p-4 rounded-lg bg-muted/50 border border-muted"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <p class="text-sm text-muted-foreground leading-relaxed">
                {{ estadoDescripcion }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right: Status Badge -->
        <div class="flex items-center lg:items-start">
          <UBadge
            v-if="estadoNombre"
            :color="badgeColor"
            size="lg"
            variant="subtle"
            class="font-semibold px-4 py-2"
          >
            <UIcon :name="badgeIcon" class="w-4 h-4 mr-2" />
            {{ estadoNombre }}
          </UBadge>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

interface Props {
  numeroSolicitud: string
  estadoNombre: string
  estadoColor?: string
  estadoDescripcion?: string
}

const props = withDefaults(defineProps<Props>(), {
  estadoColor: undefined,
  estadoDescripcion: undefined
});

const router = useRouter();

// Compute badge color from estado color
const badgeColor = computed<"neutral" | "destructive" | "primary" | "muted">(() => {
  if (!props.estadoColor) return "neutral";

  const colorMap: Record<string, "neutral" | "destructive" | "primary" | "muted"> = {
    "#6B7280": "neutral",
    "#3B82F6": "primary",
    "#F59E0B": "muted",
    "#10B981": "primary",
    "#EF4444": "destructive",
    "#8B5CF6": "primary",
    "#F97316": "muted"
  };

  return colorMap[props.estadoColor] || "neutral";
});

// Icon based on status
const badgeIcon = computed(() => {
  if (!props.estadoColor) return "i-lucide-circle";

  const iconMap: Record<string, string> = {
    "#6B7280": "i-lucide-circle",      // neutral
    "#3B82F6": "i-lucide-clock",       // info
    "#F59E0B": "i-lucide-hourglass",   // warning
    "#10B981": "i-lucide-check-circle", // success
    "#EF4444": "i-lucide-x-circle",    // error
    "#8B5CF6": "i-lucide-star",        // primary
    "#F97316": "i-lucide-alert-circle" // warning
  };

  return iconMap[props.estadoColor] || "i-lucide-circle";
});
</script>
