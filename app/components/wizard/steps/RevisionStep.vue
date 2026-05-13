<template>
  <div class="grid gap-6">
    <!-- Resumen de datos -->
    <UCard class="border-border/50 bg-muted/10 shadow-none">
      <p
        class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4"
      >
        <ClipboardList class="h-4 w-4" />
        Resumen de la solicitud
      </p>
      <div class="grid gap-4 text-sm">
        <!-- Encabezado -->
        <div class="border-l-4 border-indigo-200 pl-4">
          <h4 class="font-semibold text-indigo-700 mb-2">Encabezado</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenEncabezado()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Solicitud -->
        <div class="border-l-4 border-green-200 pl-4">
          <h4 class="font-semibold text-green-700 mb-2">Solicitud</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenSolicitud()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Solicitante -->
        <div class="border-l-4 border-blue-200 pl-4">
          <h4 class="font-semibold text-blue-700 mb-2">Datos del Solicitante</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenSolicitante()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Datos del Simulador -->
        <div v-if="getResumenSimulador()" class="border-l-4 border-orange-200 pl-4">
          <h4 class="font-semibold text-orange-700 mb-2">Datos del Simulador</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenSimulador()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Cónyuge (si aplica) -->
        <div v-if="getResumenConyuge()" class="border-l-4 border-purple-200 pl-4">
          <h4 class="font-semibold text-purple-700 mb-2">Datos del Cónyuge</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenConyuge()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Información Laboral -->
        <div class="border-l-4 border-orange-200 pl-4">
          <h4 class="font-semibold text-orange-700 mb-2">Información Laboral</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenLaboral()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Ingresos y Descuentos -->
        <div class="border-l-4 border-teal-200 pl-4">
          <h4 class="font-semibold text-teal-700 mb-2">Ingresos y Descuentos</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenIngresos()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Información Económica -->
        <div class="border-l-4 border-cyan-200 pl-4">
          <h4 class="font-semibold text-cyan-700 mb-2">Información Económica</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div v-for="(value, key) in getResumenEconomica()" :key="String(key)">
              <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
              {{ formatValue(value) }}
            </div>
          </div>
        </div>

        <!-- Propiedades -->
        <div v-if="getResumenPropiedades().length > 0" class="border-l-4 border-lime-200 pl-4">
          <h4 class="font-semibold text-lime-700 mb-2">Propiedades</h4>
          <div v-for="(propiedad, index) in getResumenPropiedades()" :key="index" class="mb-3">
            <div class="text-xs font-medium text-lime-600 mb-1">
              Propiedad {{ formatRevisionIndex(index) }}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ml-2">
              <div v-for="(value, key) in propiedad" :key="String(key)">
                <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
                {{ formatValue(value) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Deudas -->
        <div v-if="getResumenDeudas().length > 0" class="border-l-4 border-rose-200 pl-4">
          <h4 class="font-semibold text-rose-700 mb-2">Deudas y Obligaciones</h4>
          <div v-for="(deuda, index) in getResumenDeudas()" :key="index" class="mb-3">
            <div class="text-xs font-medium text-rose-600 mb-1">
              Deuda {{ formatRevisionIndex(index) }}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ml-2">
              <div v-for="(value, key) in deuda" :key="String(key)">
                <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
                {{ formatValue(value) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Referencias Familiares -->
        <div
          v-if="getResumenReferenciasFamiliares().length > 0"
          class="border-l-4 border-amber-200 pl-4"
        >
          <h4 class="font-semibold text-amber-700 mb-2">Referencias Familiares</h4>
          <div
            v-for="(referencia, index) in getResumenReferenciasFamiliares()"
            :key="index"
            class="mb-3"
          >
            <div class="text-xs font-medium text-amber-600 mb-1">
              Referencia {{ formatRevisionIndex(index) }}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ml-2">
              <div v-for="(value, key) in referencia" :key="String(key)">
                <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
                {{ formatValue(value) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Referencias Personales -->
        <div
          v-if="getResumenReferenciasPersonales().length > 0"
          class="border-l-4 border-violet-200 pl-4"
        >
          <h4 class="font-semibold text-violet-700 mb-2">Referencias Personales</h4>
          <div
            v-for="(referencia, index) in getResumenReferenciasPersonales()"
            :key="index"
            class="mb-3"
          >
            <div class="text-xs font-medium text-violet-600 mb-1">
              Referencia {{ formatRevisionIndex(index) }}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ml-2">
              <div v-for="(value, key) in referencia" :key="String(key)">
                <span class="font-medium">{{ formatRevisionKey(String(key)) }}:</span>
                {{ formatValue(value) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Payload JSON colapsable -->
    <UCard class="border-border/50 bg-muted/10 shadow-none">
      <div class="flex items-center justify-between mb-3">
        <p
          class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
        >
          <FileCode class="h-4 w-4" />
          Payload (JSON)
        </p>
        <UButton variant="outline" size="sm" class="h-8 gap-2 bg-background" @click="togglePayload">
          <PenTool class="h-3.5 w-3.5" />
          {{ mostrarPayload ? "Ocultar" : "Mostrar" }}
        </UButton>
      </div>
      <div v-if="mostrarPayload" class="rounded-lg bg-background p-4 border border-border">
        <pre class="overflow-auto text-[10px] text-foreground font-mono leading-relaxed">{{
          prettyPayload
        }}</pre>
      </div>
    </UCard>

    <!-- Error de XML -->
    <div
      v-if="errorMsg"
      class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3"
    >
      <AlertCircle class="h-5 w-5 shrink-0" />
      <span class="font-medium">{{ errorMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileCode, AlertCircle, ClipboardList, PenTool } from "lucide-vue-next";

import { useRevisionStep } from "~/composables/solicitud/useRevisionStep";

import { formatValue, formatRevisionKey, formatRevisionIndex } from "~~/shared/utils/formatters";
import type { RevisionProps } from "~~/shared/types/componentes";

const props = defineProps<RevisionProps>();

const {
  // Estado
  mostrarPayload,

  // Funciones principales
  togglePayload,

  // Funciones de resumen
  getResumenEncabezado,
  getResumenSolicitud,
  getResumenSolicitante,
  getResumenSimulador,
  getResumenConyuge,
  getResumenLaboral,
  getResumenIngresos,
  getResumenEconomica,
  getResumenPropiedades,
  getResumenDeudas,
  getResumenReferenciasFamiliares,
  getResumenReferenciasPersonales
} = useRevisionStep(props);
</script>
