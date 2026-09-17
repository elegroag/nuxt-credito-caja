<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useEditUser } from "~/composables/admin/useEditUser";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  loading,
  error,
  usuario,
  errors,
  form,
  cargarUsuario,
  handleSubmit,
  goBack
} = useEditUser();

const api = useApi();
const opcionesRoles = ref<{ label: string, value: string }[]>([]);

onMounted(async () => {
  try {
    const response = await api.getJson<{
      success: boolean
      data?: Array<{ nombre: string, etiqueta?: string | null }>
    }>("/api/admin/roles", { auth: true });
    if (response.success && Array.isArray(response.data)) {
      opcionesRoles.value = response.data.map(r => ({
        label: r.etiqueta || r.nombre,
        value: r.nombre
      }));
    }
  } catch {
    opcionesRoles.value = [];
  }
});

const opcionesEstado = [
  { label: "Activo", value: false },
  { label: "Inactivo", value: true }
];

const opcionesTipoDoc = [
  { label: "Cédula de Ciudadanía", value: "CC" },
  { label: "Cédula de Extranjería", value: "CE" },
  { label: "Tarjeta de Identidad", value: "TI" },
  { label: "Pasaporte", value: "PA" }
];
</script>

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
          Editar Usuario
        </h1>
        <p class="text-sm text-muted-foreground">
          Modificar información del usuario
          {{ usuario?.nombres }} {{ usuario?.apellidos }}
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

    <!-- Loading inicial -->
    <div
      v-if="loading && !usuario"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-10 h-10 animate-spin text-primary mb-4"
      />
      <p class="text-muted-foreground">
        Cargando información del usuario...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && !usuario"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-x-circle"
        class="w-10 h-10 text-destructive mb-4"
      />
      <p class="text-destructive mb-4">
        {{ error }}
      </p>
      <UButton
        variant="outline"
        @click="cargarUsuario"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Formulario -->
    <form
      v-else-if="usuario"
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <UPageCard
        title="Información Básica"
        description="Credenciales de acceso y rol del usuario."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Nombre de Usuario"
            required
            :error="errors.username"
          >
            <UInput
              v-model="form.username"
              placeholder="ej: jperez"
              icon="i-lucide-user"
              :color="errors.username ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.username }}</span>
            </template>
          </UFormField>

          <UFormField
            label="Email"
            required
            :error="errors.email"
          >
            <UInput
              v-model="form.email"
              type="email"
              placeholder="correo@ejemplo.com"
              icon="i-lucide-mail"
              :color="errors.email ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.email }}</span>
            </template>
          </UFormField>

          <UFormField
            label="Nueva Contraseña"
            :error="errors.password"
          >
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Dejar vacío para no cambiar"
              icon="i-lucide-lock"
              :color="errors.password ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.password }}</span>
            </template>
          </UFormField>

          <UFormField
            label="Confirmar Contraseña"
            :error="errors.confirmPassword"
          >
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirmar nueva contraseña"
              icon="i-lucide-lock-keyhole"
              :color="errors.confirmPassword ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.confirmPassword }}</span>
            </template>
          </UFormField>

          <UFormField
            label="Roles"
            required
            :error="errors.roles"
          >
            <USelectMenu
              v-model="form.roles"
              :items="opcionesRoles"
              value-key="value"
              label-key="label"
              multiple
              placeholder="Seleccione roles..."
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.roles }}</span>
            </template>
          </UFormField>

          <UFormField label="Estado">
            <USelect
              v-model="form.disabled"
              :items="opcionesEstado"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>
      </UPageCard>

      <UPageCard
        title="Datos Personales"
        description="Información de identificación del usuario."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            label="Nombres"
            required
            :error="errors.nombre"
          >
            <UInput
              v-model="form.nombre"
              placeholder="Nombres del usuario"
              icon="i-lucide-user"
              :color="errors.nombre ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.nombre }}</span>
            </template>
          </UFormField>

          <UFormField
            label="Apellidos"
            required
            :error="errors.apellido"
          >
            <UInput
              v-model="form.apellido"
              placeholder="Apellidos del usuario"
              icon="i-lucide-user"
              :color="errors.apellido ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.apellido }}</span>
            </template>
          </UFormField>

          <UFormField label="Tipo de Documento">
            <USelect
              v-model="form.tipo_documento"
              :items="opcionesTipoDoc"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Número de Documento"
            :error="errors.numero_documento"
          >
            <UInput
              v-model="form.numero_documento"
              placeholder="Número de documento"
              icon="i-lucide-id-card"
              :color="errors.numero_documento ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.numero_documento }}</span>
            </template>
          </UFormField>

          <UFormField
            label="Teléfono"
            :error="errors.phone"
            class="sm:col-span-2"
          >
            <UInput
              v-model="form.phone"
              type="tel"
              placeholder="Ej: 3001234567"
              icon="i-lucide-phone"
              :color="errors.phone ? 'destructive' : undefined"
              class="w-full"
            />
            <template #error>
              <span class="text-destructive">{{ errors.phone }}</span>
            </template>
          </UFormField>
        </div>
      </UPageCard>

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
          Guardar cambios
        </UButton>
      </div>
    </form>
  </div>
</template>
