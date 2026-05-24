<template>
  <SectionCard
    title="Información Laboral"
    icon-bg-class="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
  >
    <template #icon>
      <Building class="h-5 w-5" />
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <InfoField
        label="Empresa"
        :value="empresaRazonSocial"
        value-class="font-semibold text-gray-900 dark:text-white"
      />
      <InfoField
        label="NIT"
        :value="empresaNit"
        value-class="font-mono text-gray-900 dark:text-white"
      />
      <InfoField
        label="Dirección Empresa"
        :value="empresaDireccion"
      />
      <InfoField
        label="Teléfono Empresa"
        :value="empresaTelefono"
        value-class="font-mono text-gray-900 dark:text-white"
      />
      <InfoField
        label="Ciudad Empresa"
        :value="empresaCiudad"
      />
      <InfoField
        label="Cargo"
        :value="cargo"
      />
      <InfoField
        label="Fecha de Ingreso"
        :value="fechaIngreso"
      />
      <InfoField
        label="Tiempo de Servicio"
        :value="tiempoServicio"
      />
      <InfoField
        label="Tipo de Contrato"
        :value="tipoContrato"
      />
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { Building } from "@lucide/vue";
import SectionCard from "./SectionCard.vue";
import InfoField from "./InfoField.vue";

interface Props {
  empresaRazonSocial: string
  empresaNit: string
  empresaDireccion: string
  empresaTelefono: string
  empresaCiudad: string
  cargo: string
  fechaIngreso: string
  tiempoServicio: string
  tipoContrato: string
}

defineProps<Props>();
</script>
