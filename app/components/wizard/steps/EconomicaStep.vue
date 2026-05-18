<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField label="Arrendamientos">
      <UInputNumber
        v-model="localForm.arrendamientos"
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
        v-model="localForm.otros"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Descripción otros ingresos" class="sm:col-span-2">
      <textarea
        v-model="localForm.descripcion"
        class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Describa otros ingresos..."
      />
    </FormField>

    <FormField label="Total gastos">
      <UInputNumber
        v-model="localForm.total_gastos"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Descripción gastos" class="sm:col-span-2">
      <textarea
        v-model="localForm.gastos_descripcion"
        class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Describa los gastos..."
      />
    </FormField>

    <FormField label="Total activos">
      <UInputNumber
        v-model="localForm.total_activos"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
    <FormField label="Total pasivos">
      <UInputNumber
        v-model="localForm.total_pasivos"
        :format-options="{
          style: 'currency',
          currency: 'COP',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }"
      />
    </FormField>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import FormField from "~/components/shared/FormField.vue";
import type { SolicitudCreditoPayload } from "~~/shared/types/payload";

interface Props {
  form: SolicitudCreditoPayload;
  errors?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({})
});

const emit = defineEmits<{
  (e: "update:form", section: "informacion_economica", data: Record<string, unknown>): void;
}>();

// Local reactive copy of the section
const localForm = reactive({
  arrendamientos: props.form.informacion_economica?.arrendamientos ?? 0,
  otros: props.form.informacion_economica?.otros ?? 0,
  descripcion: props.form.informacion_economica?.descripcion ?? "",
  total_gastos: props.form.informacion_economica?.total_gastos ?? 0,
  gastos_descripcion: props.form.informacion_economica?.gastos_descripcion ?? "",
  total_activos: props.form.informacion_economica?.total_activos ?? 0,
  total_pasivos: props.form.informacion_economica?.total_pasivos ?? 0
});

// Emit local changes to parent
watch(
  localForm,
  (newVal) => {
    emit("update:form", "informacion_economica", { ...newVal });
  },
  { deep: true }
);

// Sync when prop changes from outside
watch(
  () => props.form.informacion_economica,
  (newVal) => {
    if (newVal) {
      Object.assign(localForm, {
        arrendamientos: newVal.arrendamientos ?? 0,
        otros: newVal.otros ?? 0,
        descripcion: newVal.descripcion ?? "",
        total_gastos: newVal.total_gastos ?? 0,
        gastos_descripcion: newVal.gastos_descripcion ?? "",
        total_activos: newVal.total_activos ?? 0,
        total_pasivos: newVal.total_pasivos ?? 0
      });
    }
  },
  { deep: true }
);
</script>