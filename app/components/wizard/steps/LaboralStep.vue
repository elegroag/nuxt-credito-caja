<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField
      label="Razón social"
      :error="errors && errors['informacion_laboral.empresa_razon_social']"
    >
      <UInput v-model="form.informacion_laboral.empresa_razon_social" disabled />
    </FormField>
    <FormField label="NIT" :error="errors && errors['informacion_laboral.empresa_nit']">
      <UInput v-model="form.informacion_laboral.empresa_nit" disabled />
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
    <FormField label="Cargo" :error="errors && errors['informacion_laboral.cargo']">
      <CustomSelect
        v-model="form.informacion_laboral.cargo"
        :options="cargosOptions"
        placeholder="Seleccionar cargo"
        clearable
        searchable
      />
    </FormField>
    <FormField label="Fecha ingreso" :error="errors && errors['informacion_laboral.fecha_ingreso']">
      <UInput v-model="form.informacion_laboral.fecha_ingreso" type="date" disabled />
    </FormField>
    <FormField label="Tipo contrato">
      <CustomSelect
        v-model="form.informacion_laboral.tipo_contrato"
        :options="tiposContratoOptions"
        placeholder="Seleccionar tipo"
        clearable
        searchable
        disabled
      />
    </FormField>
    <FormField label="Nombre del pagador">
      <UInput v-model="form.informacion_laboral.nombre_pagador" disabled />
    </FormField>
    <FormField label="Tiempo servicio">
      <UInput
        v-model.number="form.informacion_laboral.tiempo_servicio"
        type="number"
        min="0"
        disabled
      />
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
import type { LaboralProps } from "~~/shared/types/componentes";

const props = withDefaults(defineProps<LaboralProps>(), {
  ciudades: () => [],
  tiposContrato: () => [],
  ocupaciones: () => [],
  errors: () => ({}),
  disabled: false
});

const tiempoUnidadOptions = [
  { label: "Meses", value: "meses" },
  { label: "Años", value: "anios" }
];

const ciudadesOptions = computed(() =>
  (props.ciudades || [])
    .filter((item) => item.codciu && item.codciu.trim() !== "")
    .map((item) => ({
      label: item.detciu,
      value: item.codciu
    }))
);

const tiposContratoOptions = computed(() =>
  (props.tiposContrato || []).map((item) => ({
    label: item.detalle,
    value: item.tipcon
  }))
);

const cargosOptions = computed(() =>
  (props.ocupaciones || []).map((item) => ({
    label: item.detalle,
    value: item.codocu
  }))
);
</script>
