<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto py-8 px-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-6">
        <UPageCard>
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <UButton variant="outline" @click="volver" color="neutral">
                <UIcon name="i-lucide-chevron-left" class="w-4 h-4 mr-2" />
                Volver
              </UButton>
              <div>
                <h1 class="text-2xl font-bold text-foreground">
                  Firma Digital de Solicitud
                </h1>
                <p class="text-sm text-muted-foreground">
                  Gestión de firmantes para la solicitud
                  {{ solicitud?.numero_solicitud }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-16 space-y-4"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-10 h-10 animate-spin text-primary"
        />
        <p class="text-muted-foreground">Cargando información...</p>
      </div>

      <!-- Error State -->
      <UPageCard
        v-else-if="error"
        class="max-w-2xl mx-auto border-destructive/50 bg-destructive/5"
      >
        <div class="text-center p-6">
          <UIcon
            name="i-lucide-alert-circle"
            class="w-12 h-12 text-destructive mx-auto mb-4"
          />
          <h3 class="text-xl font-bold text-destructive mb-2">
            Error al cargar la información
          </h3>
          <p class="text-destructive/80 mb-4">{{ error }}</p>
          <UButton
            color="destructive"
            variant="outline"
            @click="cargarSolicitud"
          >
            <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
            Reintentar
          </UButton>
        </div>
      </UPageCard>

      <!-- Contenido Principal -->
      <div v-else-if="solicitud" class="space-y-6">
        <!-- Información de la Solicitud -->
        <UPageCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
              >
                <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
              </div>
              <h2 class="text-xl font-bold text-foreground">
                Información de la Solicitud
              </h2>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <p class="text-sm font-medium text-muted-foreground">
                Número de Solicitud
              </p>
              <p class="text-lg font-semibold text-foreground">
                {{ solicitud.numero_solicitud || "-" }}
              </p>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-muted-foreground">
                Solicitante
              </p>
              <p class="text-lg text-foreground">
                {{
                  solicitud.solicitante?.nombres +
                    " " +
                    solicitud.solicitante?.apellidos || "-"
                }}
              </p>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-muted-foreground">Estado</p>
              <UBadge
                :color="getEstadoColor(solicitud.estado)"
                variant="subtle"
              >
                {{ solicitud.estado }}
              </UBadge>
            </div>
          </div>
        </UPageCard>

        <!-- Gestión de Firmantes -->
        <UPageCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"
              >
                <UIcon name="i-lucide-users" class="w-5 h-5 text-success" />
              </div>
              <h2 class="text-xl font-bold text-foreground">
                Gestión de Firmantes
              </h2>
            </div>
          </template>

          <GestionFirmantes
            :solicitudId="solicitud.numero_solicitud"
            :firmantes="firmantes"
          />
        </UPageCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "#imports";
import { useRoute, useRouter } from "vue-router";

import GestionFirmantes from "@/components/admin/GestionFirmantes.vue";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import type {
  SolicitudCredito,
  Firmante,
} from "#shared/types/solicitud-credito";

const route = useRoute();
const router = useRouter();
const { getJson } = useApi();
const { ready } = useSession();

// Función para obtener color del estado
const getEstadoColor = (
  estado: string,
): "primary" | "secondary" | "accent" | "destructive" | "muted" | "neutral" => {
  const estadoColors: Record<
    string,
    "primary" | "secondary" | "accent" | "destructive" | "muted" | "neutral"
  > = {
    BORRADOR: "muted",
    DOCUMENTOS_CARGADOS: "primary",
    POSTULADO: "secondary",
    ENVIADO_VALIDACION: "accent",
    EN_FIRMA: "secondary",
    FIRMADO: "primary",
    APROBADO: "primary",
    RECHAZADO: "destructive",
  };
  return estadoColors[estado] || "muted";
};

// Estado
const solicitud = ref<SolicitudCredito | null>(null);
const firmantes = ref<Firmante[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Obtener ID de la solicitud desde los parámetros
const solicitudId = computed(() => route.params.id as string);

// Cargar datos de la solicitud
const cargarSolicitud = async () => {
  loading.value = true;
  error.value = null;

  try {
    await ready;
    const response = await getJson<{
      success: boolean;
      data: SolicitudCredito;
    }>(`/api/admin/solicitudes/${solicitudId.value}`, { auth: true });

    if (response.success) {
      solicitud.value = response.data;

      // Inicializar firmantes
      if (response.data.firmantes && Array.isArray(response.data.firmantes)) {
        firmantes.value = [...response.data.firmantes];
      } else {
        firmantes.value = [];
      }
    } else {
      throw new Error("No se pudo cargar la solicitud");
    }
  } catch (e: unknown) {
    console.error("Error al cargar solicitud:", e);
    const message =
      e instanceof Error
        ? e.message
        : "No se pudo cargar la información de la solicitud.";
    error.value = message;
  } finally {
    loading.value = false;
  }
};

// Volver a la página anterior
const volver = () => {
  router.go(-1);
};

// Cargar datos al montar el componente
onMounted(() => {
  cargarSolicitud();
});

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});
</script>

<style scoped></style>
