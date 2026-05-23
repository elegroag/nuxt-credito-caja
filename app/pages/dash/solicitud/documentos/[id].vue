<template>
  <div class="min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- Header -->
      <UCard
        :ui="{
          root: 'border-0 shadow-md',
          body: 'px-6 py-6 sm:px-8 sm:py-6'
        }"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Carga de Documentos
            </h1>
            <p class="text-muted-foreground mt-1">
              Complete los documentos requeridos para su solicitud de crédito
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <UIcon name="i-lucide-file-text" class="w-4 h-4" />
            <span>{{ documentosRequeridos?.length || 0 }} documentos requeridos</span>
          </div>
        </div>
      </UCard>

      <!-- Progress Steps -->
      <SharedProgresoSteps current-step="documentos" @navigate="handleNavigation" />

      <!-- Loading State -->
      <UCard
        v-if="loadingSolicitud"
        :ui="{
          root: 'border-0 shadow-md',
          body: 'py-16'
        }"
      >
        <div class="flex flex-col items-center justify-center gap-4">
          <UIcon name="i-lucide-loader-2" class="w-10 h-10 text-primary animate-spin" />
          <div class="text-center">
            <p class="text-lg font-medium text-foreground">Cargando información...</p>
            <p class="text-sm text-muted-foreground mt-1">Estamos preparando sus documentos</p>
          </div>
        </div>
      </UCard>

      <!-- Error State -->
      <UCard
        v-else-if="errorSolicitud"
        :ui="{
          root: 'border-destructive/30 shadow-md',
          body: 'py-12'
        }"
      >
        <div class="text-center max-w-md mx-auto">
          <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-destructive" />
          </div>
          <h3 class="text-xl font-bold text-destructive mb-2">Error al cargar la solicitud</h3>
          <p class="text-muted-foreground mb-6">{{ errorSolicitud }}</p>
          <UButton color="destructive" @click="cargarSolicitud">
            <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
            Reintentar
          </UButton>
        </div>
      </UCard>

      <!-- Main Content -->
      <div v-else-if="solicitud" class="space-y-6">
        <!-- Info Card -->
        <UCard
          class="bg-primary border-primary/20"
          :ui="{
            root: 'border-primary/30',
            body: 'px-6 py-6 sm:px-8 sm:py-6'
          }"
        >
          <div class="flex items-start gap-6">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-info" class="w-6 h-6 text-white" fixed-mode />
            </div>
            <div class="flex-1">
              <h2 class="text-xl sm:text-2xl font-bold text-white mb-3">
                Documentos Requeridos
              </h2>
              <p class="text-white/90 text-lg leading-relaxed">
                Para continuar con su solicitud de crédito
                <strong>{{ solicitud?.payload?.linea_credito?.detalle_modalidad || "" }}</strong>,
                por favor cargue los documentos listados a continuación.
              </p>
              <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-file-check" class="w-4 h-4" fixed-mode />
                  <span>Formatos: PDF, JPG, PNG</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-server" class="w-4 h-4" fixed-mode />
                  <span>Tamaño máximo: 5MB</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Progress Summary -->
        <UCard
          :ui="{
            root: 'shadow-md',
            body: 'px-6 py-6'
          }"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-foreground">Progreso de carga</h3>
            <span class="text-sm text-muted-foreground">
              {{ documentosCargadosCount }} de {{ documentosRequeridos?.length || 0 }} documentos
            </span>
          </div>
          <div class="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              class="h-2.5 rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${progresoDocumentos}%` }"
            />
          </div>
          <p class="text-sm text-muted-foreground mt-2">{{ progresoDocumentos }}% completado</p>
        </UCard>

        <!-- Documents List -->
        <div class="grid gap-4">
          <UCard
            v-for="(docReq, index) in documentosRequeridos"
            :key="docReq.id"
            :ui="{
              root: `shadow-md transition-shadow duration-300`,
              body: 'p-0'
            }"
            :class="{
              'border-success ring-1 ring-success/20': getDocumentoCargado(docReq.id),
              'border-warning ring-1 ring-warning/20': !getDocumentoCargado(docReq.id) && docReq.obligatorio
            }"
          >
            <!-- Document Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-foreground text-lg">{{ docReq.nombre }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <UBadge
                      :color="docReq.obligatorio ? 'destructive' : 'neutral'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ docReq.obligatorio ? "Obligatorio" : "Opcional" }}
                    </UBadge>
                    <span class="text-xs text-muted-foreground">Documento #{{ index + 1 }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div v-if="getDocumentoCargado(docReq.id)" class="flex items-center gap-2 text-success">
                  <UIcon name="i-lucide-check-circle" class="w-5 h-5" />
                  <span class="text-sm font-medium">Cargado</span>
                </div>
                <div v-else-if="docReq.obligatorio" class="flex items-center gap-2 text-warning">
                  <UIcon name="i-lucide-exclamation-circle" class="w-5 h-5" />
                  <span class="text-sm font-medium">Pendiente</span>
                </div>
                <div v-else class="flex items-center gap-2 text-muted-foreground">
                  <UIcon name="i-lucide-circle" class="w-5 h-5" />
                  <span class="text-sm font-medium">Opcional</span>
                </div>
              </div>
            </div>

            <!-- Document Content -->
            <div class="px-6 py-5">
              <p class="text-muted-foreground mb-5">
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
          </UCard>
        </div>

        <!-- Action Buttons -->
        <UCard
          :ui="{
            root: 'shadow-md',
            body: 'px-6 py-5 sm:px-6 sm:py-5'
          }"
        >
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
            <UButton variant="outline" color="neutral" size="lg" class="w-full sm:w-auto" @click="router.back()">
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-2" />
              Volver a la Solicitud
            </UButton>

            <div class="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
              <UButton
                size="lg"
                color="primary"
                :disabled="!puedeContinuar"
                class="w-full sm:w-auto"
                @click="handleContinue"
              >
                <UIcon name="i-lucide-arrow-right" class="w-4 h-4 mr-2" />
                Continuar
              </UButton>

              <div v-if="!puedeContinuar" class="text-center sm:text-right">
                <p class="text-sm text-destructive font-medium flex items-center gap-2 justify-center sm:justify-end">
                  <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
                  Faltan documentos obligatorios por cargar
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ documentosRequeridos?.filter((d) => d.obligatorio && !getDocumentoCargado(d.id)).length || 0 }}
                  documentos obligatorios pendientes
                </p>
              </div>
              <div v-else class="text-center sm:text-right">
                <p class="text-sm text-success font-medium flex items-center gap-2 justify-center sm:justify-end">
                  <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                  Todos los documentos obligatorios están completos
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Modal -->
    <UModal
      v-model:open="downloadErrorDialogOpen"
      title="Error al descargar documento"
      :description="downloadError || 'No fue posible descargar el documento. Intente nuevamente más tarde.'"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer="{ close }">
        <UButton color="neutral" variant="outline" label="Cerrar" @click="close" />
      </template>
    </UModal>

    <!-- Loading Overlay global para uploads -->
    <UiLoadingOverlay
      :show="!!cargandoId"
      mensaje="Subiendo documento"
      :sub-mensaje="progreso > 0 ? `(${Math.round(progreso)}%)` : 'Por favor espere'"
      :mostrar-progreso="progreso > 0"
      :progreso="progreso"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDocumentosSolicitud } from "~/composables/solicitud/useDocumentosSolicitud";
import DocumentosUpload from "~/components/documentos/DocumentosUpload.vue";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const router = useRouter();

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

onMounted(() => {
  cargarSolicitud();
});
</script>
