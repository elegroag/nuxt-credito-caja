<template>
  <div class="min-h-screen from-blue-50 via-white to-indigo-50">
    <!-- Header -->

    <div class="container mx-auto px-4 py-6 max-w-6xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Carga de Documentos
          </h1>
          <p class="text-gray-600">
            Complete los documentos requeridos para su solicitud de crédito
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <DocumentTextIcon class="w-4 h-4" />
          <span
            >{{ documentosRequeridos?.length || 0 }} documentos requeridos</span
          >
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Progress Steps -->
      <SharedProgresoSteps
        current-step="documentos"
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
          <DocumentTextIcon
            class="absolute inset-0 w-8 h-8 m-auto text-blue-600"
          />
        </div>
        <div class="text-center">
          <p class="text-lg font-medium text-gray-700">
            Cargando información...
          </p>
          <p class="text-sm text-gray-500 mt-1">
            Estamos preparando sus documentos
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
            <ExclamationCircleIcon class="w-8 h-8 text-red-600" />
          </div>
          <h3 class="text-xl font-bold text-red-900 mb-2">
            Error al cargar la solicitud
          </h3>
          <p class="text-red-700 mb-6">{{ errorSolicitud }}</p>
          <UiButton
            @click="cargarSolicitud"
            class="bg-red-600 hover:bg-red-700 text-white"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Reintentar
          </UiButton>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="solicitud" class="space-y-8">
        <!-- Info Card -->
        <div class="bg-gradient-primary rounded-2xl p-8 text-white shadow-xl">
          <div class="flex items-start gap-6">
            <div
              class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0"
            >
              <InformationCircleIcon class="w-6 h-6" />
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold mb-3">Documentos Requeridos</h2>
              <p class="text-blue-100 text-lg leading-relaxed">
                Para continuar con su solicitud de crédito<strong>
                  {{
                    solicitud?.payload?.linea_credito?.detalle_modalidad || ""
                  }}</strong
                >, por favor cargue los documentos listados a continuación.
              </p>
              <div class="mt-4 flex items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <DocumentCheckIcon class="w-4 h-4" />
                  <span>Formatos: PDF, JPG, PNG</span>
                </div>
                <div class="flex items-center gap-2">
                  <ServerIcon class="w-4 h-4" />
                  <span>Tamaño máximo: 5MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Summary -->
        <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Progreso de carga
            </h3>
            <span class="text-sm text-gray-500">
              {{ documentosCargadosCount }} de
              {{ documentosRequeridos?.length || 0 }} documentos
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="bg-linear-to-r from-blue-500 to-lime-600 h-3 rounded-full transition-all duration-500"
              :style="{ width: `${progresoDocumentos}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-2">
            {{ progresoDocumentos }}% completado
          </p>
        </div>

        <!-- Documents List -->
        <div class="grid gap-6">
          <div
            v-for="(docReq, index) in documentosRequeridos"
            :key="docReq.id"
            class="bg-white rounded-2xl shadow-md border overflow-hidden transition-all duration-300 hover:shadow-xl"
            :class="{
              'ring-2 ring-green-100 border-lime-500': getDocumentoCargado(
                docReq.id,
              ),
              'ring-2 ring-orange-500 border-orange-200':
                !getDocumentoCargado(docReq.id) && docReq.obligatorio,
            }"
          >
            <!-- Document Header -->
            <div
              class="bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                  >
                    <DocumentTextIcon class="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 text-lg">
                      {{ docReq.nombre }}
                    </h3>
                    <div class="flex items-center gap-2 mt-1">
                      <UiBadge
                        :variant="
                          docReq.obligatorio ? 'destructive' : 'secondary'
                        "
                        :class="
                          docReq.obligatorio
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        "
                      >
                        {{ docReq.obligatorio ? "Obligatorio" : "Opcional" }}
                      </UiBadge>
                      <span class="text-xs text-gray-500"
                        >Documento #{{ index + 1 }}</span
                      >
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    v-if="getDocumentoCargado(docReq.id)"
                    class="flex items-center gap-2 text-green-600"
                  >
                    <CheckCircleIcon class="w-5 h-5" />
                    <span class="text-sm font-medium">Cargado</span>
                  </div>
                  <div
                    v-else-if="docReq.obligatorio"
                    class="flex items-center gap-2 text-orange-600"
                  >
                    <ExclamationCircleIcon class="w-5 h-5" />
                    <span class="text-sm font-medium">Pendiente</span>
                  </div>
                  <div v-else class="flex items-center gap-2 text-gray-500">
                    <CircleStackIcon class="w-5 h-5" />
                    <span class="text-sm font-medium">Opcional</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Document Content -->
            <div class="p-6">
              <p class="text-gray-600 mb-6">
                {{ docReq.descripcion || "Sin descripción disponible." }}
              </p>

              <DocumentosUpload
                :model-value="getDocumentoCargado(docReq.id)"
                :loading="cargandoId === docReq.id"
                :progress="progreso"
                :error="cargandoId === docReq.id ? errorUpload : null"
                @upload="(file) => handleUpload(file, docReq.id)"
                @delete="(id) => handleDelete(id)"
                @download="(id) => handleDownload(id)"
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="p-8">
          <div
            class="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <UiButton
              variant="outline"
              @click="router.back()"
              class="w-full md:w-auto gap-2 h-12 px-6 bg-gray-300"
            >
              <ArrowLeftIcon class="w-4 h-4" />
              Volver a la Solicitud
            </UiButton>

            <div
              class="flex flex-col items-center md:items-end gap-3 w-full md:w-auto"
            >
              <UiButton
                size="lg"
                :disabled="!puedeContinuar"
                @click="handleContinue"
                class="w-full md:w-auto gap-2 h-12 px-8 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-300"
                :class="!puedeContinuar ? 'opacity-50 cursor-not-allowed' : ''"
              >
                <ArrowRightIcon class="w-5 h-5" />
                Continuar
              </UiButton>
              <div v-if="!puedeContinuar" class="text-center md:text-right">
                <p
                  class="text-sm text-red-600 font-medium flex items-center gap-2 justify-center md:justify-end"
                >
                  <ExclamationTriangleIcon class="w-4 h-4" />
                  Faltan documentos obligatorios por cargar
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{
                    documentosRequeridos?.filter(
                      (d) => d.obligatorio && !getDocumentoCargado(d.id),
                    ).length || 0
                  }}
                  documentos obligatorios pendientes
                </p>
              </div>
              <div v-else class="text-center md:text-right">
                <p
                  class="text-sm text-green-600 font-medium flex items-center gap-2 justify-center md:justify-end"
                >
                  <CheckCircleIcon class="w-4 h-4" />
                  Todos los documentos obligatorios están completos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <UModal
    v-model:open="downloadErrorDialogOpen"
    title="Error al descargar documento"
    :description="
      downloadError ||
      'No fue posible descargar el documento. Intente nuevamente más tarde.'
    "
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        label="Cerrar"
        @click="close"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useDocumentosSolicitud } from "~/composables/solicitud/useDocumentosSolicitud";
import DocumentosUpload from "~/components/documentos/DocumentosUpload.vue";
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  DocumentCheckIcon,
  ServerIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

// Usar el composable
const {
  solicitud,
  loadingSolicitud,
  errorSolicitud,
  cargandoId,
  puedeContinuar,
  progresoDocumentos,
  documentosCargadosCount,
  getDocumentoCargado,
  cargarSolicitud,
  handleUpload,
  handleDelete,
  handleDownload,
  handleNavigation,
  handleBack,
  handleContinue,
  documentosCargados,
  documentosRequeridos,
  progreso,
  errorUpload,
  downloadError,
  downloadErrorDialogOpen,
  setDownloadErrorDialogOpen,
} = useDocumentosSolicitud();

// Lifecycle
onMounted(() => {
  cargarSolicitud();
});

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const router = useRouter();
</script>
