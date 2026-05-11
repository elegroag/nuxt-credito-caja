<template>
  <div class="mx-auto max-w-5xl p-4 sm:p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">
        Simulador de crédito
      </h1>
      <p class="text-muted-foreground">
        Estima la cuota mensual, intereses y capacidad de pago.
      </p>

      <UButton variant="soft" class="mt-3" size="lg" @click="navigateToLineas">
        Ver líneas de crédito
      </UButton>
    </div>

    <!-- Alerta de convenio -->
    <div v-if="mensajeBeneficios" class="mb-6">
      <ConvenioAlert
        :titulo="mensajeBeneficios.titulo"
        :descripcion="`Su empresa ${mensajeBeneficios.empresa} tiene convenio con COMFACA. Beneficios: ${mensajeBeneficios.items.join(', ')}`"
        tipo="success"
        :dismissible="false"
      />
    </div>

    <!-- Alerta de error de convenio -->
    <div
      v-else-if="convenioVerificado && !isElegible && getMensajeError"
      class="mb-6"
    >
      <ConvenioAlert
        :titulo="getMensajeError.titulo"
        :descripcion="getMensajeError.descripcion"
        :tipo="getMensajeError.tipo"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Formulario de entrada -->
      <UCard
        title="Datos del crédito"
        description="Ingresa la información para calcular tu crédito"
        class="border-primary/20"
      >
        <div class="space-y-6">
          <div class="space-y-2">
            <label for="monto" class="text-sm font-medium">Monto (COP)</label>
            <UInput
              id="monto"
              type="number"
              v-model.number="monto"
              step="10000"
              min="0"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="plazo" class="text-sm font-medium"
                >Plazo (meses)</label
              >
              <UInput
                id="plazo"
                type="number"
                v-model.number="plazoMeses"
                step="1"
                min="1"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Tipo de tasa</label>
              <URadioGroup
                v-model="tipoTasa"
                :items="[
                  { label: 'Anual (EA)', value: 'anual' },
                  { label: 'Mensual', value: 'mensual' },
                ]"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="tasa" class="text-sm font-medium">
              {{
                tipoTasa === "anual"
                  ? "Tasa efectiva anual (EA %)"
                  : "Tasa mensual (%)"
              }}
            </label>
            <UInput
              id="tasa"
              type="number"
              step="0.1"
              v-model.number="tasaInput"
              min="0"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="ingresos" class="text-sm font-medium"
                >Ingresos mensuales <br /><small>Salario bruto.</small></label
              >
              <UInput
                id="ingresos"
                type="number"
                v-model.number="ingresosMensuales"
                step="10000"
                min="0"
              />
              <p class="text-xs text-muted-foreground">
                Ingreso neto (92%): {{ fmt(ingresosSan) }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="descuentos" class="text-sm font-medium"
                >Descuentos mensuales
                <small>Obligaciones adquiridas.</small></label
              >
              <UInput
                id="descuentos"
                type="number"
                v-model.number="descuentosMensuales"
                step="10000"
                min="0"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="maxEndeudamiento" class="text-sm font-medium"
              >Máximo endeudamiento por ley (50%)</label
            >
            <UInput
              id="maxEndeudamiento"
              type="number"
              v-model.number="maxEndeudamientoPct"
              min="0"
              max="100"
            />
            <p class="text-xs text-muted-foreground">
              Porcentaje de la capacidad disponible que se permite destinar a la
              cuota.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Resultados -->
      <div class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <UCard
            class="border-primary/30 bg-linear-to-br from-primary/5 to-primary/10"
          >
            <p
              class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Cuota estimada
            </p>
            <p class="text-3xl font-bold text-primary">
              {{ fmt(cuotaMensual) }}
            </p>
            <p class="text-xs text-muted-foreground">
              Tasa mensual: {{ fmtPct(tasaMensual * 100) }}
            </p>
          </UCard>

          <UCard
            class="border-secondary/30 bg-linear-to-br from-secondary/5 to-secondary/10"
          >
            <p
              class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Capacidad disponible <small>(Descuento en Nomina)</small>
            </p>
            <p class="text-3xl font-bold text-secondary">
              {{ fmt(capacidadDisponible) }}
            </p>
            <p class="text-xs text-muted-foreground">
              Máximo cuota: {{ fmt(maxCuotaPermitida) }}
            </p>
          </UCard>
        </div>

        <UCard class="border-primary/20">
          <p
            class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Total a pagar
          </p>
          <p class="text-2xl font-bold">{{ fmt(totalPagar) }}</p>
          <p class="text-sm text-muted-foreground">
            Intereses estimados: {{ fmt(intereses) }}
          </p>
        </UCard>

        <UCard
          :class="`border-2 ${apto ? 'border-secondary/50 bg-secondary/5' : 'border-destructive/50 bg-destructive/5'}`"
        >
          <div class="flex items-start gap-3">
            <CheckCircle2 v-if="apto" class="h-5 w-5 text-secondary mt-0.5" />
            <AlertCircle v-else class="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p class="text-base font-semibold mb-1">Evaluación rápida</p>
              <p :class="apto ? 'text-secondary' : 'text-destructive'">
                {{
                  apto
                    ? "La cuota está dentro del límite"
                    : "La cuota excede tu capacidad de pago"
                }}
              </p>
              <p class="text-sm text-muted-foreground mt-2">
                {{
                  apto
                    ? `Margen: ${fmt(margen)}`
                    : `Exceso: ${fmt(Math.abs(margen))}`
                }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard class="border-accent/30 bg-red-50">
          <p class="text-base font-semibold mb-3">Resumen</p>
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
              <span class="text-muted-foreground">
                {{ tipoTasa === "anual" ? "Tasa EA" : "Tasa Mensual" }}
              </span>
              <span class="font-semibold">
                {{ fmtPct(tipoTasa === "anual" ? tasaEASan : tasaMensualSan) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Ingresos (Brutos)</span>
              <span class="font-semibold">{{ fmt(ingresosBrutosSan) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Ingresos (Netos 92%)</span>
              <span class="font-semibold text-primary">{{
                fmt(ingresosSan)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Descuentos</span>
              <span class="font-semibold">{{ fmt(descuentosSan) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Máximo endeudamiento</span>
              <span class="font-semibold">{{
                fmtPct(maxEndeudamientoPct)
              }}</span>
            </div>
          </div>
        </UCard>

        <div class="flex gap-3">
          <NuxtLink to="/solicitud" class="flex-1">
            <UButton variant="soft" class="w-full" size="lg">
              Continuar con solicitud
            </UButton>
          </NuxtLink>
          <UButton variant="outline" size="lg" @click="reset">
            Restablecer
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, CheckCircle2 } from "lucide-vue-next";
import { useSimuladorPage } from "~/composables/simulador/useSimuladorPage";

const {
  // Datos del convenio
  mensajeBeneficios,
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
  navigateToLineas,
} = useSimuladorPage();
</script>
