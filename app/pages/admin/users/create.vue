<script setup lang="ts">
import { useCreateUser } from "~/composables/admin/useCreateUser";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const { loading, errors, form, handleSubmit, goBack } = useCreateUser();

const opcionesRoles = [
  { label: "Administrador", value: "administrator" },
  { label: "Asesor", value: "adviser" },
  { label: "Trabajador", value: "user_trabajador" },
];

const opcionesEstado = [
  { label: "Activo", value: false },
  { label: "Inactivo", value: true },
];

const opcionesTipoDoc = [
  { label: "Cédula de Ciudadanía", value: "CC" },
  { label: "Cédula de Extranjería", value: "CE" },
  { label: "Tarjeta de Identidad", value: "TI" },
  { label: "Pasaporte", value: "PA" },
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
          Crear Nuevo Usuario
        </h1>
        <p class="text-sm text-muted-foreground">
          Complete el formulario para registrar un nuevo usuario en el sistema
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

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Información Básica -->
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
          </UFormField>

          <UFormField label="Email" required :error="errors.email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="correo@ejemplo.com"
              icon="i-lucide-mail"
              :color="errors.email ? 'destructive' : undefined"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Contraseña" required :error="errors.password">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              icon="i-lucide-lock"
              :color="errors.password ? 'destructive' : undefined"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Confirmar Contraseña"
            required
            :error="errors.confirmPassword"
          >
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Repita la contraseña"
              icon="i-lucide-lock-keyhole"
              :color="errors.confirmPassword ? 'destructive' : undefined"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Roles" required :error="errors.roles">
            <USelectMenu
              v-model="form.roles"
              :items="opcionesRoles"
              value-key="value"
              label-key="label"
              multiple
              placeholder="Seleccione roles..."
              class="w-full"
            />
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

      <!-- Datos Personales -->
      <UPageCard
        title="Datos Personales"
        description="Información de identificación del usuario."
        :ui="{ container: 'sm:p-6' }"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Nombres" required :error="errors.nombre">
            <UInput
              v-model="form.nombre"
              placeholder="Nombres del usuario"
              icon="i-lucide-user"
              :color="errors.nombre ? 'destructive' : undefined"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Apellidos" required :error="errors.apellido">
            <UInput
              v-model="form.apellido"
              placeholder="Apellidos del usuario"
              icon="i-lucide-user"
              :color="errors.apellido ? 'destructive' : undefined"
              class="w-full"
            />
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
          icon="i-lucide-user-plus"
          :loading="loading"
          :disabled="loading"
        >
          Crear Usuario
        </UButton>
      </div>
    </form>
  </div>
</template>
