<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField label="Salario básico mensual">
      <UInput
        v-model.number="form.ingresos_descuentos.salario_basico_mensual"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Subsidio transporte">
      <UInput
        v-model.number="form.ingresos_descuentos.subsidio_transporte"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Horas extras">
      <UInput
        v-model.number="form.ingresos_descuentos.horas_extras"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Comisiones">
      <UInput
        v-model.number="form.ingresos_descuentos.comisiones"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Otros ingresos">
      <UInput
        v-model.number="form.ingresos_descuentos.otros_ingresos"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Total ingresos">
      <UInput
        :model-value="form.ingresos_descuentos.total_ingresos"
        type="number"
        min="0"
        disabled
      />
    </FormField>

    <div class="col-span-full mt-4 flex items-center gap-2">
      <div class="h-px flex-1 bg-border" />
      <span
        class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >Descuentos</span>
      <div class="h-px flex-1 bg-border" />
    </div>

    <FormField label="Salud y pensión">
      <UInput
        v-model.number="form.ingresos_descuentos.salud_pension"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Libranzas Comfaca">
      <UInput
        v-model.number="form.ingresos_descuentos.libranzas_comfaca"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Otras libranzas">
      <UInput
        v-model.number="form.ingresos_descuentos.otras_libranzas"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Judiciales">
      <UInput
        v-model.number="form.ingresos_descuentos.judiciales"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Otras deducciones">
      <UInput
        v-model.number="form.ingresos_descuentos.otras_deducciones"
        type="number"
        min="0"
      />
    </FormField>
    <FormField label="Total descuentos">
      <UInput
        :model-value="form.ingresos_descuentos.total_descuentos"
        type="number"
        min="0"
        disabled
      />
    </FormField>

    <FormField label="Total neto recibido">
      <UInput
        :model-value="form.ingresos_descuentos.total_neto_recibido"
        type="number"
        min="0"
        disabled
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
import { watch, onMounted } from "vue";
import { RefreshCw } from "lucide-vue-next";
import FormField from "~/components/shared/FormField.vue";

import type { IngrresosProps } from "~~/shared/types/solicitud-credito";
import { useSolicitudCreditoForm } from "~/composables/solicitud/useSolicitudCreditoForm";

const props = defineProps<IngrresosProps>();
const { autocalcularIngresos } = useSolicitudCreditoForm();

// Calcular totales iniciales al montar el componente
onMounted(() => {
  autocalcularIngresos();
});

// Auto-calcular totales cuando cambian los valores de ingresos
watch(
  [
    () => props.form.ingresos_descuentos.salario_basico_mensual,
    () => props.form.ingresos_descuentos.subsidio_transporte,
    () => props.form.ingresos_descuentos.horas_extras,
    () => props.form.ingresos_descuentos.comisiones,
    () => props.form.ingresos_descuentos.otros_ingresos
  ],
  () => {
    autocalcularIngresos();
  },
  { deep: true }
);

// Auto-calcular totales cuando cambian los valores de descuentos
watch(
  [
    () => props.form.ingresos_descuentos.salud_pension,
    () => props.form.ingresos_descuentos.libranzas_comfaca,
    () => props.form.ingresos_descuentos.otras_libranzas,
    () => props.form.ingresos_descuentos.judiciales,
    () => props.form.ingresos_descuentos.otras_deducciones
  ],
  () => {
    autocalcularIngresos();
  },
  { deep: true }
);
</script>
