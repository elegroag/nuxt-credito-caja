<template>
  <SectionCard
    title="Información Financiera"
    icon-bg-class="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
  >
    <template #icon>
      <DollarSign class="h-5 w-5" />
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <InfoField
        label="Salario Básico"
        :value="salarioBasico"
        value-class="font-bold text-amber-600 dark:text-amber-400 text-lg"
      />
      <InfoField
        label="Subsidio de Transporte"
        :value="subsidioTransporte"
        value-class="font-semibold text-gray-900 dark:text-white"
      />
      <InfoField
        label="Salud y Pensión"
        :value="saludPension"
        value-class="font-semibold text-gray-900 dark:text-white"
      />
      <InfoField
        label="Total Ingresos"
        :value="totalIngresos"
        value-class="font-bold text-green-600 dark:text-green-400 text-lg"
      />
      <InfoField
        label="Total Descuentos"
        :value="totalDescuentos"
        value-class="font-bold text-red-600 dark:text-red-400 text-lg"
      />
      <InfoField
        label="Neto Recibido"
        :value="netoRecibido"
        value-class="font-bold text-emerald-600 dark:text-emerald-400 text-xl"
      />
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { DollarSign } from "@lucide/vue";
import SectionCard from "./SectionCard.vue";
import InfoField from "./InfoField.vue";

interface Props {
  salarioBasico: string
  subsidioTransporte: string
  saludPension: string
  totalIngresos: string
  totalDescuentos: string
  netoRecibido: string
}

defineProps<Props>();
</script>
