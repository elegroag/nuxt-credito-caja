<template>
  <div class="grid gap-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField label="Fecha radicado" class="sm:col-span-2">
        <UInput v-model="(form as any).solicitud.fecha_radicado" type="date" disabled />
      </FormField>

      <FormField label="Número solicitud">
        <UInput v-model="(form as any).solicitud.numero_solicitud" disabled />
      </FormField>
      <FormField label="Valor solicitud">
        <UInput v-model.number="(form as any).solicitud.valor_solicitud" type="number" min="0" disabled />
      </FormField>
      <FormField label="Categoría">
        <UInput v-model="(form as any).solicitante.codigo_categoria" disabled />
      </FormField>
      <FormField label="Rol en solicitud" :error="errors && errors['solicitud.rol_en_solicitud']">
        <CustomSelect
          v-model="(form as any).solicitud.rol_en_solicitud"
          :options="rolesOptions"
          placeholder="Seleccionar rol"
        />
      </FormField>
      <FormField label="Valor mensual">
        <UInput v-model.number="(form as any).solicitud.cuota_mensual" type="number" min="0" disabled />
      </FormField>
      <FormField label="Plazo (meses)">
        <UInput v-model.number="(form as any).solicitud.plazo_meses" type="number" min="1" disabled />
      </FormField>
      <FormField label="Linea de crédito">
        <UInput
          v-model="(form as any).solicitud.detalle_modalidad"
          disabled
          placeholder="Seleccionar linea"
        />
      </FormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 mt-4">
      <FormField label="¿Ha tenido crédito con Comfaca?">
        <URadioGroup
          v-model="(form as any).solicitud.ha_tenido_credito"
          :items="[
            { label: 'Sí', value: true },
            { label: 'No', value: false }
          ]"
        />
      </FormField>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormField from "~/components/shared/FormField.vue";
import CustomSelect from "~/components/shared/CustomSelect.vue";

const props = defineProps<{
  form: any;
  fechaRadicado?: string;
  errors?: Record<string, string>;
}>();

const rolesOptions = [
  { label: "Trabajador", value: "T" },
  { label: "Solicitante", value: "S" },
  { label: "Codeudor", value: "C" },
  { label: "Empleador", value: "E" }
];
</script>