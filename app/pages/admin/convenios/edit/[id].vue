<template>
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <UButton variant="outline" @click="goBack()">
          <ChevronLeftIcon class="w-4 h-4 mr-2" />
          Volver
        </UButton>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Editar Convenio</h1>
          <p class="text-sm text-gray-500">
            Modifique la información del convenio empresarial
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <ArrowPathIcon class="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <p class="text-gray-500">Cargando información del convenio...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16"
    >
      <NoSymbolIcon class="w-10 h-10 text-red-500 mb-4" />
      <p class="text-red-600 mb-4">{{ error }}</p>
      <UButton variant="outline" @click="cargarConvenio">Reintentar</UButton>
    </div>

    <!-- Formulario -->
    <div
      v-else-if="convenio"
      class="bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Información de la Empresa -->
        <div class="border-b border-gray-200 pb-6">
          <h2
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <BuildingOfficeIcon class="w-5 h-5 text-blue-500" />
            Información de la Empresa
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <IdentificationIcon class="w-4 h-4 text-gray-400" />
                NIT <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.nit"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.nit }"
                placeholder="Ej: 123456789-0"
              />
              <p v-if="errors.nit" class="mt-1 text-sm text-red-600">
                {{ errors.nit }}
              </p>
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <BuildingOfficeIcon class="w-4 h-4 text-gray-400" />
                Razón Social <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.razon_social"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.razon_social }"
                placeholder="Nombre completo de la empresa"
              />
              <p v-if="errors.razon_social" class="mt-1 text-sm text-red-600">
                {{ errors.razon_social }}
              </p>
            </div>
          </div>
        </div>

        <!-- Información del Representante -->
        <div class="border-b border-gray-200 pb-6">
          <h2
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <UserCircleIcon class="w-5 h-5 text-blue-500" />
            Información del Representante
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <IdentificationIcon class="w-4 h-4 text-gray-400" />
                Documento Representante <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.representante_documento"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.representante_documento }"
                placeholder="Cédula o documento de identidad"
              />
              <p
                v-if="errors.representante_documento"
                class="mt-1 text-sm text-red-600"
              >
                {{ errors.representante_documento }}
              </p>
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <UserCircleIcon class="w-4 h-4 text-gray-400" />
                Nombre Representante <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.representante_nombre"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.representante_nombre }"
                placeholder="Nombre completo del representante legal"
              />
              <p
                v-if="errors.representante_nombre"
                class="mt-1 text-sm text-red-600"
              >
                {{ errors.representante_nombre }}
              </p>
            </div>
          </div>
        </div>

        <!-- Información de Contacto -->
        <div class="border-b border-gray-200 pb-6">
          <h2
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <PhoneIcon class="w-5 h-5 text-blue-500" />
            Información de Contacto
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <PhoneIcon class="w-4 h-4 text-gray-400" />
                Teléfono
              </label>
              <UInput
                v-model="form.telefono"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.telefono }"
                placeholder="Ej: 3001234567"
              />
              <p v-if="errors.telefono" class="mt-1 text-sm text-red-600">
                {{ errors.telefono }}
              </p>
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <EnvelopeIcon class="w-4 h-4 text-gray-400" />
                Correo Electrónico
              </label>
              <UInput
                v-model="form.correo"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.correo }"
                placeholder="correo@empresa.com"
              />
              <p v-if="errors.correo" class="mt-1 text-sm text-red-600">
                {{ errors.correo }}
              </p>
            </div>
          </div>
        </div>

        <!-- Fechas y Estado -->
        <div>
          <h2
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <CalendarIcon class="w-5 h-5 text-blue-500" />
            Fechas y Estado
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <CalendarIcon class="w-4 h-4 text-gray-400" />
                Fecha de Vencimiento
              </label>
              <UInput
                v-model="form.fecha_vencimiento"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.fecha_vencimiento }"
              />
              <p
                v-if="errors.fecha_vencimiento"
                class="mt-1 text-sm text-red-600"
              >
                {{ errors.fecha_vencimiento }}
              </p>
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
              >
                <CheckIcon class="w-4 h-4 text-gray-400" />
                Estado
              </label>
              <select
                v-model="form.estado"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.estado }"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <p v-if="errors.estado" class="mt-1 text-sm text-red-600">
                {{ errors.estado }}
              </p>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div
          class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200"
        >
          <UButton
            type="button"
            variant="outline"
            @click="goBack()"
            :disabled="loading"
          >
            Cancelar
          </UButton>
          <UButton type="submit" :disabled="loading" class="min-w-[120px]">
            <ArrowPathIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            {{ loading ? "Guardando..." : "Actualizar Convenio" }}
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";

import {
  ChevronLeftIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckIcon,
  ArrowPathIcon,
  NoSymbolIcon,
} from "@heroicons/vue/24/outline";

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
  estado: "Activo",
});

// Cargar datos del convenio
const cargarConvenio = async () => {
  loading.value = true;
  error.value = null;

  try {
    const api = useApi();
    const response = await api.getJson<any>(
      `/api/admin/empresas-convenios/${route.params.id}`,
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
      form.estado = String(convenio.value.estado || "Activo");
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
      `/api/admin/empresas-convenios/${route.params.id}`,
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
