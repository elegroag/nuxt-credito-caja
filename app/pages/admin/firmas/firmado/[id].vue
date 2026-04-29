<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto py-8 px-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-6">
        <div
          class="rounded-2xl border border-white/60 bg-white backdrop-blur-md shadow-sm"
        >
          <div class="p-6">
            <div
              class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div class="flex items-center gap-4">
                <UButton
                  variant="outline"
                  @click="volver"
                  class="shrink-0 border-indigo-200/70 bg-white hover:bg-white"
                >
                  <ChevronLeft class="h-4 w-4 mr-2" />
                  Volver
                </UButton>
                <div>
                  <h1 class="text-2xl font-bold text-slate-900">
                    Firma Digital de Solicitud
                  </h1>
                  <p class="text-sm text-slate-500">
                    Gestión de firmantes para la solicitud
                    {{ solicitud?.numero_solicitud }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-16 space-y-4"
      >
        <Icon
          name="lucide:loader-2"
          class="w-10 h-10 animate-spin text-primary"
        />
        <p class="text-gray-500">Cargando información...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center"
      >
        <Icon
          name="lucide:alert-circle"
          class="w-8 h-8 mx-auto mb-2 text-red-500"
        />
        <h3 class="font-bold mb-1">Error al cargar la información</h3>
        <p>{{ error }}</p>
        <UButton class="mt-4" variant="outline" @click="cargarSolicitud">
          Reintentar
        </UButton>
      </div>

      <!-- Contenido Principal -->
      <div v-else-if="solicitud" class="space-y-6">
        <!-- Información de la Solicitud -->
        <UCard class="border border-indigo-100/70 shadow-sm overflow-hidden">
          <div
            class="-mx-6 -mt-6 mb-6 px-6 py-4 border-b border-indigo-100/70 bg-linear-to-r from-indigo-50 to-fuchsia-50"
          >
            <h2
              class="text-lg font-semibold flex items-center gap-2 text-slate-800"
            >
              <FileText class="h-5 w-5" />
              Información de la Solicitud
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500">
                Número de Solicitud
              </label>
              <p class="text-lg font-semibold">
                {{ solicitud.numero_solicitud || "-" }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">
                Solicitante
              </label>
              <p class="text-lg">
                {{
                  solicitud.solicitante?.nombres +
                    " " +
                    solicitud.solicitante?.apellidos || "-"
                }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500"> Estado </label>
              <p class="text-lg">
                {{ solicitud.estado }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Gestión de Firmantes -->
        <UCard class="border border-emerald-100/70 shadow-sm overflow-hidden">
          <div
            class="-mx-6 -mt-6 mb-6 px-6 py-4 border-b border-emerald-100/70 bg-linear-to-r from-emerald-50 to-teal-50"
          >
            <h2 class="text-lg font-semibold text-slate-800">
              Gestión de Firmantes
            </h2>
          </div>
          <GestionFirmantes
            :solicitudId="solicitud.numero_solicitud"
            :firmantes="firmantes"
          />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "#imports";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, FileText } from "lucide-vue-next";

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
