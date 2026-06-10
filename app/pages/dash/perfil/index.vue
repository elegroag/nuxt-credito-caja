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
            {{ perfil.full_name || "Mi perfil" }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ perfil.email }}
          </p>
        </div>
        <UBadge
          v-if="loading"
          color="neutral"
          variant="subtle"
          icon="i-lucide-loader-circle"
          label="Cargando…"
        />
        <UBadge
          v-else
          color="primary"
          variant="subtle"
          icon="i-lucide-user"
          label="Perfil"
        />
      </div>
      <UButton
        color="primary"
        icon="i-lucide-pencil"
        to="/dash/perfil/edit"
      >
        Editar perfil
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

    <UPageCard
      title="Información personal"
      description="Datos de tu cuenta. Algunos campos se completan automáticamente."
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
          <UFormField label="Usuario">
            <UInput
              v-model="perfil.username"
              readonly
              icon="i-lucide-user"
              color="neutral"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Tipo de documento">
            <UInput
              :model-value="tipoDocumentoLabel"
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
              readonly
              icon="i-lucide-user"
              color="neutral"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Apellidos">
            <UInput
              v-model="perfil.apellidos"
              readonly
              icon="i-lucide-user"
              color="neutral"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nombre completo" class="sm:col-span-2">
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
              readonly
              icon="i-lucide-mail"
              color="neutral"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

            <UFormField label="Teléfono">
              <UInput
                v-model="perfil.phone"
                type="tel"
                readonly
                icon="i-lucide-phone"
                color="neutral"
                variant="subtle"
                class="w-full"
              />
            </UFormField>
          </div>
        </template>
      </UPageCard>
  </div>
</template>

<script setup lang="ts">
import { usePerfil } from "~/composables/perfil/usePerfil";
import { useParametrosDetalles } from "~/composables/useParametrosDetalles";

const {
  perfil,
  loading,
  success,
  error
} = usePerfil();

const { buscarTipoIdentificacion } = useParametrosDetalles();

const iniciales = computed(() => {
  const n = perfil.value?.nombres?.[0] ?? "";
  const a = perfil.value?.apellidos?.[0] ?? "";
  return `${n}${a}`.toUpperCase() || "U";
});

// Muestra la descripción legible del código que la API expone.
// Si no hay match, cae al código crudo para que el usuario no vea "-".
const tipoDocumentoLabel = computed(() => {
  const code = perfil.value?.tipo_documento || "";
  if (!code) return "-";
  const label = buscarTipoIdentificacion(code);
  return label === code ? code : label;
});

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});
</script>