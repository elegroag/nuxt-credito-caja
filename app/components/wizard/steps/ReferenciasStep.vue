<template>
  <div class="grid gap-8">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-1 bg-primary rounded-full" />
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Referencias familiares
          </h3>
        </div>
        <UButton variant="outline" size="sm" type="button" @click="addReferencia('familiares')">
          <Plus class="mr-2 h-4 w-4" />
          Agregar
        </UButton>
      </div>

      <div
        v-if="form.referencias.familiares.length === 0"
        class="rounded-lg bg-muted/50 p-6 text-center border-2 border-dashed border-border"
      >
        <p class="text-sm text-muted-foreground italic">
          No se han registrado referencias familiares.
        </p>
      </div>

      <div class="grid gap-4">
        <UCard
          v-for="(r, idx) in form.referencias.familiares"
          :key="`f-${idx}`"
          class="border-border/50 bg-muted/20 shadow-none"
        >
          <div class="flex flex-row items-center justify-between mb-3">
            <p class="text-sm font-semibold">Familiar #{{ Number(idx) + 1 }}</p>
            <UButton
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
              @click="removeReferencia('familiares', Number(idx))"
            >
              <Trash2 class="h-4 w-4" />
            </UButton>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Nombre y apellidos"
              :error="errors?.[`referencias.familiares.${idx}.nombre_apellidos`]"
            >
              <UInput v-model="r.nombre_apellidos" placeholder="Nombre completo" />
            </FormField>
            <FormField label="Celular" :error="errors?.[`referencias.familiares.${idx}.celular`]">
              <UInput v-model="r.celular" placeholder="Número de celular" type="number" />
            </FormField>
          </div>
        </UCard>
      </div>

      <div
        v-if="minimaFamiliares > 0 && !familiaresValido"
        class="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
      >
        <span class="font-semibold">Nota:</span> Necesitas al menos
        {{ minimaFamiliares }} referencia{{ minimaFamiliares === 1 ? "" : "s" }} familiar{{
          minimaFamiliares === 1 ? "" : "es"
        }}.
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-1 bg-secondary rounded-full" />
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Referencias personales
          </h3>
        </div>
        <UButton variant="outline" size="sm" type="button" @click="addReferencia('personales')">
          <Plus class="mr-2 h-4 w-4" />
          Agregar
        </UButton>
      </div>

      <div
        v-if="form.referencias.personales.length === 0"
        class="rounded-lg bg-muted/50 p-6 text-center border-2 border-dashed border-border"
      >
        <p class="text-sm text-muted-foreground italic">
          No se han registrado referencias personales.
        </p>
      </div>

      <div class="grid gap-4">
        <UCard
          v-for="(r, idx) in form.referencias.personales"
          :key="`p-${idx}`"
          class="border-border/50 bg-muted/20 shadow-none"
        >
          <div class="flex flex-row items-center justify-between mb-3">
            <p class="text-sm font-semibold">Personal #{{ Number(idx) + 1 }}</p>
            <UButton
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
              @click="removeReferencia('personales', Number(idx))"
            >
              <Trash2 class="h-4 w-4" />
            </UButton>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Nombre y apellidos"
              :error="errors?.[`referencias.personales.${idx}.nombre_apellidos`]"
            >
              <UInput v-model="r.nombre_apellidos" placeholder="Nombre completo" />
            </FormField>
            <FormField label="Celular" :error="errors?.[`referencias.personales.${idx}.celular`]">
              <UInput v-model="r.celular" placeholder="Número de celular" type="number" />
            </FormField>
          </div>
        </UCard>
      </div>

      <div
        v-if="minimaPersonales > 0 && !personalesValido"
        class="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
      >
        <span class="font-semibold">Nota:</span> Necesitas al menos
        {{ minimaPersonales }} referencia{{ minimaPersonales === 1 ? "" : "s" }} personal{{
          minimaPersonales === 1 ? "" : "es"
        }}.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import { computed } from "vue";
import FormField from "~/components/shared/FormField.vue";
import { useConfigurations } from "~/composables/admin/useConfigurations";
import type { SolicitudCreditoPayload } from "~~/shared/types/payload";

interface Props {
  form: SolicitudCreditoPayload;
  addReferencia: (type: "familiares" | "personales") => void;
  removeReferencia: (type: "familiares" | "personales", index: number) => void;
  errors?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({})
});

const { getConfigurationAsNumber } = useConfigurations();

const minimaFamiliares = computed(() => getConfigurationAsNumber("referencias_familiares", 1));
const minimaPersonales = computed(() => getConfigurationAsNumber("referencias_personales", 1));

const familiaresValido = computed(() => {
  if (minimaFamiliares.value === 0) return true;
  return (props.form?.referencias?.familiares?.length || 0) >= minimaFamiliares.value;
});
const personalesValido = computed(() => {
  if (minimaPersonales.value === 0) return true;
  return (props.form?.referencias?.personales?.length || 0) >= minimaPersonales.value;
});

const _cantidadValida = computed(() => familiaresValido.value && personalesValido.value);
</script>
