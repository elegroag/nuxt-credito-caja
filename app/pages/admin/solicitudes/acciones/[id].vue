<template>
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <UButton
          variant="outline"
          class="shrink-0"
          @click="volverADetalle()"
        >
          <ChevronLeft class="h-4 w-4 mr-2" />
          Volver a Detalles
        </UButton>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Registro de Acciones
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
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
      <p class="text-gray-500 dark:text-gray-400">
        Cargando información...
      </p>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="error"
    >
      <template #footer>
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          @click="cargarSolicitud"
        >
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <!-- Formulario -->
    <div
      v-else-if="solicitud"
      class="space-y-6"
    >
      <!-- Información de la Solicitud -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <FileText class="h-5 w-5" />
            Información de la Solicitud
          </h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Número de Solicitud
            </p>
            <p class="text-lg font-semibold mt-1">
              {{ solicitud.numero_solicitud || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Estado Actual
            </p>
            <div class="mt-1">
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
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Solicitante
            </p>
            <p class="text-lg font-medium mt-1">
              {{
                solicitud.solicitante?.nombres
                  + " "
                  + solicitud.solicitante?.apellidos || "-"
              }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Formulario de Acción -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <Settings class="h-5 w-5" />
            Cambiar Estado de la Solicitud
          </h2>
        </template>

        <form
          class="space-y-6"
          @submit.prevent="handleSubmit"
        >
          <UFormField label="Nuevo Estado" required>
            <USelect
              v-model="estadoSeleccionado"
              :items="estadosItems"
              value-key="value"
              label-key="label"
              class="w-full"
              placeholder="Seleccione un estado"
            />
          </UFormField>

          <!-- Vista Previa del Estado -->
          <UAlert
            v-if="estadoCambiado"
            color="primary"
            variant="subtle"
            icon="i-lucide-info"
            title="Cambio de Estado"
          >
            <template #description>
              La solicitud pasará de
              <strong>{{ estadoActualInfo?.nombre || solicitud.estado }}</strong>
              a
              <strong>{{ getNombreEstado(estadoSeleccionado) }}</strong>
            </template>
          </UAlert>

          <!-- Notificación al Solicitante -->
          <UFormField label="Mensaje de Notificación" hint="Opcional">
            <UTextarea
              v-model="notificacion"
              :rows="4"
              class="w-full"
              placeholder="Escriba un mensaje que será enviado al solicitante sobre este cambio de estado..."
            />
          </UFormField>

          <!-- Advertencia -->
          <UAlert
            color="neutral"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            title="Importante"
          >
            <template #description>
              El cambio de estado actualizará el timeline de la solicitud y se registrará en el historial. Esta acción no se puede deshacer.
            </template>
          </UAlert>

          <!-- Botones de Acción -->
          <div class="flex flex-wrap gap-3 pt-2">
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
              <Icon
                v-else
                name="lucide:save"
                class="h-4 w-4"
              />
              {{ loadingAccion ? "Guardando..." : "Registrar Acción" }}
            </UButton>

            <UButton
              type="button"
              variant="outline"
              :disabled="loadingAccion"
              @click="volverADetalle()"
            >
              Cancelar
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Timeline Reciente -->
      <UCard v-if="solicitud.timeline && solicitud.timeline.length > 0">
        <template #header>
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <History class="h-5 w-5" />
            Historial Reciente
          </h2>
        </template>
        <div class="space-y-3">
          <div
            v-for="(item, index) in solicitud.timeline.slice(0, 5)"
            :key="index"
            class="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0"
          >
            <div class="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ item.estado }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ item.detalle }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
  volverADetalle
} = useAccionesSolicitud();

// Items para USelect (formato {label, value})
const estadosItems = computed(() =>
  estados.value.map((e) => ({
    label: `${e.nombre}${e.descripcion ? ` - ${e.descripcion}` : ""}`,
    value: e.id
  }))
);

const handleSubmit = async () => {
  const confirmacion = confirm(
    `¿Está seguro de cambiar el estado de la solicitud a "${getNombreEstado(estadoSeleccionado.value)}"?`
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
  middleware: ["auth"]
});
</script>