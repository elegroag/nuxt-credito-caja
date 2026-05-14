<template>
  <div class="grid gap-8">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-1 bg-primary rounded-full" />
          <h3
            class="text-sm font-bold uppercase tracking-wider text-muted-foreground"
          >
            Referencias familiares
          </h3>
        </div>
        <UButton
          variant="outline"
          size="sm"
          type="button"
          @click="addReferencia('familiares')"
        >
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
            <p class="text-sm font-semibold">
              Familiar #{{ Number(idx) + 1 }}
            </p>
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
            <FormField label="Nombre y apellidos" :error="errors?.[`referencias.familiares.${idx}.nombre_apellidos`]">
              <UInput
                v-model="r.nombre_apellidos"
                placeholder="Nombre completo"
              />
            </FormField>
            <FormField label="Celular" :error="errors?.[`referencias.familiares.${idx}.celular`]">
              <UInput
                v-model="r.celular"
                placeholder="Número de celular"
              />
            </FormField>
          </div>
        </UCard>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-1 bg-secondary rounded-full" />
          <h3
            class="text-sm font-bold uppercase tracking-wider text-muted-foreground"
          >
            Referencias personales
          </h3>
        </div>
        <UButton
          variant="outline"
          size="sm"
          type="button"
          @click="addReferencia('personales')"
        >
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
            <p class="text-sm font-semibold">
              Personal #{{ Number(idx) + 1 }}
            </p>
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
            <FormField label="Nombre y apellidos" :error="errors?.[`referencias.personales.${idx}.nombre_apellidos`]">
              <UInput
                v-model="r.nombre_apellidos"
                placeholder="Nombre completo"
              />
            </FormField>
            <FormField label="Celular" :error="errors?.[`referencias.personales.${idx}.celular`]">
              <UInput
                v-model="r.celular"
                placeholder="Número de celular"
              />
            </FormField>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import FormField from "~/components/shared/FormField.vue";

interface Props {
  form: any;
  addReferencia: (type: "familiares" | "personales") => void;
  removeReferencia: (type: "familiares" | "personales", index: number) => void;
  errors?: Record<string, string>;
}

withDefaults(defineProps<Props>(), {
  errors: () => ({})
});
</script>