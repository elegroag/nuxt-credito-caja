<template>
  <div class="w-full max-w-md mx-auto">
    <div class="bg-card rounded-3xl border border-border/50 p-8 sm:p-10">
      <!-- Form -->
      <form
        class="space-y-5"
        @submit.prevent="handleLogin"
      >
        <!-- Username -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Número de Usuario SISU</label>
          <div class="relative">
            <UIcon
              name="i-lucide-hash"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <input
              v-model="username"
              type="number"
              placeholder="Ej: 12345"
              class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              :class="{ 'ring-2 ring-red-500/20': errorMsg }"
              :disabled="loading"
            >
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Contraseña</label>
          <div class="relative">
            <UIcon
              name="i-lucide-lock"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              :class="{ 'ring-2 ring-red-500/20': errorMsg }"
              :disabled="loading"
            >
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="errorMsg"
          class="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-circle-alert"
            class="w-4 h-4"
          />
          {{ errorMsg }}
        </div>

        <!-- Submit -->
        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full"
          :loading="loading"
          :disabled="!isConnected"
        >
          <template #leading>
            <UIcon
              v-if="!loading"
              name="i-lucide-log-in"
              class="w-4 h-4"
            />
          </template>
          {{ loading ? "Iniciando..." : "Iniciar sesión" }}
        </UButton>
      </form>

      <!-- Help -->
      <div class="mt-8 text-center">
        <a
          href="https://www.comfaca.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          ¿Necesitas ayuda? →
        </a>
      </div>
    </div>

    <!-- Connection Status -->
    <div
      :class="
        cn(
          'mt-4 px-4 py-2 text-xs rounded-full flex items-center justify-center gap-1.5',
          connectionStatusClass
        )
      "
    >
      <UIcon
        :name="
          checkingConnection
            ? 'i-lucide-loader-2'
            : isConnected
              ? 'i-lucide-check-circle'
              : 'i-lucide-alert-triangle'
        "
        class="w-3.5 h-3.5"
        :class="{ 'animate-spin': checkingConnection }"
      />
      <span>{{ connectionMessage }}</span>
    </div>

    <!-- Modal -->
    <SelectPuntoAsesoriaModal
      :is-open="showPuntosModal"
      :puntos-asesoria="puntosAsesoria"
      :loading="loading"
      @close="cancelPuntoSelection"
      @select="selectPuntoAsesoria"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "#imports";
import { useAdviser } from "~/composables/auth/useAdviser";
import { useHealthCheck } from "~/composables/useHealthCheck";
import { cn } from "@/lib/utils";

import SelectPuntoAsesoriaModal from "@/components/shared/SelectPuntoAsesoriaModal.vue";

definePageMeta({
  layout: "auth"
});

const {
  username,
  password,
  loading,
  errorMsg,
  login,
  checkAuthAndRedirect,
  validateForm,
  showPuntosModal,
  puntosAsesoria,
  selectPuntoAsesoria,
  cancelPuntoSelection
} = useAdviser();

const {
  isConnected,
  checkingConnection,
  connectionMessage,
  connectionStatusClass,
  checkConnection
} = useHealthCheck();

const handleLogin = async () => {
  if (!validateForm()) {
    return;
  }
  await login();
};

onMounted(async () => {
  await checkConnection();
  await checkAuthAndRedirect();
});
</script>
