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
        <h1 class="text-xl font-semibold text-foreground">Editar Convenio</h1>
        <p class="text-sm text-muted-foreground">
          Modifique la información del convenio empresarial
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

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <UIcon
        name="i-lucide-loader-2"
        class="w-10 h-10 animate-spin text-primary mb-4"
      />
      <p class="text-muted-foreground">Cargando información del convenio...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon name="i-lucide-x-circle" class="w-10 h-10 text-destructive mb-4" />
      <p class="text-destructive mb-4">{{ error }}</p>
      <UButton variant="outline" @click="cargarConvenio">Reintentar</UButton>
    </div>

    <!-- Formulario -->
    <form v-else-if="convenio" @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Información de la Empresa -->
      <UPageCard
        title="Información de la Empresa"
        description="Datos de identificación de la empresa."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="NIT" required :error="errors.nit">
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
              type="text"
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
              type="text"
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
              type="text"
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
          <UFormField label="Teléfono" :error="errors.telefono">
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

          <UFormField label="Correo Electrónico" :error="errors.correo">
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

          <UFormField label="Estado" :error="errors.estado">
            <USelectMenu
              v-model="form.estado"
              :items="[
                { label: 'Activo', value: 'Activo' },
                { label: 'Inactivo', value: 'Inactivo' },
              ]"
              value-key="value"
              placeholder="Seleccionar estado"
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
          {{ loading ? "Guardando..." : "Actualizar Convenio" }}
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref<string | null>(null);
const convenio = ref<any>(null);
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
  estado: "Activo" as "Activo" | "Inactivo",
});

// Cargar datos del convenio
const cargarConvenio = async () => {
  loading.value = true;
  error.value = null;

  try {
    const api = useApi();
    const response = await api.getJson<any>(
      `/api/admin/convenios/${route.params.id}`,
      {
        auth: true,
      },
    );

    console.log("Respuesta del convenio:", response);

    // La respuesta del backend usa el formato success_response
    if (response && response.success && response.data) {
      convenio.value = response.data;

      // Cargar datos en el formulario
      form.nit = String(convenio.value.nit || "");
      form.razon_social = String(convenio.value.razon_social || "");
      form.representante_documento = String(
        convenio.value.representante_documento || "",
      );
      form.representante_nombre = String(
        convenio.value.representante_nombre || "",
      );
      form.telefono = String(convenio.value.telefono || "");
      form.correo = String(convenio.value.correo || "");
      form.fecha_vencimiento = convenio.value.fecha_vencimiento
        ? new Date(convenio.value.fecha_vencimiento)
            .toISOString()
            .split("T")[0] || ""
        : "";
      form.estado = (convenio.value.estado === "Activo" || convenio.value.estado === "Inactivo")
        ? convenio.value.estado as "Activo" | "Inactivo"
        : "Activo";
    } else {
      throw new Error("Estructura de respuesta inválida");
    }
  } catch (err: any) {
    console.error("Error al cargar convenio:", err);
    error.value = err.message || "Error al cargar la información del convenio";
  } finally {
    loading.value = false;
  }
};

// Validación del formulario
const validateForm = (): boolean => {
  errors.value = {};

  if (typeof form.nit !== "string" || !form.nit.trim()) {
    errors.value.nit = "El NIT es requerido";
  } else if (!/^\d{9,12}-?\d?$/.test(form.nit.replace(/\s/g, ""))) {
    errors.value.nit = "El NIT no tiene un formato válido";
  }

  if (typeof form.razon_social !== "string" || !form.razon_social.trim()) {
    errors.value.razon_social = "La razón social es requerida";
  }

  if (
    typeof form.representante_documento !== "string" ||
    !form.representante_documento.trim()
  ) {
    errors.value.representante_documento =
      "El documento del representante es requerido";
  }

  if (
    typeof form.representante_nombre !== "string" ||
    !form.representante_nombre.trim()
  ) {
    errors.value.representante_nombre =
      "El nombre del representante es requerido";
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
    const api = useApi();
    const response = await api.putJson(
      `/api/admin/convenios/${route.params.id}`,
      {
        nit: form.nit.replace(/\s/g, ""),
        razon_social: form.razon_social.trim(),
        representante_documento: form.representante_documento.trim(),
        representante_nombre: form.representante_nombre.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        fecha_vencimiento: form.fecha_vencimiento || "",
        estado: form.estado,
      },
      { auth: true },
    );

    if (response) {
      // Redirigir a la página de detalles
      router.push(`/admin/convenios/show/${route.params.id}`);
    }
  } catch (err: any) {
    console.error("Error al actualizar convenio:", err);

    // Manejar errores de validación del backend
    if (err.response?.data?.errors) {
      errors.value = err.response.data.errors;
    } else {
      errors.value.general = err.message || "Error al actualizar el convenio";
    }
  } finally {
    loading.value = false;
  }
};

// Volver a la página anterior
const goBack = () => {
  router.push("/admin/convenios");
};

// Lifecycle
onMounted(() => {
  cargarConvenio();
});
</script>
