<template>
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <UButton variant="outline" @click="volverADetalle()" class="shrink-0">
          <ChevronLeft class="h-4 w-4 mr-2" />
          Volver a Detalles
        </UButton>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Registro de Acciones</h1>
          <p class="text-sm text-gray-500">
            Gestionar estado y notificaciones de la solicitud
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading || loadingEstados"
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

    <!-- Formulario -->
    <div v-else-if="solicitud" class="space-y-6">
      <!-- Información de la Solicitud -->
      <UCard>
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText class="h-5 w-5" />
          Información de la Solicitud
        </h2>
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
              Estado Actual
            </label>
            <div class="flex items-center gap-2 mt-1">
              <Badge
                v-if="estadoActualInfo"
                :style="{ backgroundColor: estadoActualInfo.color }"
                class="text-white"
              >
                {{ estadoActualInfo.nombre }}
              </Badge>
              <Badge v-else>
                {{ solicitud.estado }}
              </Badge>
            </div>
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
        </div>
      </UCard>

      <!-- Formulario de Acción -->
      <UCard>
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings class="h-5 w-5" />
          Cambiar Estado de la Solicitud
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Selector de Estado -->
          <div>
            <label
              for="estado"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Nuevo Estado *
            </label>
            <select
              id="estado"
              v-model="estadoSeleccionado"
              class="select select-bordered w-full"
              required
            >
              <option value="" disabled>Seleccione un estado</option>
              <option
                v-for="estado in estados"
                :key="estado.id"
                :value="estado.id"
              >
                {{ estado.nombre }} - {{ estado.descripcion }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              Seleccione el nuevo estado para esta solicitud
            </p>
          </div>

          <!-- Vista Previa del Estado -->
          <div
            v-if="estadoCambiado"
            class="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <Icon name="lucide:info" class="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 class="font-medium text-blue-900">Cambio de Estado</h3>
                <p class="text-sm text-blue-700 mt-1">
                  La solicitud pasará de
                  <strong>{{
                    estadoActualInfo?.nombre || solicitud.estado
                  }}</strong>
                  a
                  <strong>{{ getNombreEstado(estadoSeleccionado) }}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Notificación al Solicitante -->
          <div>
            <label
              for="notificacion"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Mensaje de Notificación
            </label>
            <textarea
              id="notificacion"
              v-model="notificacion"
              rows="4"
              class="textarea textarea-bordered w-full"
              placeholder="Escriba un mensaje que será enviado al solicitante sobre este cambio de estado..."
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              Este mensaje será incluido en la notificación al solicitante
              (opcional)
            </p>
          </div>

          <!-- Advertencia -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon
                name="lucide:alert-triangle"
                class="h-5 w-5 text-yellow-600 mt-0.5"
              />
              <div>
                <h3 class="font-medium text-yellow-900">Importante</h3>
                <p class="text-sm text-yellow-700 mt-1">
                  El cambio de estado actualizará el timeline de la solicitud y
                  se registrará en el historial. Esta acción no se puede
                  deshacer.
                </p>
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex flex-wrap gap-3 pt-4">
            <UButton
              type="submit"
              variant="soft"
              :disabled="loadingAccion || !estadoCambiado"
              class="gap-2"
            >
              <Icon
                v-if="loadingAccion"
                name="lucide:loader-2"
                class="h-4 w-4 animate-spin"
              />
              <Icon v-else name="lucide:save" class="h-4 w-4" />
              {{ loadingAccion ? "Guardando..." : "Registrar Acción" }}
            </UButton>

            <UButton
              type="button"
              variant="outline"
              @click="volverADetalle()"
              :disabled="loadingAccion"
            >
              Cancelar
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Timeline Reciente -->
      <UCard v-if="solicitud.timeline && solicitud.timeline.length > 0">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <History class="h-5 w-5" />
          Historial Reciente
        </h2>
        <div class="space-y-3">
          <div
            v-for="(item, index) in solicitud.timeline.slice(0, 5)"
            :key="index"
            class="flex items-start gap-3 pb-3 border-b last:border-b-0"
          >
            <div class="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ item.estado }}</p>
              <p class="text-sm text-gray-600">{{ item.detalle }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ new Date(item.fecha).toLocaleString("es-CO") }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, FileText, Settings, History } from "lucide-vue-next";

import Badge from "@/components/shared/Badge.vue";
import { useAccionesSolicitud } from "~/composables/admin/useAccionesSolicitud";

const {
  solicitud,
  estados,
  loading,
  loadingEstados,
  loadingAccion,
  error,
  estadoSeleccionado,
  notificacion,
  estadoActualInfo,
  estadoCambiado,
  cargarSolicitud,
  registrarAccion,
  getNombreEstado,
  volverADetalle,
} = useAccionesSolicitud();

const handleSubmit = async () => {
  const confirmacion = confirm(
    `¿Está seguro de cambiar el estado de la solicitud a "${getNombreEstado(estadoSeleccionado.value)}"?`,
  );

  if (!confirmacion) return;

  const resultado = await registrarAccion();

  if (resultado.success) {
    alert(resultado.message || "Estado actualizado exitosamente");
    volverADetalle();
  } else {
    alert(resultado.message || "Error al actualizar el estado");
  }
};

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});
</script>
