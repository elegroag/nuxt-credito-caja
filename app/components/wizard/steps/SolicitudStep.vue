<template>
  <div class="grid gap-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Fecha radicado -->
      <FormField label="Fecha radicado" class="sm:col-span-2">
        <UInput v-model="form.solicitud.fecha_radicado" type="date" disabled />
      </FormField>

      <!-- Campos de solicitud -->
      <FormField label="Número solicitud">
        <UInput v-model="form.solicitud.numero_solicitud" disabled />
      </FormField>
      <FormField label="Número comprobante">
        <UInput v-model="form.solicitud.numero_comprobante" />
      </FormField>
      <FormField label="Valor solicitud">
        <UInput
          v-model.number="form.solicitud.valor_solicitud"
          type="number"
          min="0"
          disabled
        />
      </FormField>
      <FormField label="Categoría">
        <UInput v-model="form.solicitante.codigo_categoria" disabled />
      </FormField>
      <FormField label="Rol en solicitud">
        <CustomSelect
          v-model="form.solicitud.rol_en_solicitud"
          :options="rolesOptions"
          placeholder="Seleccionar rol"
        />
      </FormField>
      <FormField label="Valor mensual">
        <UInput
          v-model.number="form.solicitud.cuota_mensual"
          type="number"
          min="0"
          disabled
        />
      </FormField>
      <FormField label="Plazo (meses)">
        <UInput
          v-model.number="form.solicitud.plazo_meses"
          type="number"
          min="1"
          disabled
        />
      </FormField>
      <FormField label="Producto">
        <CustomSelect
          v-model="form.solicitud.producto_tipo"
          :options="productosOptions"
          placeholder="Seleccionar producto"
        />
      </FormField>
      <FormField label="Linea de crédito">
        <UInput
          v-model="form.solicitud.detalle_modalidad"
          disabled
          placeholder="Seleccionar linea"
        />
      </FormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 mt-4">
      <FormField label="¿Ha tenido crédito con Comfaca?">
        <URadioGroup
          v-model="form.solicitud.ha_tenido_credito"
          :items="[
            { label: 'Sí', value: true },
            { label: 'No', value: false },
          ]"
        />
      </FormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormField from "~/components/shared/FormField.vue";
import CustomSelect from "~/components/shared/CustomSelect.vue";
import type {
  SelectOption,
  SolicitudProps,
} from "~~/shared/types/solicitud-credito";

const props = defineProps<SolicitudProps>();

// Opciones para roles en solicitud
const rolesOptions: SelectOption[] = [
  { label: "Trabajador", value: "T" },
  { label: "Solicitante", value: "S" },
  { label: "Codeudor", value: "C" },
  { label: "Empleador", value: "E" },
];

// Opciones para productos basadas en tiposInversion
const productosOptions = computed<SelectOption[]>(() => {
  return (props.tiposInversion || []).map((tipo) => ({
    label: tipo.detalle,
    value: tipo.tipinv,
  }));
});
</script>
