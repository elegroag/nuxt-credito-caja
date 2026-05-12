<template>
  <SectionCard
    title="Datos del Solicitante"
    icon-bg-class="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
  >
    <template #icon>
      <User class="h-5 w-5" />
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <InfoField
        label="Nombres Completos"
        :value="nombresApellidos"
        value-class="font-semibold text-gray-900 dark:text-white"
      />
      <InfoField
        label="Tipo de Identificación"
        :value="tipoIdentificacion"
      />
      <InfoField
        label="Número de Identificación"
        :value="numeroIdentificacion"
        value-class="font-mono text-gray-900 dark:text-white"
      />
      <InfoField
        label="Fecha de Nacimiento"
        :value="fechaNacimiento"
      />
      <InfoField
        label="Teléfono"
        :value="telefono"
        value-class="font-mono text-gray-900 dark:text-white"
      />
      <InfoField
        label="Email"
        :value="email"
        value-class="text-blue-600 dark:text-blue-400"
      />
      <InfoField
        label="Dirección de Residencia"
        :value="direccion"
      />
      <InfoField
        label="Ciudad de Residencia"
        :value="ciudad"
      />
      <InfoField
        label="Tipo de Vivienda"
        :value="tipoVivienda"
      />
      <InfoField
        label="Personas a Cargo"
        :value="personasACargo"
      />
      <InfoField
        label="Categoría"
        :value="categoria"
      />
      <InfoField
        label="Salario"
        :value="salario"
        value-class="font-bold text-purple-600 dark:text-purple-400 text-lg"
      />
      <InfoField
        label="NIT Empresa"
        :value="empresaNit"
      />
      <InfoField
        label="Razón Social Empresa"
        :value="empresaRazonSocial"
      />
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { User } from "lucide-vue-next";
import SectionCard from "./SectionCard.vue";
import InfoField from "./InfoField.vue";

interface Props {
  nombresApellidos: string
  tipoIdentificacion: string
  numeroIdentificacion: string
  fechaNacimiento: string
  telefono: string
  email: string
  direccion: string
  ciudad: string
  tipoVivienda: string
  personasACargo: string | number
  categoria: string
  salario: string
  empresaNit: string
  empresaRazonSocial: string
}

const props = defineProps<Props>();
</script>
