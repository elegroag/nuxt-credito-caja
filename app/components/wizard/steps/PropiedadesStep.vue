<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between mb-4">
      <div
        class="text-sm font-bold uppercase tracking-wider text-muted-foreground"
      >
        Propiedades
      </div>
      <UButton variant="outline" size="sm" type="button" @click="addPropiedad">
        <Plus class="mr-2 h-4 w-4" />
        Agregar
      </UButton>
    </div>

    <div
      v-if="form.propiedades.length === 0"
      class="rounded-lg bg-muted/50 p-8 text-center border-2 border-dashed border-border"
    >
      <p class="text-sm text-muted-foreground italic">
        No se han registrado propiedades.
      </p>
    </div>

    <div class="grid gap-4">
      <UCard
        v-for="(p, idx) in form.propiedades"
        :key="idx"
        class="border-border/50 bg-muted/20"
      >
        <div class="flex flex-row items-center justify-between mb-3">
          <p class="text-sm font-semibold">
            Propiedad #{{ (idx as number) + 1 }}
          </p>
          <UButton
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
            @click="removePropiedad(idx as number)"
          >
            <Trash2 class="h-4 w-4" />
          </UButton>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField label="Tipo bien">
            <CustomSelect
              v-model="p.tipo_bien"
              :options="tiposBienOptions"
              placeholder="Seleccionar tipo"
            />
          </FormField>
          <FormField label="Ciudad">
            <CustomSelect
              v-model="p.ciudad"
              :options="ciudadesOptions"
              placeholder="Seleccionar ciudad"
              clearable
              searchable
            />
          </FormField>
          <FormField label="Descripción" class="sm:col-span-2">
            <UInput v-model="p.descripcion" />
          </FormField>

          <FormField
            v-if="p.tipo_bien === 'vivienda'"
            label="Matrícula inmobiliaria"
          >
            <UInput v-model="p.matricula_inmobiliaria" />
          </FormField>
          <FormField v-else label="Modelo o matrícula">
            <UInput v-model="p.modelo_o_matricula" />
          </FormField>

          <FormField label="Valor comercial">
            <UInput v-model.number="p.valor_comercial" type="number" min="0" />
          </FormField>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import { computed } from "#imports";
import FormField from "~/components/shared/FormField.vue";

import CustomSelect from "~/components/shared/CustomSelect.vue";
import type {
  SelectOption,
  PropiedadesProps,
} from "~~/shared/types/solicitud-credito";

const props = withDefaults(defineProps<PropiedadesProps>(), {
  ciudades: () => [],
});

// Opciones para tipo de bien
const tiposBienOptions: SelectOption[] = [
  { label: "Vivienda", value: "vivienda" },
  { label: "Vehículo", value: "vehiculo" },
];

// Convertir ciudades a formato SelectOption
const ciudadesOptions = computed(() =>
  props.ciudades.map((item) => ({
    label: item.detciu,
    value: item.codciu,
  })),
);
</script>
