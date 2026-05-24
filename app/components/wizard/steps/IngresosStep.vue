<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField
      label="Salario básico mensual"
      :error="errors && errors['ingresos_descuentos.salario_basico_mensual']"
    >
      <UInputNumber
        v-model="formData.ingresos_descuentos.salario_basico_mensual"
        disabled
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Subsidio transporte">
      <UInputNumber
        v-model="formData.ingresos_descuentos.subsidio_transporte"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Horas extras">
      <UInputNumber
        v-model="formData.ingresos_descuentos.horas_extras"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Comisiones">
      <UInputNumber
        v-model="formData.ingresos_descuentos.comisiones"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Otros ingresos">
      <UInputNumber
        v-model="formData.ingresos_descuentos.otros_ingresos"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Total ingresos">
      <UInputNumber
        :model-value="formData.ingresos_descuentos.total_ingresos"
        disabled
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>

    <div class="col-span-full mt-4 flex items-center gap-2">
      <div class="h-px flex-1 bg-border" />
      <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Descuentos
      </span>
      <div class="h-px flex-1 bg-border" />
    </div>

    <FormField label="Salud y pensión">
      <UInputNumber
        v-model="formData.ingresos_descuentos.salud_pension"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Libranzas Comfaca">
      <UInputNumber
        v-model="formData.ingresos_descuentos.libranzas_comfaca"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Otras libranzas">
      <UInputNumber
        v-model="formData.ingresos_descuentos.otras_libranzas"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Judiciales">
      <UInputNumber
        v-model="formData.ingresos_descuentos.judiciales"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Otras deducciones">
      <UInputNumber
        v-model="formData.ingresos_descuentos.otras_deducciones"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Total descuentos">
      <UInputNumber
        :model-value="formData.ingresos_descuentos.total_descuentos"
        disabled
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>

    <FormField label="Total neto recibido">
      <UInputNumber
        :model-value="formData.ingresos_descuentos.total_neto_recibido"
        disabled
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>

    <div class="col-span-full">
      <UButton
        variant="outline"
        size="sm"
        type="button"
        class="w-full"
        @click="autocalcularIngresos"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Autocalcular totales
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { RefreshCw } from "@lucide/vue";
import FormField from "~/components/shared/FormField.vue";

import { useSolicitudCreditoForm } from "~/composables/solicitud/useSolicitudCreditoForm";
import type { SolicitudCreditoPayload } from "~~/shared/types/payload";

const props = defineProps<{
  form: SolicitudCreditoPayload;
  autocalcularIngresos: () => void;
  errors?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update:form", value: SolicitudCreditoPayload): void;
}>();

const formData = computed({
  get: () => props.form,
  set: (value) => emit("update:form", value)
});

const { autocalcularIngresos: calc } = useSolicitudCreditoForm();

onMounted(() => {
  calc();
});

watch(
  [
    () => formData.value?.ingresos_descuentos?.salario_basico_mensual,
    () => formData.value?.ingresos_descuentos?.subsidio_transporte,
    () => formData.value?.ingresos_descuentos?.horas_extras,
    () => formData.value?.ingresos_descuentos?.comisiones,
    () => formData.value?.ingresos_descuentos?.otros_ingresos
  ],
  () => {
    calc();
  },
  { deep: true }
);

watch(
  [
    () => formData.value?.ingresos_descuentos?.salud_pension,
    () => formData.value?.ingresos_descuentos?.libranzas_comfaca,
    () => formData.value?.ingresos_descuentos?.otras_libranzas,
    () => formData.value?.ingresos_descuentos?.judiciales,
    () => formData.value?.ingresos_descuentos?.otras_deducciones
  ],
  () => {
    calc();
  },
  { deep: true }
);
</script>
