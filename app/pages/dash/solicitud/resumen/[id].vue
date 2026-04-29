<template>
  <div class="min-h-screen from-blue-50 via-white to-indigo-50">
    <!-- Header -->
    <div class="container mx-auto px-4 py-6 max-w-6xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Resumen de Solicitud
          </h1>
          <p class="text-gray-600">
            Revise toda la información antes de enviar para validación previa
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <Icon name="lucide:file-check" class="w-4 h-4" />
          <span
            >Solicitud #{{
              solicitud?.numero_solicitud || route.params.id
            }}</span
          >
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Progress Steps -->
      <SharedProgresoSteps
        current-step="completado"
        class="mb-8"
        @navigate="handleNavigation"
      />

      <!-- Loading State -->
      <div
        v-if="loadingSolicitud"
        class="flex flex-col items-center justify-center py-20 space-y-6"
      >
        <div class="relative">
          <div
            class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
          ></div>
          <Icon
            name="lucide:file-check"
            class="absolute inset-0 w-8 h-8 m-auto text-blue-600"
          />
        </div>
        <div class="text-center">
          <p class="text-lg font-medium text-gray-700">Cargando resumen...</p>
          <p class="text-sm text-gray-500 mt-1">
            Estamos preparando su información
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorSolicitud" class="max-w-2xl mx-auto">
        <div
          class="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-lg"
        >
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Icon name="lucide:alert-circle" class="w-8 h-8 text-red-600" />
          </div>
          <h3 class="text-xl font-bold text-red-900 mb-2">
            Error al cargar la solicitud
          </h3>
          <p class="text-red-700 mb-6">{{ errorSolicitud }}</p>
          <UiButton
            @click="cargarSolicitud"
            class="bg-red-600 hover:bg-red-700 text-white"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
            Reintentar
          </UiButton>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="solicitud" class="space-y-8">
        <!-- Alerta de confirmación -->
        <div class="bg-gradient-primary rounded-2xl p-8 text-white shadow-xl">
          <div class="flex items-start gap-6">
            <div
              class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0"
            >
              <Icon name="lucide:alert-triangle" class="w-6 h-6" />
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold mb-3">
                Última Revisión Antes de Enviar
              </h2>
              <p class="text-white/90 mb-4">
                Para continuar con su solicitud de crédito<strong>
                  {{
                    solicitud?.payload?.linea_credito?.detalle_modalidad || ""
                  }}</strong
                >, Una vez enviada para validación previa, algunos datos no
                podrán ser modificados.
              </p>
              <div class="flex items-center gap-2 text-white/80 text-sm">
                <Icon name="lucide:info" class="w-4 h-4" />
                <span
                  >Verifique que todos los documentos obligatorios estén
                  cargados y sean legibles</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de Datos Personales -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
              >
                <Icon name="lucide:user" class="w-5 h-5 text-blue-600" />
              </div>
              <h3 class="text-xl font-bold text-gray-900">
                Datos del Solicitante
              </h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-semibold text-gray-700 mb-3">
                  Información Personal
                </h4>
                <dl class="space-y-2">
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Nombre completo:</dt>
                    <dd class="font-medium">
                      {{ solicitud?.solicitante?.nombres || "N/A" }}
                      {{ solicitud?.solicitante?.apellidos || "N/A" }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Tipo/No. Identificación:</dt>
                    <dd class="font-medium">
                      {{ solicitud?.solicitante?.tipo_documento }} -
                      {{ solicitud?.solicitante?.numero_documento || "N/A" }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Fecha de nacimiento:</dt>
                    <dd class="font-medium">
                      {{
                        solicitud?.solicitante?.fecha_nacimiento
                          ? formatDate(solicitud?.solicitante?.fecha_nacimiento)
                          : "N/A"
                      }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Género:</dt>
                    <dd class="font-medium">
                      {{ solicitud?.solicitante?.genero || "N/A" }}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 class="font-semibold text-gray-700 mb-3">
                  Información Laboral
                </h4>
                <dl class="space-y-2">
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Categoría:</dt>
                    <dd class="font-medium">
                      {{ solicitud?.solicitante?.codigo_categoria || "N/A" }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Profesión/Ocupación:</dt>
                    <dd class="font-medium">
                      {{ solicitud?.solicitante?.cargo || "N/A" }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray-600">Nivel educativo:</dt>
                    <dd class="font-medium">
                      {{ solicitud?.solicitante?.nivel_educativo || "N/A" }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen del Crédito -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
              >
                <Icon name="lucide:calculator" class="w-5 h-5 text-green-600" />
              </div>
              <h3 class="text-xl font-bold text-gray-900">
                Detalles del Crédito
              </h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="bg-blue-50 rounded-lg p-4">
                <div class="flex items-center gap-2 text-blue-600 mb-2">
                  <Icon name="lucide:dollar-sign" class="w-4 h-4" />
                  <span class="text-sm font-medium">Valor solicitado</span>
                </div>
                <p class="text-2xl font-bold text-blue-900">
                  ${{ formatCurrencyIntl(solicitud?.valor_solicitud || 0) }}
                </p>
              </div>
              <div class="bg-green-50 rounded-lg p-4">
                <div class="flex items-center gap-2 text-green-600 mb-2">
                  <Icon name="lucide:calendar" class="w-4 h-4" />
                  <span class="text-sm font-medium">Plazo</span>
                </div>
                <p class="text-2xl font-bold text-green-900">
                  {{ solicitud?.plazo_meses || 0 }} meses
                </p>
              </div>
              <div class="bg-purple-50 rounded-lg p-4">
                <div class="flex items-center gap-2 text-purple-600 mb-2">
                  <Icon name="lucide:credit-card" class="w-4 h-4" />
                  <span class="text-sm font-medium">Cuota mensual</span>
                </div>
                <p class="text-2xl font-bold text-purple-900">
                  ${{ formatCurrencyIntl(solicitud?.cuota_mensual || 0) }}
                </p>
              </div>
            </div>
            <div class="mt-6 pt-6 border-t border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 class="font-semibold text-gray-700 mb-2">
                    Línea de Crédito
                  </h4>
                  <p class="text-gray-600">
                    {{ solicitud?.detalle_modalidad || "N/A" }}
                  </p>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-700 mb-2">
                    Tipo de Crédito
                  </h4>
                  <p class="text-gray-600">
                    {{ solicitud?.tipo_credito || "N/A" }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de Documentos -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"
                >
                  <Icon
                    name="lucide:folder-open"
                    class="w-5 h-5 text-amber-600"
                  />
                </div>
                <h3 class="text-xl font-bold text-gray-900">
                  Documentos Cargados
                </h3>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span
                  class="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium"
                >
                  {{ documentosCargados?.length || 0 }} cargados
                </span>
                <span
                  class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium"
                >
                  {{
                    documentosRequeridos?.filter((d) => d.obligatorio).length ||
                    0
                  }}
                  obligatorios
                </span>
              </div>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="documento in documentosCargados"
                :key="documento.id"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
                >
                  <Icon
                    name="lucide:file-text"
                    class="w-4 h-4 text-green-600"
                  />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900">
                    {{ documento.nombre_original }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ documento.saved_filename || documento.nombre_original }}
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <Icon
                    name="lucide:check-circle"
                    class="w-5 h-5 text-green-500"
                  />
                </div>
              </div>
            </div>
            <div
              v-if="!documentosCargados?.length"
              class="text-center py-8 text-gray-500"
            >
              <Icon
                name="lucide:inbox"
                class="w-12 h-12 mx-auto mb-3 text-gray-400"
              />
              <p>No se han cargado documentos</p>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div
          class="flex flex-col md:flex-row gap-4 justify-between items-center"
        >
          <UiButton
            @click="handleBack"
            variant="outline"
            class="w-full md:w-auto gap-2 h-12 px-6"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4" />
            Volver a Documentos
          </UiButton>

          <div class="flex flex-col md:flex-row gap-3">
            <UiButton
              @click="handleEdit"
              variant="outline"
              class="w-full md:w-auto gap-2 h-12 px-6"
            >
              <Icon name="lucide:edit" class="w-4 h-4" />
              Editar Solicitud
            </UiButton>

            <UiButton
              @click="handleEnviarValidacion"
              :disabled="enviando || !todosDocumentosCompletos"
              size="lg"
              class="w-full md:w-auto gap-2 h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all duration-300"
              :class="
                !todosDocumentosCompletos || enviando
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              "
            >
              <Icon v-if="!enviando" name="lucide:send" class="w-5 h-5" />
              <Icon
                v-else
                name="lucide:loader-2"
                class="w-5 h-5 animate-spin"
              />
              {{ enviando ? "Enviando..." : "Enviar para Validación" }}
            </UiButton>
          </div>
        </div>

        <!-- Alerta si faltan documentos -->
        <div
          v-if="!todosDocumentosCompletos"
          class="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div class="flex items-start gap-3">
            <Icon
              name="lucide:alert-triangle"
              class="w-5 h-5 text-red-600 shrink-0 mt-0.5"
            />
            <div>
              <h4 class="font-semibold text-red-900">
                No se puede enviar para validación
              </h4>
              <p class="text-red-700 text-sm mt-1">
                Faltan
                {{
                  documentosRequeridos?.filter(
                    (d) => d.obligatorio && !getDocumentoCargado(d.id),
                  ).length || 0
                }}
                documentos obligatorios por cargar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useResumenSolicitud } from "~/composables/solicitud/useResumenSolicitud";
import { formatCurrencyIntl, formatDate } from "~~/shared/utils/formatters";
const route = useRoute();

const {
  solicitud,
  loadingSolicitud,
  errorSolicitud,
  enviando,
  todosDocumentosCompletos,
  getDocumentoCargado,
  cargarSolicitud,
  handleNavigation,
  handleBack,
  handleEdit,
  handleEnviarValidacion,
  documentosCargados,
  documentosRequeridos,
} = useResumenSolicitud();

// Lifecycle
onMounted(() => {
  cargarSolicitud();
});

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});
</script>
