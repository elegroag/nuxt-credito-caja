<template>
  <div class="mx-auto max-w-3xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        @click="goBack()"
      />
      <div>
        <h1 class="text-xl font-semibold text-foreground">
          Crear Nuevo Convenio
        </h1>
        <p class="text-sm text-muted-foreground">
          Complete el formulario para registrar un nuevo convenio empresarial
        </p>
      </div>
    </div>

    <!-- Error general -->
    <UAlert
      v-if="errors.general"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="errors.general"
    />

    <form
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <!-- Información de la Empresa -->
      <UPageCard
        title="Información de la Empresa"
        description="Datos de identificación de la empresa."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="NIT"
            required
            :error="errors.nit"
          >
            <UInput
              v-model="form.nit"
              type="number"
              placeholder="Ej: 123456789"
              icon="i-lucide-hash"
              :color="errors.nit ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.nit }}</span>
            </template>
          </UFormField>
          <UFormField
            label="Razón Social"
            required
            :error="errors.razon_social"
          >
            <UInput
              v-model="form.razon_social"
              placeholder="Nombre completo de la empresa"
              icon="i-lucide-building-2"
              :color="errors.razon_social ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.razon_social }}</span>
            </template>
          </UFormField>
        </div>
      </UPageCard>

      <!-- Información del Representante -->
      <UPageCard
        title="Información del Representante"
        description="Datos del representante legal de la empresa."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Documento Representante"
            required
            :error="errors.representante_documento"
          >
            <UInput
              v-model="form.representante_documento"
              type="number"
              placeholder="Cédula o documento de identidad"
              icon="i-lucide-id-card"
              :color="
                errors.representante_documento ? 'destructive' : undefined
              "
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{
                errors.representante_documento
              }}</span>
            </template>
          </UFormField>
          <UFormField
            label="Nombre Representante"
            required
            :error="errors.representante_nombre"
          >
            <UInput
              v-model="form.representante_nombre"
              placeholder="Nombre completo del representante legal"
              icon="i-lucide-user"
              :color="errors.representante_nombre ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{
                errors.representante_nombre
              }}</span>
            </template>
          </UFormField>
        </div>
      </UPageCard>

      <!-- Información de Contacto -->
      <UPageCard
        title="Información de Contacto"
        description="Datos de contacto de la empresa."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Teléfono"
            :error="errors.telefono"
          >
            <UInput
              v-model="form.telefono"
              type="tel"
              placeholder="Ej: 3001234567"
              icon="i-lucide-phone"
              :color="errors.telefono ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.telefono }}</span>
            </template>
          </UFormField>
          <UFormField
            label="Correo Electrónico"
            :error="errors.correo"
          >
            <UInput
              v-model="form.correo"
              type="email"
              placeholder="correo@empresa.com"
              icon="i-lucide-mail"
              :color="errors.correo ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.correo }}</span>
            </template>
          </UFormField>
        </div>
      </UPageCard>

      <!-- Fechas y Estado -->
      <UPageCard
        title="Vigencia y Estado"
        description="Fecha de vencimiento y estado inicial del convenio."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Fecha de Vencimiento"
            :error="errors.fecha_vencimiento"
          >
            <UInput
              v-model="form.fecha_vencimiento"
              type="date"
              icon="i-lucide-calendar"
              :color="errors.fecha_vencimiento ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{
                errors.fecha_vencimiento
              }}</span>
            </template>
          </UFormField>
          <UFormField
            label="Estado Inicial"
            :error="errors.estado"
          >
            <USelect
              v-model="form.estado"
              :items="opcionesEstado"
              value-key="value"
              label-key="label"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.estado }}</span>
            </template>
          </UFormField>
        </div>
      </UPageCard>

      <!-- Acciones -->
      <div class="flex justify-end gap-3">
        <UButton
          type="button"
          variant="outline"
          color="neutral"
          icon="i-lucide-x"
          :disabled="loading"
          @click="goBack()"
        >
          Cancelar
        </UButton>
        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-save"
          :loading="loading"
          :disabled="loading"
        >
          Crear Convenio
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const router = useRouter();
const loading = ref(false);
const errors = ref<Record<string, string>>({});

// Formulario reactivo
const form = reactive({
  nit: "",
  razon_social: "",
  representante_documento: "",
  representante_nombre: "",
  telefono: "",
  correo: "",
  fecha_vencimiento: "",
  estado: "Activo"
});

const opcionesEstado = [
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" }
];

// Validación del formulario
const validateForm = (): boolean => {
  errors.value = {};

  if (!form.nit) {
    errors.value.nit = "El NIT es requerido";
  } else if (!/^\d{6,16}$/.test(form.nit.toString())) {
    errors.value.nit = "El NIT debe ser un número de 6 a 16 dígitos";
  }

  if (!form.razon_social.trim()) {
    errors.value.razon_social = "La razón social es requerida";
  }

  if (!form.representante_documento) {
    errors.value.representante_documento
      = "El documento del representante es requerido";
  } else if (!/^\d{5,15}$/.test(form.representante_documento.toString())) {
    errors.value.representante_documento
      = "El documento debe ser un número de 5 a 15 dígitos";
  }

  if (!form.representante_nombre.trim()) {
    errors.value.representante_nombre
      = "El nombre del representante es requerido";
  }

  if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
    errors.value.correo = "El correo electrónico no tiene un formato válido";
  }

  if (form.telefono && !/^\d{7,15}$/.test(form.telefono.replace(/\s/g, ""))) {
    errors.value.telefono = "El teléfono no tiene un formato válido";
  }

  return Object.keys(errors.value).length === 0;
};

// Enviar formulario
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  errors.value = {};

  try {
    const response = await $fetch("/api/admin/convenios/create", {
      method: "POST",
      body: {
        nit: form.nit.toString(),
        razon_social: form.razon_social.trim(),
        representante_documento: form.representante_documento.toString(),
        representante_nombre: form.representante_nombre.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        fecha_vencimiento: form.fecha_vencimiento || "",
        estado: form.estado
      }
    });

    if (response.success) {
      loading.value = false;
      router.push("/admin/convenios");
    }
  } catch (err: any) {
    console.error("Error al crear convenio:", err);

    if (err.data?.errors) {
      errors.value = err.data.errors;
    } else if (err.data?.error) {
      errors.value.general = err.data.error;
    } else {
      errors.value.general = err.message || "Error al crear el convenio";
    }
  } finally {
    loading.value = false;
  }
};

// Volver a la página anterior
const goBack = () => {
  router.push("/admin/convenios");
};
</script>
