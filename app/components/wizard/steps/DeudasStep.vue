<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm font-bold uppercase tracking-wider text-muted-foreground">Deudas</div>
      <UButton variant="outline" size="sm" type="button" @click="addDeuda">
        <Plus class="mr-2 h-4 w-4" />
        Agregar
      </UButton>
    </div>

    <div
      v-if="form.deudas.length === 0"
      class="rounded-lg bg-muted/50 p-8 text-center border-2 border-dashed border-border"
    >
      <p class="text-sm text-muted-foreground italic">No se han registrado deudas.</p>
    </div>

    <div class="grid gap-4">
      <UCard v-for="(d, idx) in form.deudas" :key="idx" class="border-border/50 bg-muted/20">
        <div class="flex flex-row items-center justify-between mb-3">
          <p class="text-sm font-semibold">Deuda #{{ Number(idx) + 1 }}</p>
          <UButton
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
            @click="removeDeuda(Number(idx))"
          >
            <Trash2 class="h-4 w-4" />
          </UButton>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField label="Acreedor" :error="errors && errors[`deudas.${idx}.acreedor_nombre`]">
            <UInput v-model="d.acreedor_nombre" />
          </FormField>
          <FormField label="Concepto" :error="errors && errors[`deudas.${idx}.concepto`]">
            <UInput v-model="d.concepto" />
          </FormField>
          <FormField label="Valor cuota">
            <UInputNumber
              v-model="d.valor_cuota"
              :format-options="{
                style: 'currency',
                currency: 'COP',
                currencyDisplay: 'symbol',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }"
            />
          </FormField>
          <FormField label="Saldo obligación">
            <UInputNumber
              v-model="d.saldo_obligacion"
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
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import FormField from "~/components/shared/FormField.vue";
import type { SolicitudCreditoPayload } from "~~/shared/types/payload";

defineProps<{
  form: SolicitudCreditoPayload;
  addDeuda: () => void;
  removeDeuda: (index: number) => void;
  errors?: Record<string, string>;
}>();
</script>