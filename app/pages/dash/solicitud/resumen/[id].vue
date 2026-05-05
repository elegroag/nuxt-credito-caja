<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="mx-auto max-w-7xl p-4 sm:p-8">
      <!-- Header -->
      <UPageCard class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground mb-2">
              Resumen de Solicitud
            </h1>
            <p class="text-muted-foreground">
              Revise toda la información antes de enviar para validación previa
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <UIcon name="i-lucide-file-check" class="w-4 h-4" />
            <span
              >Solicitud #{{
                solicitud?.numero_solicitud || route.params.id
              }}</span
            >
          </div>
        </div>
      </UPageCard>

      <div class="space-y-6 max-w-6xl mx-auto">
        <!-- Progress Steps -->
        <SharedProgresoSteps
          current-step="completado"
          class="mb-6"
          @navigate="handleNavigation"
        />

        <!-- Loading State -->
        <UPageCard
          v-if="loadingSolicitud"
          class="flex flex-col items-center justify-center py-20"
        >
          <div class="flex flex-col items-center gap-4">
            <UIcon
              name="i-lucide-loader-2"
              class="w-10 h-10 text-primary animate-spin"
            />
            <div class="text-center">
              <p class="text-lg font-medium text-foreground">
                Cargando resumen...
              </p>
              <p class="text-sm text-muted-foreground mt-1">
                Estamos preparando su información
              </p>
            </div>
          </div>
        </UPageCard>

        <!-- Error State -->
        <UPageCard v-else-if="errorSolicitud" class="max-w-2xl mx-auto">
          <div class="text-center">
            <div
              class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon
                name="i-lucide-alert-circle"
                class="w-8 h-8 text-destructive"
              />
            </div>
            <h3 class="text-xl font-bold text-destructive mb-2">
              Error al cargar la solicitud
            </h3>
            <p class="text-destructive/80 mb-6">{{ errorSolicitud }}</p>
            <UButton color="destructive" @click="cargarSolicitud">
              <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
              Reintentar
            </UButton>
          </div>
        </UPageCard>

        <!-- Main Content -->
        <div v-else-if="solicitud" class="space-y-8">
          <!-- Alerta de confirmación -->
          <div class="bg-gradient-primary rounded-2xl p-8 text-white shadow-xl">
            <div class="flex items-start gap-6">
              <div
                class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0"
              >
                <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
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
                  <UIcon name="i-lucide-info" class="w-4 h-4" />
                  <span
                    >Verifique que todos los documentos obligatorios estén
                    cargados y sean legibles</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen del Crédito -->
          <UPageCard>
            <div class="p-6 border-b border-border">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-calculator"
                    class="w-5 h-5 text-success"
                  />
                </div>
                <h3 class="text-xl font-bold text-foreground">
                  Detalles del Crédito
                </h3>
              </div>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-primary/5 rounded-lg p-4">
                  <div class="flex items-center gap-2 text-primary mb-2">
                    <UIcon name="i-lucide-dollar-sign" class="w-4 h-4" />
                    <span class="text-sm font-medium">Valor solicitado</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground">
                    ${{ formatCurrencyIntl(solicitud?.valor_solicitud || 0) }}
                  </p>
                </div>
                <div class="bg-success/5 rounded-lg p-4">
                  <div class="flex items-center gap-2 text-success mb-2">
                    <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                    <span class="text-sm font-medium">Plazo</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground">
                    {{ solicitud?.plazo_meses || 0 }} meses
                  </p>
                </div>
                <div class="bg-secondary/20 rounded-lg p-4">
                  <div
                    class="flex items-center gap-2 text-secondary-foreground mb-2"
                  >
                    <UIcon name="i-lucide-credit-card" class="w-4 h-4" />
                    <span class="text-sm font-medium">Cuota mensual</span>
                  </div>
                  <p class="text-2xl font-bold text-foreground">
                    ${{ formatCurrencyIntl(solicitud?.cuota_mensual || 0) }}
                  </p>
                </div>
              </div>
              <div class="mt-6 pt-6 border-t border-border">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 class="font-semibold text-muted-foreground mb-2">
                      Línea de Crédito
                    </h4>
                    <p class="text-foreground">
                      {{ solicitud?.detalle_modalidad || "N/A" }}
                    </p>
                  </div>
                  <div>
                    <h4 class="font-semibold text-muted-foreground mb-2">
                      Tipo de Crédito
                    </h4>
                    <p class="text-foreground">
                      {{ solicitud?.tipo_credito || "N/A" }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </UPageCard>

          <!-- Resumen de Documentos -->
          <UPageCard>
            <div class="p-6 border-b border-border">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-folder-open"
                      class="w-5 h-5 text-warning"
                    />
                  </div>
                  <h3 class="text-xl font-bold text-foreground">
                    Documentos Cargados
                  </h3>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <UBadge color="secondary" variant="subtle">
                    {{ documentosCargados?.length || 0 }} cargados
                  </UBadge>
                  <UBadge color="primary" variant="subtle">
                    {{
                      documentosRequeridos?.filter((d) => d.obligatorio)
                        .length || 0
                    }}
                    obligatorios
                  </UBadge>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="documento in documentosCargados"
                  :key="documento.id"
                  class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div
                    class="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-file-text"
                      class="w-4 h-4 text-success"
                    />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-foreground">
                      {{ documento.nombre_original }}
                    </p>
                    <p class="text-sm text-muted-foreground">
                      {{
                        documento.saved_filename || documento.nombre_original
                      }}
                    </p>
                  </div>
                  <div class="flex items-center gap-1">
                    <UIcon
                      name="i-lucide-check-circle"
                      class="w-5 h-5 text-success"
                    />
                  </div>
                </div>
              </div>
              <div
                v-if="!documentosCargados?.length"
                class="text-center py-8 text-muted-foreground"
              >
                <UIcon
                  name="i-lucide-inbox"
                  class="w-12 h-12 mx-auto mb-3 text-muted-foreground/60"
                />
                <p>No se han cargado documentos</p>
              </div>
            </div>
          </UPageCard>

          <!-- Acciones -->
          <UPageCard>
            <div
              class="flex flex-col md:flex-row gap-4 justify-between items-center"
            >
              <UButton
                @click="handleBack"
                variant="outline"
                color="neutral"
                size="lg"
              >
                <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-2" />
                Volver a Documentos
              </UButton>

              <div class="flex flex-col md:flex-row gap-3">
                <UButton
                  @click="handleEdit"
                  variant="outline"
                  color="neutral"
                  size="lg"
                >
                  <UIcon name="i-lucide-pencil" class="w-4 h-4 mr-2" />
                  Editar Solicitud
                </UButton>

                <UButton
                  @click="handleEnviarValidacion"
                  :disabled="enviando || !todosDocumentosCompletos"
                  color="primary"
                  size="lg"
                >
                  <UIcon
                    v-if="!enviando"
                    name="i-lucide-send"
                    class="w-5 h-5 mr-2"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-loader-2"
                    class="w-5 h-5 mr-2 animate-spin"
                  />
                  {{ enviando ? "Enviando..." : "Enviar para Validación" }}
                </UButton>
              </div>
            </div>
          </UPageCard>

          <!-- Alerta si faltan documentos -->
          <UPageCard
            v-if="!todosDocumentosCompletos"
            :ui="{ root: 'border-destructive/30 bg-destructive/5' }"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-5 h-5 text-destructive shrink-0 mt-0.5"
              />
              <div>
                <h4 class="font-semibold text-destructive">
                  No se puede enviar para validación
                </h4>
                <p class="text-destructive/80 text-sm mt-1">
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
          </UPageCard>
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
