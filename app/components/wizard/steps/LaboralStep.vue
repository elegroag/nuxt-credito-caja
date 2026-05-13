<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField label="Razón social">
      <UInput v-model="form.informacion_laboral.empresa_razon_social" />
    </FormField>
    <FormField label="NIT">
      <UInput v-model="form.informacion_laboral.empresa_nit" />
    </FormField>
    <FormField label="Teléfono">
      <UInput v-model="form.informacion_laboral.empresa_telefono" />
    </FormField>
    <FormField label="Dirección">
      <UInput v-model="form.informacion_laboral.empresa_direccion" />
    </FormField>
    <FormField label="Ciudad">
      <CustomSelect
        v-model="form.informacion_laboral.empresa_ciudad"
        :options="ciudadesOptions"
        placeholder="Seleccionar ciudad"
        clearable
        searchable
      />
    </FormField>
    <FormField label="Cargo">
      <CustomSelect
        v-model="form.informacion_laboral.cargo"
        :options="cargosOptions"
        placeholder="Seleccionar cargo"
        clearable
        searchable
      />
    </FormField>
    <FormField label="Fecha ingreso">
      <UInput v-model="form.informacion_laboral.fecha_ingreso" type="date" />
    </FormField>
    <FormField label="Tipo contrato">
      <CustomSelect
        v-model="form.informacion_laboral.tipo_contrato"
        :options="tiposContratoOptions"
        placeholder="Seleccionar tipo"
        clearable
        searchable
      />
    </FormField>
    <FormField label="Nombramiento / Pagador">
      <UInput v-model="form.informacion_laboral.nombramiento_o_pagador" />
    </FormField>
    <FormField label="Tiempo servicio">
      <UInput v-model.number="form.informacion_laboral.tiempo_servicio" type="number" min="0" />
    </FormField>
    <FormField label="Unidad">
      <CustomSelect
        v-model="form.informacion_laboral.tiempo_servicio_unidad"
        :options="tiempoUnidadOptions"
        placeholder="Seleccionar unidad"
      />
    </FormField>
  </div>
</template>

<script setup lang="ts">
import FormField from "~/components/shared/FormField.vue";
import CustomSelect from "~/components/shared/CustomSelect.vue";
import { useLaboralStep } from "~/composables/solicitud/useLaboralStep";
import type { LaboralProps } from "~~/shared/types/componentes";

const props = withDefaults(defineProps<LaboralProps>(), {
  ciudades: () => [],
  tiposContrato: () => [],
  ocupaciones: () => []
});

const {
  // Opciones para los selects
  tiempoUnidadOptions,
  cargosOptions,
  ciudadesOptions,
  tiposContratoOptions
} = useLaboralStep(props);
</script>
