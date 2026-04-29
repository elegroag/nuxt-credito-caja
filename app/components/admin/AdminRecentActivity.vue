<template>
  <UCard>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Clock class="h-5 w-5 text-muted-foreground" />
        <h3 class="text-lg font-semibold">Actividad Reciente</h3>
      </div>
      <UButton
        variant="outline"
        size="sm"
        @click="$emit('refresh')"
        :disabled="loading"
      >
        <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
      </UButton>
    </div>

    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
      >
        <div class="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-muted rounded animate-pulse" />
          <div class="h-3 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>

    <div v-else-if="activities.length > 0" class="space-y-2">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10"
        >
          <component
            :is="getActivityIcon(activity.tipo)"
            class="h-4 w-4 text-primary"
          />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ activity.descripcion }}</p>
          <p class="text-xs text-muted-foreground">
            {{ formatDate(activity.fecha) }}
          </p>
        </div>

        <div class="flex items-center gap-1">
          <ChevronRight class="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-muted-foreground">
      <Clock class="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p class="text-sm">No hay actividad reciente</p>
      <p class="text-xs mt-1">Las actividades aparecerán aquí cuando ocurran</p>
    </div>

    <!-- Ver más -->
    <div v-if="activities.length > 0" class="mt-4 pt-4 border-t">
      <UButton variant="ghost" class="w-full" size="sm">
        Ver toda la actividad
        <ArrowRight class="h-4 w-4 ml-2" />
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Clock,
  RefreshCw,
  FileText,
  Users,
  Building,
  CheckCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-vue-next";

interface Activity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
}

interface Props {
  activities: Activity[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  refresh: [];
}>();

// Obtener icono según tipo de actividad
const getActivityIcon = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case "solicitud":
      return FileText;
    case "usuario":
      return Users;
    case "convenio":
      return Building;
    case "aprobacion":
      return CheckCircle;
    default:
      return Clock;
  }
};

// Formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const ahora = new Date();
  const diffMs = ahora.getTime() - date.getTime();
  const diffMinutos = Math.floor(diffMs / (1000 * 60));
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMinutos < 1) return "Ahora mismo";
  if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};
</script>
