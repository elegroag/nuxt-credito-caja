<template>
  <div class="grid gap-4">
    <FormField label="¿Incluir datos del cónyuge?">
      <URadioGroup
        :model-value="!!form.conyuge"
        :items="[
          { label: 'Sí', value: true },
          { label: 'No', value: false }
        ]"
        :disabled="loadingLocal"
        @update:model-value="toggleConyugeHandler"
      />
      <div v-if="loadingLocal" class="flex items-center gap-2 mt-2">
        <div
          class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
        />
        <span class="text-sm text-blue-700">Buscando datos del cónyuge...</span>
      </div>
    </FormField>

    <div
      v-if="loadingLocal"
      class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div
        class="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"
      />
      <span class="text-sm text-blue-700">Buscando datos del cónyuge...</span>
    </div>

    <div v-if="form.conyuge && !loadingLocal" class="grid gap-4 sm:grid-cols-2">
      <FormField label="Identificación" :error="errors && errors['conyuge.identificacion']">
        <UInput v-model="(form as any).conyuge.identificacion" />
      </FormField>
      <FormField label="Nombres y apellidos" :error="errors && errors['conyuge.nombres_apellidos']">
        <UInput v-model="(form as any).conyuge.nombres_apellidos" />
      </FormField>
      <FormField label="Ingresos laborales">
        <UInput v-model.number="(form as any).conyuge.ingresos_laborales" type="number" min="0" />
      </FormField>
      <FormField label="¿Trabaja?">
        <URadioGroup
          v-model="(form as any).conyuge.trabaja"
          :items="[
            { label: 'Sí', value: true },
            { label: 'No', value: false }
          ]"
        />
      </FormField>
      <FormField label="Teléfono móvil">
        <UInput v-model="(form as any).conyuge.telefono_movil" />
      </FormField>

      <div class="sm:col-span-2 mt-2 text-sm font-semibold text-foreground">Empresa (opcional)</div>
      <FormField label="¿Incluir empresa?" class="sm:col-span-2">
        <URadioGroup
          :model-value="!!(form as any).conyuge?.empresa"
          :items="[
            { label: 'Sí', value: true },
            { label: 'No', value: false }
          ]"
          @update:model-value="toggleEmpresaConyuge"
        />
      </FormField>

      <template v-if="(form as any).conyuge?.empresa">
        <FormField label="Nombre" class="sm:col-span-2">
          <UInput v-model="(form as any).conyuge.empresa.nombre" />
        </FormField>
        <FormField label="Dirección" class="sm:col-span-2">
          <UInput v-model="(form as any).conyuge.empresa.direccion" />
        </FormField>
        <FormField label="Teléfono">
          <UInput v-model="(form as any).conyuge.empresa.telefono" />
        </FormField>
        <FormField label="Email">
          <UInput v-model="(form as any).conyuge.empresa.email" type="email" />
        </FormField>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormField from "~/components/shared/FormField.vue";
import { useConyugeStep } from "~/composables/solicitud/useConyugeStep";

const props = defineProps<{
  form: any;
  toggleConyuge: (checked: boolean) => void;
  toggleEmpresaConyuge: (checked: boolean) => void;
  errors?: Record<string, string>;
}>();

const { loadingLocal, toggleConyugeHandler } = useConyugeStep({
  form: {
    get conyuge() { return props.form?.conyuge; },
    set(v: any) { (props.form as any).conyuge = v; },
    get informacion_laboral() { return props.form?.informacion_laboral; }
  } as any,
  toggleConyuge: props.toggleConyuge,
  toggleEmpresaConyuge: props.toggleEmpresaConyuge
});
</script>