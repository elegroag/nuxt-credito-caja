<template>
  <div class="container mx-auto py-8 px-4 max-w-6xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <UButton variant="outline" @click="goBack()">
          <ChevronLeftIcon class="w-4 h-4 mr-2" />
          Volver
        </UButton>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BuildingOfficeIcon class="w-8 h-8 text-blue-500" />
            Detalle del Convenio
          </h1>
          <p class="text-sm text-gray-500">
            Información completa del convenio con {{ convenio?.razon_social }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <ArrowPathIcon class="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <p class="text-gray-500">Cargando información del convenio...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16"
    >
      <NoSymbolIcon class="w-10 h-10 text-red-500 mb-4" />
      <p class="text-red-600 mb-4">{{ error }}</p>
      <UButton variant="outline" @click="cargarConvenio">Reintentar</UButton>
    </div>

    <!-- Convenio Details -->
    <div v-else-if="convenio" class="space-y-6">
      <!-- Información Principal -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-6">
              <!-- Logo/Empresa -->
              <div class="flex-shrink-0">
                <div
                  class="h-20 w-20 rounded-lg bg-blue-100 flex items-center justify-center"
                >
                  <BuildingOfficeIcon class="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <!-- Info Principal -->
              <div>
                <h2 class="text-2xl font-bold text-gray-900">
                  {{ convenio.razon_social }}
                </h2>
                <p class="text-lg text-gray-600 mt-1">
                  NIT: {{ convenio.nit }}
                </p>
                <div class="flex items-center gap-4 mt-2">
                  <Badge :variant="getEstadoVariant(convenio.estado)">
                    {{ getEstadoLabel(convenio.estado) }}
                  </Badge>
                  <span class="text-sm text-gray-500">
                    Convenio creado: {{ formatDate(convenio.fecha_convenio) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/admin/convenios/edit/${convenio.id}`">
                <UButton variant="outline" size="sm">
                  <PencilIcon class="w-4 h-4 mr-2" />
                  Editar
                </UButton>
              </NuxtLink>
              <UButton
                variant="outline"
                size="sm"
                @click="toggleEstado"
                :class="
                  convenio.estado === 'Activo'
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-green-600 hover:text-green-700'
                "
              >
                <NoSymbolIcon
                  v-if="convenio.estado === 'Activo'"
                  class="w-4 h-4 mr-2"
                />
                <CheckIcon v-else class="w-4 h-4 mr-2" />
                {{ convenio.estado === "Activo" ? "Desactivar" : "Activar" }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Información Detallada -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Información del Representante -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6">
            <h3
              class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
            >
              <UserCircleIcon class="w-5 h-5 text-blue-500" />
              Información del Representante
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <IdentificationIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Documento</p>
                  <p class="font-medium text-gray-900">
                    {{ convenio.representante_documento }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <UserCircleIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Nombre Completo</p>
                  <p class="font-medium text-gray-900">
                    {{ convenio.representante_nombre }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información de Contacto -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6">
            <h3
              class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
            >
              <PhoneIcon class="w-5 h-5 text-blue-500" />
              Información de Contacto
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <PhoneIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Teléfono</p>
                  <p class="font-medium text-gray-900">
                    {{ convenio.telefono || "No registrado" }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <EnvelopeIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Correo Electrónico</p>
                  <p class="font-medium text-gray-900">
                    {{ convenio.correo || "No registrado" }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fechas del Convenio -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6">
            <h3
              class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
            >
              <CalendarIcon class="w-5 h-5 text-blue-500" />
              Fechas del Convenio
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <CalendarIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Fecha de Creación</p>
                  <p class="font-medium text-gray-900">
                    {{ formatDate(convenio.fecha_convenio) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <CalendarIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Fecha de Vencimiento</p>
                  <p class="font-medium text-gray-900">
                    {{
                      convenio.fecha_vencimiento
                        ? formatDate(convenio.fecha_vencimiento)
                        : "No definida"
                    }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <CheckIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Estado Actual</p>
                  <Badge :variant="getEstadoVariant(convenio.estado)">
                    {{ getEstadoLabel(convenio.estado) }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Sistema -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6">
            <h3
              class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
            >
              <CogIcon class="w-5 h-5 text-blue-500" />
              Información del Sistema
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <IdentificationIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">ID Interno</p>
                  <p class="font-medium text-gray-900 font-mono text-sm">
                    {{ convenio.id }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <CalendarIcon class="w-5 h-5 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Última Actualización</p>
                  <p class="font-medium text-gray-900">
                    {{ formatDate(convenio.updatedAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Actividad (Placeholder) -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div class="p-6">
          <h3
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <ClockIcon class="w-5 h-5 text-blue-500" />
            Historial de Actividad
          </h3>
          <div class="text-center py-8 text-gray-500">
            <ClockIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>El historial de actividad estará disponible próximamente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";

import Badge from "@/components/shared/Badge.vue";
import {
  ChevronLeftIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  PencilIcon,
  CheckIcon,
  UserCircleIcon,
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CogIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref<string | null>(null);
const convenio = ref<any>(null);

// Cargar datos del convenio
const cargarConvenio = async () => {
  loading.value = true;
  error.value = null;

  try {
    const api = useApi();
    const response = await api.getJson<any>(
      `/api/admin/empresas-convenios/${route.params.id}`,
      {
        auth: true,
      },
    );

    console.log("Respuesta del convenio:", response);

    // La respuesta del backend usa el formato success_response
    if (response && response.success && response.data) {
      convenio.value = response.data;
    } else {
      throw new Error("Estructura de respuesta inválida");
    }
  } catch (err: any) {
    console.error("Error al cargar convenio:", err);
    error.value = err.message || "Error al cargar la información del convenio";
  } finally {
    loading.value = false;
  }
};

// Cambiar estado del convenio
const toggleEstado = async () => {
  if (!convenio.value) return;

  const nuevoEstado =
    convenio.value.estado === "Activo" ? "Inactivo" : "Activo";

  try {
    const api = useApi();
    await api.putJson(
      `/api/admin/empresas-convenios/${convenio.value.id}/estado`,
      {
        estado: nuevoEstado,
      },
      { auth: true },
    );

    // Actualizar estado localmente
    convenio.value.estado = nuevoEstado;
  } catch (err: any) {
    console.error("Error al cambiar estado:", err);
    error.value = err.message || "Error al cambiar el estado del convenio";
  }
};

// Utilidades
const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    Activo: "Activo",
    Inactivo: "Inactivo",
  };
  return labels[estado] || estado;
};

const getEstadoVariant = (
  estado: string,
): "default" | "destructive" | "outline" | "secondary" => {
  const variants: Record<
    string,
    "default" | "destructive" | "outline" | "secondary"
  > = {
    Activo: "default",
    Inactivo: "destructive",
  };
  return variants[estado] || "default";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Volver a la página anterior
const goBack = () => {
  router.push("/admin/convenios");
};

// Lifecycle
onMounted(() => {
  cargarConvenio();
});
</script>
