<template>
  <div>
    <div class="min-h-[calc(100vh-4rem)]">
      <div class="mx-auto max-w-7xl p-4 sm:p-8">
        <!-- Header -->
        <UPageCard class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold mb-2 text-foreground">
                Carga de Documentos
              </h1>
              <p class="text-sm text-muted-foreground">
                Complete los documentos requeridos para su solicitud de crédito
              </p>
            </div>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <DocumentTextIcon class="w-4 h-4" />
              <UIcon
                name="i-lucide-file-text"
                class="w-4 h-4"
              />
              <span>{{ documentosRequeridos?.length || 0 }} documentos
                requeridos</span>
            </div>
          </div>
        </UPageCard>

        <div class="space-y-6 max-w-6xl mx-auto">
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
            />
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
        <UPageCard
          v-else-if="errorSolicitud"
          class="max-w-2xl mx-auto"
        >
          <div class="text-center">
            <div
              class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon
                name="i-lucide-alert-circle"
                class="w-8 h-8 text-red-600"
              />
            </div>
            <h3 class="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              Error al cargar la solicitud
            </h3>
            <p class="text-red-700 dark:text-red-300 mb-6">
              {{ errorSolicitud }}
            </p>
            <UButton
              color="destructive"
              @click="cargarSolicitud"
            >
              <UIcon
                name="i-lucide-refresh-cw"
                class="w-4 h-4 mr-2"
              />
              Reintentar
            </UButton>
          </div>
        </UPageCard>

        <!-- Main Content -->
        <div
          v-else-if="solicitud"
          class="space-y-8"
        >
          <!-- Info Card -->
          <div class="bg-gradient-primary rounded-2xl p-8 text-white shadow-xl">
            <div class="flex items-start gap-6">
              <div
                class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0"
              >
                <InformationCircleIcon class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-bold mb-3">
                  Documentos Requeridos
                </h2>
                <p class="text-blue-100 text-lg leading-relaxed">
                  Para continuar con su solicitud de crédito<strong>
                    {{
                      solicitud?.payload?.linea_credito?.detalle_modalidad || ""
                    }}</strong>, por favor cargue los documentos listados a continuación.
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
          <UPageCard>
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
              />
            </div>
            <p class="text-sm text-gray-600 mt-2">
              {{ progresoDocumentos }}% completado
            </p>
          </UPageCard>

          <!-- Documents List -->
          <div class="grid gap-6">
            <UPageCard
              v-for="(docReq, index) in documentosRequeridos"
              :key="docReq.id"
              :ui="{
                root: 'overflow-hidden transition-all duration-300 hover:shadow-xl ring-0'
              }"
              :class="{
                'border-success': getDocumentoCargado(docReq.id),
                'border-warning':
                  !getDocumentoCargado(docReq.id) && docReq.obligatorio
              }"
            >
              <!-- Document Header -->
              <div class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
                    >
                      <DocumentTextIcon class="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 class="font-semibold text-foreground text-lg">
                        {{ docReq.nombre }}
                      </h3>
                      <div class="flex items-center gap-2 mt-1">
                        <UBadge
                          :color="
                            docReq.obligatorio ? 'destructive' : 'neutral'
                          "
                          variant="subtle"
                        >
                          {{ docReq.obligatorio ? "Obligatorio" : "Opcional" }}
                        </UBadge>
                        <span class="text-xs text-muted-foreground">Documento #{{ index + 1 }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      v-if="getDocumentoCargado(docReq.id)"
                      class="flex items-center gap-2 text-success"
                    >
                      <CheckCircleIcon class="w-5 h-5" />
                      <span class="text-sm font-medium">Cargado</span>
                    </div>
                    <div
                      v-else-if="docReq.obligatorio"
                      class="flex items-center gap-2 text-warning"
                    >
                      <ExclamationCircleIcon class="w-5 h-5" />
                      <span class="text-sm font-medium">Pendiente</span>
                    </div>
                    <div
                      v-else
                      class="flex items-center gap-2 text-muted-foreground"
                    >
                      <CircleStackIcon class="w-5 h-5" />
                      <span class="text-sm font-medium">Opcional</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Document Content -->
              <div class="p-6">
                <p class="text-muted-foreground mb-6">
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
            </UPageCard>
          </div>

          <!-- Action Buttons -->
          <UPageCard>
            <div
              class="flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <UButton
                variant="outline"
                color="neutral"
                size="lg"
                class="w-full md:w-auto"
                @click="router.back()"
              >
                <UIcon
                  name="i-lucide-arrow-left"
                  class="w-4 h-4 mr-2"
                />
                Volver a la Solicitud
              </UButton>

              <div
                class="flex flex-col items-center md:items-end gap-3 w-full md:w-auto"
              >
                <UButton
                  size="lg"
                  color="primary"
                  :disabled="!puedeContinuar"
                  class="w-full md:w-auto"
                  @click="handleContinue"
                >
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-5 h-5 mr-2"
                  />
                  Continuar
                </UButton>
                <div
                  v-if="!puedeContinuar"
                  class="text-center md:text-right"
                >
                  <p
                    class="text-sm text-red-600 font-medium flex items-center gap-2 justify-center md:justify-end"
                  >
                    <ExclamationTriangleIcon class="w-4 h-4" />
                    Faltan documentos obligatorios por cargar
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{
                      documentosRequeridos?.filter(
                        (d) => d.obligatorio && !getDocumentoCargado(d.id)
                      ).length || 0
                    }}
                    documentos obligatorios pendientes
                  </p>
                </div>
                <div
                  v-else
                  class="text-center md:text-right"
                >
                  <p
                    class="text-sm text-green-600 font-medium flex items-center gap-2 justify-center md:justify-end"
                  >
                    <CheckCircleIcon class="w-4 h-4" />
                    Todos los documentos obligatorios están completos
                  </p>
                </div>
              </div>
            </div>
          </UPageCard>
        </div>
      </div>
      </div>
    </div>
    <UModal
      v-model:open="downloadErrorDialogOpen"
    title="Error al descargar documento"
    :description="
      downloadError
        || 'No fue posible descargar el documento. Intente nuevamente más tarde.'
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
  InformationCircleIcon,
  DocumentCheckIcon,
  ServerIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ExclamationTriangleIcon
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
  handleContinue,
  documentosRequeridos,
  progreso,
  errorUpload,
  downloadError,
  downloadErrorDialogOpen
} = useDocumentosSolicitud();

// Lifecycle
onMounted(() => {
  cargarSolicitud();
});

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const router = useRouter();
</script>
