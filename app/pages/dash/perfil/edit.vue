<template>
  <div class="mx-auto max-w-3xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UAvatar
          :text="iniciales"
          size="xl"
          color="primary"
          variant="soft"
        />
        <div>
          <h1 class="text-xl font-semibold text-foreground">
            Editar perfil
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ perfil.full_name || "Mi perfil" }}
          </p>
        </div>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        to="/dash/perfil"
      >
        Volver al perfil
      </UButton>
    </div>

    <UAlert
      v-if="success"
      color="primary"
      variant="subtle"
      icon="i-lucide-circle-check"
      title="Perfil actualizado correctamente"
    />
    <UAlert
      v-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="error"
    />

    <form class="space-y-6" @submit.prevent="guardarPerfil">
      <UPageCard
        title="Información personal"
        description="Actualiza tus datos personales. Los campos marcados no son editables."
        :ui="{ container: 'sm:p-6' }"
        :class="loading ? 'opacity-60 pointer-events-none' : ''"
      >
        <template v-if="loading">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-pulse">
            <div v-for="i in 4" :key="i" class="h-10 rounded-lg bg-muted" />
            <div class="h-10 rounded-lg bg-muted sm:col-span-2" />
            <div class="h-10 rounded-lg bg-muted" />
            <div class="h-10 rounded-lg bg-muted" />
          </div>
        </template>
        <template v-else>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField
              label="Usuario"
              hint="No modificable"
            >
              <UInput
                v-model="perfil.username"
                readonly
                icon="i-lucide-user"
                color="neutral"
                variant="subtle"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Tipo de documento"
              hint="No modificable"
            >
              <UInput
                v-model="perfil.tipo_documento"
                readonly
                icon="i-lucide-id-card"
                color="neutral"
                variant="subtle"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Nombres">
              <UInput
                v-model="perfil.nombres"
                placeholder="Ingresa tus nombres"
                :disabled="guardando"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Apellidos">
              <UInput
                v-model="perfil.apellidos"
                placeholder="Ingresa tus apellidos"
                :disabled="guardando"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Nombre completo"
              hint="Se genera automáticamente"
              class="sm:col-span-2"
            >
              <UInput
                v-model="perfil.full_name"
                readonly
                icon="i-lucide-user-check"
                color="neutral"
                variant="subtle"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Correo electrónico">
              <UInput
                v-model="perfil.email"
                type="email"
                placeholder="correo@ejemplo.com"
                icon="i-lucide-mail"
                :disabled="guardando"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Teléfono">
              <UInput
                v-model="perfil.phone"
                type="tel"
                placeholder="3157145942"
                icon="i-lucide-phone"
                :disabled="guardando"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
      </UPageCard>

      <UPageCard
        title="Cambiar contraseña"
        description="Deja los campos vacíos si no deseas cambiar tu contraseña. Mínimo 8 caracteres con mayúsculas, minúsculas y números."
        :ui="{ container: 'sm:p-6' }"
        :class="loading ? 'opacity-60 pointer-events-none' : ''"
      >
        <div class="grid grid-cols-1 gap-4 sm:max-w-sm">
          <UFormField label="Contraseña actual">
            <UInput
              v-model="passwordData.password_actual"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              :disabled="guardando"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nueva contraseña">
            <UInput
              v-model="passwordData.nueva_password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock-keyhole"
              :disabled="guardando"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Confirmar nueva contraseña">
            <UInput
              v-model="passwordData.confirmar_password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-shield-check"
              :disabled="guardando"
              class="w-full"
            />
          </UFormField>
        </div>
      </UPageCard>

      <div class="flex justify-end gap-3">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          icon="i-lucide-x"
          :disabled="guardando"
          @click="cancelarCambios"
        >
          Cancelar
        </UButton>
        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-save"
          :loading="guardando"
          :disabled="guardando || loading"
        >
          Guardar cambios
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { usePerfil } from "~/composables/perfil/usePerfil";

const {
  perfil,
  passwordData,
  loading,
  guardando,
  error,
  success,
  guardarPerfil,
  recargarPerfil,
  resetPasswordForm
} = usePerfil();

const iniciales = computed(() => {
  const n = perfil.value?.nombres?.[0] ?? "";
  const a = perfil.value?.apellidos?.[0] ?? "";
  return `${n}${a}`.toUpperCase() || "U";
});

const cancelarCambios = async () => {
  resetPasswordForm();
  await recargarPerfil();
};

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

onMounted(() => {
  recargarPerfil();
});
</script>