<template>
  <div class="mx-auto max-w-5xl p-4 sm:p-8">
    <!-- Header -->
    <div class="mb-8">
      <UButton
        variant="ghost"
        size="sm"
        icon="i-lucide-arrow-left"
        class="mb-4"
        @click="navigateToLineas"
      >
        Volver a líneas
      </UButton>

      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            Simulador de crédito
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Estima la cuota mensual, intereses y capacidad de pago.
          </p>
        </div>

        <div
          v-if="lineaSeleccionada"
          class="flex items-center gap-2"
        >
          <Badge
            :variant="
              lineaSeleccionada.estado === 'A' ? 'default' : 'destructive'
            "
          >
            {{ lineaSeleccionada.detalle }}
          </Badge>
          <Badge
            :variant="
              lineaSeleccionada.estado === 'A' ? 'secondary' : 'outline'
            "
            class="text-xs"
          >
            {{ lineaSeleccionada.estado === "A" ? "Activo" : "Inactivo" }}
          </Badge>
        </div>
      </div>
    </div>

    <!-- Estado de carga -->
    <div
      v-if="loading"
      class="flex justify-center items-center min-h-[400px]"
    >
      <div class="flex flex-col items-center gap-3">
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin text-primary"
        />
        <p class="text-sm text-muted-foreground">
          Cargando línea de crédito...
        </p>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div
      v-else-if="error"
      class="flex justify-center items-center min-h-[400px]"
    >
      <UPageCard class="max-w-md text-center">
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-alert-circle"
              class="w-6 h-6 text-destructive"
            />
          </div>
          <h3 class="text-lg font-semibold">
            Error al cargar
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ error }}
          </p>
          <div class="flex gap-3 mt-2">
            <UButton
              size="sm"
              @click="cargarLineaCredito"
            >
              Reintentar
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              @click="navigateToLineas"
            >
              Volver
            </UButton>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Mensaje de línea inactiva -->
    <div
      v-else-if="lineaSeleccionada && lineaSeleccionada.estado !== 'A'"
      class="mb-6"
    >
      <UPageCard class="border-amber-200 bg-amber-50">
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-5 h-5 text-amber-600"
          />
          <p class="text-sm text-amber-800">
            <strong>{{ lineaSeleccionada.detalle }}</strong> se encuentra
            temporalmente inactiva. No es posible solicitar este crédito en este
            momento.
          </p>
        </div>
      </UPageCard>
    </div>

    <!-- Alerta de convenio -->
    <div
      v-if="
        lineaSeleccionada
          && lineaSeleccionada.estado === 'A'
          && convenioVerificado
          && isElegible
      "
      class="mb-6"
    >
      <UPageCard class="border-green-200 bg-green-50">
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-green-600"
            />
          </div>
          <div>
            <p class="font-semibold text-green-800">
              ¡Elegible para Crédito Convenio!
            </p>
            <p class="text-sm text-green-700">
              Tu empresa tiene convenio con COMFACA. Beneficios: Tasa reducida,
              plazo extendido y más.
            </p>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Alerta de error de convenio -->
    <div
      v-else-if="
        lineaSeleccionada
          && lineaSeleccionada.estado === 'A'
          && convenioVerificado
          && !isElegible
          && getMensajeError
      "
      class="mb-6"
    >
      <UPageCard class="border-red-200 bg-red-50">
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0"
          >
            <UIcon
              name="i-lucide-alert-circle"
              class="w-5 h-5 text-red-600"
            />
          </div>
          <div>
            <p class="font-semibold text-red-800">
              {{ getMensajeError.titulo }}
            </p>
            <p class="text-sm text-red-700">
              {{ getMensajeError.descripcion }}
            </p>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Contenido principal -->
    <div
      v-if="
        (convenioVerificado || !trabajador?.empresa?.nit)
          && lineaSeleccionada
          && lineaSeleccionada.estado === 'A'
      "
      class="grid gap-6 lg:grid-cols-2"
    >
      <!-- Formulario de entrada -->
      <UPageCard class="border-primary/20">
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-calculator"
                class="w-5 h-5 text-primary"
              />
            </div>
            <div>
              <h2 class="text-lg font-semibold">
                Datos del crédito
              </h2>
              <p class="text-sm text-muted-foreground">
                Ingresa la información para calcular
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-5">
          <!-- Monto -->
          <UFormField
            label="Monto (COP)"
            :hint="`Máx: ${fmt(lineaSeleccionada.valmax)}`"
          >
            <UInput
              v-model="montoInputModel"
              type="text"
              inputmode="numeric"
              placeholder="ej. 1.000.000"
              :maxlength="lineaSeleccionada.valmax.toString().length"
              :class="montoInput?.cls"
              :disabled="lineaSeleccionada?.estado !== 'A'"
              @keyup="validarMonto"
              @blur="validarMonto"
            />
            <template #help>
              <div class="space-y-2">
                <p
                  class="text-xs"
                  :class="montoInput?.hintClass"
                >
                  {{
                    montoInput?.hint
                      || "Ingresa un monto entre 200.000 y el máximo"
                  }}
                </p>
                <UProgress
                  :model-value="montoInput?.pct || 0"
                  size="xs"
                  :color="montoInput?.pctColor || 'neutral'"
                />
              </div>
            </template>
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Plazo -->
            <UFormField
              label="Plazo (meses)"
              :hint="`Máx: ${lineaSeleccionada?.numcuo || 'N/A'} meses`"
            >
              <UInput
                v-model.number="plazoMeses"
                type="number"
                step="1"
                min="1"
                :max="lineaSeleccionada?.numcuo || 999"
                :disabled="lineaSeleccionada?.estado !== 'A'"
              />
            </UFormField>

            <!-- Tipo de tasa -->
            <UFormField label="Tipo de tasa">
              <URadioGroup
                v-model="tipoTasa"
                :items="[
                  { label: 'Anual (EA)', value: 'anual' },
                  { label: 'Mensual', value: 'mensual' }
                ]"
              />
            </UFormField>
          </div>

          <!-- Tasa -->
          <UFormField
            :label="
              tipoTasa === 'anual'
                ? 'Tasa efectiva anual (EA %)'
                : 'Tasa mensual (%)'
            "
            :hint="
              trabajador?.codigo_categoria && lineaSeleccionada?.categorias
                ? 'Tasa por categoría aplicada'
                : ''
            "
          >
            <UInput
              v-model.number="tasaInput"
              type="number"
              step="0.1"
              min="0"
              :readonly="
                !!(
                  trabajador?.codigo_categoria && lineaSeleccionada?.categorias
                )
              "
              :placeholder="
                trabajador?.codigo_categoria
                  ? `Tasa cat. ${trabajador.codigo_categoria}`
                  : ''
              "
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Ingresos -->
            <UFormField
              label="Ingresos mensuales"
              description="Salario bruto"
            >
              <UInput
                v-model.number="ingresosMensuales"
                type="number"
                step="10000"
                min="0"
                :readonly="!!trabajador?.salario"
                :placeholder="
                  trabajador?.salario
                    ? `Salario: ${fmt(trabajador.salario)}`
                    : ''
                "
              />
              <template #help>
                <p
                  v-if="trabajador?.salario"
                  class="text-xs text-muted-foreground"
                >
                  💡 Cargado automáticamente
                </p>
                <p class="text-xs text-muted-foreground">
                  Neto (92%): {{ fmt(ingresosSan) }}
                </p>
              </template>
            </UFormField>

            <!-- Descuentos -->
            <UFormField
              label="Descuentos mensuales"
              description="Obligaciones actuales"
            >
              <UInput
                v-model.number="descuentosMensuales"
                type="number"
                step="10000"
                min="0"
              />
            </UFormField>
          </div>

          <!-- Max endeudamiento -->
          <UFormField
            label="Máximo endeudamiento"
            description="Por ley 50% de capacidad"
          >
            <UInput
              v-model.number="maxEndeudamientoPct"
              type="number"
              min="0"
              max="100"
            />
          </UFormField>
        </div>
      </UPageCard>

      <!-- Resultados -->
      <div class="space-y-4">
        <!-- Cuota y Capacidad -->
        <div class="grid gap-4 sm:grid-cols-2">
          <UPageCard class="bg-primary/6">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-calendar-days"
                class="w-4 h-4 text-primary"
              />
              <span class="text-xs font-medium text-muted-foreground uppercase">Cuota estimada</span>
            </div>
            <p class="text-2xl font-bold text-primary">
              {{ fmt(cuotaMensual) }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Tasa mensual: {{ fmtPct(tasaMensual * 100) }}
            </p>
          </UPageCard>

          <UPageCard class="bg-accent/5">
            <div class="flex items-center gap-2 mb-2">
              <UIcon
                name="i-lucide-wallet"
                class="w-4 h-4 text-accent"
              />
              <span class="text-xs font-medium text-muted-foreground uppercase">Capacidad disponible</span>
            </div>
            <p class="text-2xl font-bold text-accent">
              {{ fmt(capacidadDisponible) }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Máx: {{ fmt(maxCuotaPermitida) }}
            </p>
          </UPageCard>
        </div>

        <!-- Total a pagar -->
        <UPageCard>
          <div class="flex items-center gap-2 mb-2">
            <UIcon
              name="i-lucide-receipt"
              class="w-4 h-4 text-muted-foreground"
            />
            <span class="text-xs font-medium text-muted-foreground uppercase">Total a pagar</span>
          </div>
          <p class="text-xl font-bold">
            {{ fmt(totalPagar) }}
          </p>
          <p class="text-sm text-muted-foreground">
            Intereses: {{ fmt(intereses) }}
          </p>
        </UPageCard>

        <!-- Evaluación -->
        <UPageCard
          :class="
            apto ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          "
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="apto ? 'bg-green-100' : 'bg-red-100'"
            >
              <UIcon
                :name="apto ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
                class="w-5 h-5"
                :class="apto ? 'text-green-600' : 'text-red-600'"
              />
            </div>
            <div>
              <p
                class="font-semibold"
                :class="apto ? 'text-green-800' : 'text-red-800'"
              >
                {{
                  apto ? "Cuota dentro del límite" : "Cuota excede capacidad"
                }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{
                  apto
                    ? `Margen: ${fmt(margen)}`
                    : `Exceso: ${fmt(Math.abs(margen))}`
                }}
              </p>
            </div>
          </div>
        </UPageCard>

        <!-- Resumen -->
        <UPageCard>
          <div class="flex items-center gap-2 mb-3">
            <UIcon
              name="i-lucide-file-text"
              class="w-4 h-4 text-muted-foreground"
            />
            <span class="font-semibold">Resumen</span>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Monto</span>
              <span class="font-semibold">{{ fmt(montoSan) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Plazo</span>
              <span class="font-semibold">{{ plazoMesesSan }} meses</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{
                tipoTasa === "anual" ? "Tasa EA" : "Tasa Mensual"
              }}</span>
              <span class="font-semibold">{{
                fmtPct(tipoTasa === "anual" ? tasaEASan : tasaMensualSan)
              }}</span>
            </div>
            <USeparator class="my-2" />
            <div class="flex justify-between">
              <span class="text-muted-foreground">Ingresos netos</span>
              <span class="font-semibold text-primary">{{
                fmt(ingresosSan)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Descuentos</span>
              <span class="font-semibold">{{ fmt(descuentosSan) }}</span>
            </div>
          </div>
        </UPageCard>

        <!-- Acciones -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <UButton
            v-if="lineaSeleccionada?.estado === 'A'"
            color="primary"
            size="lg"
            class="flex-1"
            icon="i-lucide-arrow-right"
            @click="handleContinuarSolicitud"
          >
            Continuar solicitud
          </UButton>
          <UButton
            v-else
            color="neutral"
            size="lg"
            class="flex-1"
            disabled
          >
            No disponible
          </UButton>
          <UButton
            variant="outline"
            size="lg"
            icon="i-lucide-rotate-ccw"
            @click="reset"
          >
            Limpiar
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimuladorConLineaPage } from "~/composables/simulador/useSimuladorConLineaPage";

import Badge from "@/components/shared/Badge.vue";

const {
  // Estado y datos de la página
  loading,
  error,
  lineaSeleccionada,
  trabajador,

  // Datos del convenio
  convenioVerificado,
  isElegible,
  getMensajeError,

  // Datos del simulador
  monto,
  plazoMeses,
  tasaEfectivaAnual,
  tipoTasa,
  ingresosMensuales,
  descuentosMensuales,
  maxEndeudamientoPct,
  montoSan,
  plazoMesesSan,
  tasaEASan,
  tasaMensualSan,
  ingresosSan,
  ingresosBrutosSan,
  descuentosSan,
  tasaMensual,
  cuotaMensual,
  totalPagar,
  intereses,
  capacidadDisponible,
  maxCuotaPermitida,
  margen,
  apto,
  fmt,
  fmtPct,
  reset,
  cambiarTipoTasa,

  // Computed y funciones específicas
  tasaInput,
  montoInput,
  montoInputModel,
  validarMonto,
  navigateToLineas,
  cargarLineaCredito,
  saveDataManual,
  validarMontoMaximo
} = useSimuladorConLineaPage();

// Función para guardar datos y navegar a solicitud
const handleContinuarSolicitud = () => {
  saveDataManual();
  navigateTo("/dash/solicitud");
};
</script>

<style scoped>
/* Estilos mínimos para radio buttons nativos */
input[type="radio"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}
</style>
