<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <FormField label="Arrendamientos">
      <UInputNumber
        v-model="form.informacion_economica.arrendamientos"
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
        v-model="form.informacion_economica.otros"
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
        v-model="form.informacion_economica.descripcion"
        class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Describa otros ingresos..."
      />
    </FormField>

    <FormField label="Total gastos">
      <UInputNumber
        v-model="form.informacion_economica.total_gastos"
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
        v-model="form.informacion_economica.gastos_descripcion"
        class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Describa los gastos..."
      />
    </FormField>

    <FormField label="Total activos">
      <UInputNumber
        v-model="form.informacion_economica.total_activos"
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
        v-model="form.informacion_economica.total_pasivos"
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
import FormField from "~/components/shared/FormField.vue";

interface Props {
  form: any;
  errors?: Record<string, string>;
}

withDefaults(defineProps<Props>(), {
  errors: () => ({})
});
</script>