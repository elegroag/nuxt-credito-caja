<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField label="Tipo persona">
      <CustomSelect
        v-model="form.solicitante.tipo_persona"
        :options="tiposPersonaOptions"
        placeholder="Seleccionar tipo"
        clearable
      />
    </FormField>

    <FormField label="Tipo documento" :error="errors && errors['solicitante.tipo_documento']">
      <CustomSelect
        v-model="form.solicitante.tipo_documento"
        :options="tiposDocumentoOptions"
        placeholder="Seleccionar tipo"
        clearable
        disabled
      />
    </FormField>

    <FormField label="Número documento" :error="errors && errors['solicitante.numero_documento']">
      <UInput v-model="form.solicitante.numero_documento" disabled />
    </FormField>

    <FormField label="Nombres" :error="errors && errors['solicitante.nombres']">
      <UInput v-model="form.solicitante.nombres" />
    </FormField>

    <FormField label="Apellidos" :error="errors && errors['solicitante.apellidos']">
      <UInput v-model="form.solicitante.apellidos" />
    </FormField>

    <FormField label="Razón social (opcional)">
      <UInput v-model="form.informacion_laboral.empresa_razon_social" disabled />
    </FormField>

    <FormField label="NIT (opcional)">
      <UInput v-model="form.informacion_laboral.empresa_nit" disabled />
    </FormField>

    <FormField label="Fecha nacimiento">
      <UInput v-model="form.solicitante.fecha_nacimiento" type="date" />
    </FormField>

    <FormField label="Género">
      <CustomSelect
        v-model="form.solicitante.genero"
        :options="sexosOptions"
        placeholder="Seleccionar género"
        clearable
      />
    </FormField>

    <FormField label="Estado civil">
      <CustomSelect
        v-model="form.solicitante.estado_civil"
        :options="estadoCivilesOptions"
        placeholder="Seleccionar estado civil"
        clearable
      />
    </FormField>

    <FormField label="Nivel educativo">
      <CustomSelect
        v-model="form.solicitante.nivel_educativo"
        :options="nivelesEducativosOptions"
        placeholder="Seleccionar nivel"
        clearable
        searchable
      />
    </FormField>

    <FormField label="Profesión">
      <CustomSelect
        v-model="form.solicitante.profesion"
        :options="ocupacionesOptions"
        placeholder="Seleccionar profesión"
        clearable
        searchable
      />
    </FormField>

    <FormField label="Email">
      <UInput v-model="form.solicitante.email" type="email" />
    </FormField>

    <FormField label="Teléfono (opcional)">
      <UInput v-model="form.solicitante.telefono" />
    </FormField>

    <FormField label="Celular" :error="errors && errors['solicitante.celular']">
      <UInput v-model="form.solicitante.celular" />
    </FormField>

    <FormField label="Dirección" :error="errors && errors['solicitante.direccion']">
      <UInput v-model="form.solicitante.direccion" />
    </FormField>

    <FormField label="Barrio">
      <UInput v-model="form.solicitante.barrio" />
    </FormField>

    <FormField label="Ciudad">
      <CustomSelect
        v-model="form.solicitante.ciudad"
        :options="ciudadesOptions"
        placeholder="Seleccionar ciudad"
        clearable
        searchable
        @option:selected="handleCiudadChange"
      />
    </FormField>

    <FormField label="Departamento">
      <UInput v-model="form.solicitante.departamento" />
    </FormField>

    <FormField label="País de residencia">
      <CustomSelect
        v-model="form.solicitante.pais_residencia"
        :options="paisesOptions"
        placeholder="Seleccionar país"
        clearable
        searchable
      />
    </FormField>

    <FormField label="Tipo de vivienda">
      <CustomSelect
        v-model="form.solicitante.tipo_vivienda"
        :options="tiposViviendaOptions"
        placeholder="Seleccionar tipo"
        clearable
      />
    </FormField>

    <FormField label="¿Vive con núcleo familiar?">
      <URadioGroup
        v-model="form.solicitante.vive_con_nucleo_familiar"
        :items="[
          { label: 'Sí', value: true },
          { label: 'No', value: false }
        ]"
      />
    </FormField>

    <FormField label="Personas a cargo">
      <UInput v-model.number="form.solicitante.personas_a_cargo" type="number" min="0" />
    </FormField>

    <FormField label="Cargo">
      <UInput :model-value="cargoDisplay" :readonly="true" />
    </FormField>

    <FormField label="Salario (opcional)">
      <UInput v-model.number="form.solicitante.salario" type="number" min="0" disabled />
    </FormField>

    <FormField label="Código categoría">
      <UInput v-model="form.solicitante.codigo_categoria" disabled />
    </FormField>

    <FormField label="Antigüedad (meses, opcional)">
      <UInput v-model.number="form.solicitante.antiguedad_meses" type="number" min="0" />
    </FormField>

    <FormField label="Tipo contrato (opcional)">
      <CustomSelect
        v-model="form.solicitante.tipo_contrato"
        :options="tiposContratoOptions"
        placeholder="Seleccionar tipo"
        clearable
      />
    </FormField>

    <FormField label="Sector económico (opcional)">
      <UInput v-model="form.solicitante.sector_economico" />
    </FormField>
  </div>
</template>

<script setup lang="ts">
import FormField from "~/components/shared/FormField.vue";
import CustomSelect from "~/components/shared/CustomSelect.vue";
import { useSolicitanteStep } from "~/composables/solicitud/useSolicitanteStep";
import { useParametrosDetalles } from "~/composables/useParametrosDetalles";
import { computed, onMounted } from "vue";
import type { SolicitanteProps } from "~~/shared/types/solicitante";

const props = withDefaults(defineProps<SolicitanteProps>(), {
  ciudades: () => [],
  tiposDocumento: () => [],
  sexos: () => [],
  nivelesEducativos: () => [],
  tiposVivienda: () => [],
  ocupaciones: () => [],
  estadoCiviles: () => [],
  errors: () => ({})
});

const {
  tiposPersonaOptions,
  tiposDocumentoOptions,
  ocupacionesOptions,
  sexosOptions,
  nivelesEducativosOptions,
  tiposViviendaOptions,
  estadoCivilesOptions,
  ciudadesOptions,
  paisesOptions,
  booleanOptions,
  tiposContratoOptions,
  handleCiudadChange
} = useSolicitanteStep(props);

const { cargarParametros, buscarCargo } = useParametrosDetalles();

const cargoDisplay = computed(() => {
  const cargoCode = props.form?.solicitante?.cargo;
  if (!cargoCode) return "";
  return buscarCargo(cargoCode);
});

onMounted(() => {
  cargarParametros().catch(() => {});
});
</script>