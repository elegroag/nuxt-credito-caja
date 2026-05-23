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
              Resumen de Solicitud
            </h1>
            <p class="text-muted-foreground mt-1">
              Revise toda la información antes de enviar para validación previa
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <UIcon name="i-lucide-file-check" class="w-4 h-4" />
            <span>Solicitud #{{ solicitud?.numero_solicitud || route.params.id }}</span>
          </div>
        </div>
      </UCard>

      <!-- Progress Steps -->
      <SharedProgresoSteps
        current-step="completado"
        @navigate="handleNavigation"
      />

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
            <p class="text-lg font-medium text-foreground">
              Cargando resumen...
            </p>
            <p class="text-sm text-muted-foreground mt-1">
              Estamos preparando su información
            </p>
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
          <h3 class="text-xl font-bold text-destructive mb-2">
            Error al cargar la solicitud
          </h3>
          <p class="text-muted-foreground mb-6">{{ errorSolicitud }}</p>
          <UButton color="destructive" @click="cargarSolicitud">
            <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
            Reintentar
          </UButton>
        </div>
      </UCard>

      <!-- Main Content -->
      <div v-else-if="solicitud" class="space-y-6">
        <!-- Alerta de confirmación -->
        <UCard
          class="bg-primary border-primary/20"
          :ui="{
            root: 'border-primary/30',
            body: 'px-6 py-6 sm:px-8 sm:py-6'
          }"
        >
          <div class="flex items-start gap-6">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-white" fixed-mode />
            </div>
            <div class="flex-1">
              <h2 class="text-xl sm:text-2xl font-bold text-white mb-3">
                Última Revisión Antes de Enviar
              </h2>
              <p class="text-white/90 mb-4">
                Para continuar con su solicitud de crédito
                <strong>{{ solicitud?.payload?.linea_credito?.detalle_modalidad || "" }}</strong>,
                una vez enviada para validación previa, algunos datos no podrán ser modificados.
              </p>
              <div class="flex items-center gap-2 text-white/80 text-sm">
                <UIcon name="i-lucide-info" class="w-4 h-4" fixed-mode />
                <span>Verifique que todos los documentos obligatorios estén cargados y sean legibles</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Resumen del Crédito -->
        <UCard
          :ui="{
            root: 'shadow-md',
            body: 'p-0'
          }"
        >
          <template #header>
            <div class="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-calculator" class="w-5 h-5 text-primary" />
              </div>
              <h3 class="text-lg font-bold text-foreground">Detalles del Crédito</h3>
            </div>
          </template>

          <div class="px-6 pb-6">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div class="bg-primary/5 rounded-xl p-5">
                <div class="flex items-center gap-2 text-primary mb-3">
                  <UIcon name="i-lucide-dollar-sign" class="w-4 h-4" fixed-mode />
                  <span class="text-sm font-medium">Valor solicitado</span>
                </div>
                <p class="text-2xl font-bold text-foreground">
                  ${{ formatCurrencyIntl(solicitud?.valor_solicitud || 0) }}
                </p>
              </div>
              <div class="bg-success/5 rounded-xl p-5">
                <div class="flex items-center gap-2 text-success mb-3">
                  <UIcon name="i-lucide-calendar" class="w-4 h-4" fixed-mode />
                  <span class="text-sm font-medium">Plazo</span>
                </div>
                <p class="text-2xl font-bold text-foreground">
                  {{ solicitud?.plazo_meses || 0 }} meses
                </p>
              </div>
              <div class="bg-muted rounded-xl p-5">
                <div class="flex items-center gap-2 text-muted-foreground mb-3">
                  <UIcon name="i-lucide-credit-card" class="w-4 h-4" fixed-mode />
                  <span class="text-sm font-medium">Cuota mensual</span>
                </div>
                <p class="text-2xl font-bold text-foreground">
                  ${{ formatCurrencyIntl(solicitud?.cuota_mensual || 0) }}
                </p>
              </div>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border">
              <div>
                <h4 class="text-sm font-medium text-muted-foreground mb-1">Línea de Crédito</h4>
                <p class="text-foreground font-medium">{{ solicitud?.detalle_modalidad || "N/A" }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-muted-foreground mb-1">Tipo de Crédito</h4>
                <p class="text-foreground font-medium">{{ solicitud?.tipo_credito || "N/A" }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Resumen de Documentos -->
        <UCard
          :ui="{
            root: 'shadow-md',
            body: 'p-0'
          }"
        >
          <template #header>
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-folder-open" class="w-5 h-5 text-warning" />
                </div>
                <h3 class="text-lg font-bold text-foreground">Documentos Cargados</h3>
              </div>
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="subtle">
                  {{ documentosCargados?.length || 0 }} cargados
                </UBadge>
                <UBadge color="muted" variant="subtle">
                  {{ documentosRequeridos?.filter((d) => d.obligatorio).length || 0 }} obligatorios
                </UBadge>
              </div>
            </div>
          </template>

          <div class="px-6 pb-6">
            <div v-if="documentosCargados?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="documento in documentosCargados"
                :key="documento.id"
                class="flex items-center gap-3 p-4 bg-muted/30 rounded-lg"
              >
                <div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-file-text" class="w-5 h-5 text-success" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-foreground truncate">{{ documento.nombre_original }}</p>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ documento.saved_filename || documento.nombre_original }}
                  </p>
                </div>
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-success shrink-0" />
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UIcon name="i-lucide-inbox" class="w-12 h-12 mb-3 text-muted-foreground/50" />
              <p>No se han cargado documentos</p>
            </div>
          </div>
        </UCard>

        <!-- Warning Alert -->
        <UCard
          v-if="!todosDocumentosCompletos"
          class="border-destructive/30"
          :ui="{
            root: 'border-destructive/20 bg-destructive/5',
            body: 'px-6 py-4'
          }"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 class="font-semibold text-destructive">No se puede enviar para validación</h4>
              <p class="text-sm text-destructive/80 mt-1">
                Faltan
                {{ documentosRequeridos?.filter((d) => d.obligatorio && !getDocumentoCargado(d.id)).length || 0 }}
                documentos obligatorios por cargar.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Acciones -->
        <UCard
          :ui="{
            root: 'shadow-md',
            body: 'px-6 py-4 sm:px-6 sm:py-4'
          }"
        >
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <UButton variant="outline" color="neutral" size="lg" @click="handleBack">
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-2" />
              Volver a Documentos
            </UButton>

            <div class="flex flex-col sm:flex-row gap-3">
              <UButton variant="outline" color="neutral" size="lg" @click="handleEdit">
                <UIcon name="i-lucide-pencil" class="w-4 h-4 mr-2" />
                Editar Solicitud
              </UButton>
              <UButton
                :disabled="enviando || !todosDocumentosCompletos"
                color="primary"
                size="lg"
                @click="handleEnviarValidacion"
              >
                <UIcon v-if="!enviando" name="i-lucide-send" class="w-4 h-4 mr-2" />
                <UIcon v-else name="i-lucide-loader-2" class="w-4 h-4 mr-2 animate-spin" />
                {{ enviando ? "Enviando..." : "Enviar para Validación" }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useResumenSolicitud } from "~/composables/solicitud/useResumenSolicitud";
import { formatCurrencyIntl } from "~~/shared/utils/formatters";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

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
  documentosRequeridos
} = useResumenSolicitud();

onMounted(() => {
  cargarSolicitud();
});
</script>
