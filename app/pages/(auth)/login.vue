<template>
  <div class="w-full max-w-md mx-auto">
    <div class="bg-card rounded-3xl border border-border/50 p-8 sm:p-10">
      <!-- Form -->
      <form @submit.prevent="login" class="space-y-5">
        <!-- Username -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground p-2">Usuario</label>
          <div class="relative">
            <UIcon
              name="i-lucide-user"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <UInput
              v-model="username"
              type="text"
              size="xl"
              placeholder="Tu nombre de usuario"
              class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              :class="{ 'ring-2 ring-red-500/20': errorMsg }"
              required
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground p-2"
            >Contraseña</label
          >
          <div class="relative">
            <UIcon
              name="i-lucide-lock"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <UInput
              v-model="password"
              type="password"
              size="xl"
              placeholder="••••••••"
              class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              :class="{ 'ring-2 ring-red-500/20': errorMsg }"
              required
            />
          </div>
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
              name="i-lucide-arrow-right"
              class="w-4 h-4"
            />
          </template>
          {{ loading ? "Ingresando..." : "Ingresar" }}
        </UButton>
      </form>

      <!-- Links -->
      <div class="mt-8 text-center space-y-3">
        <p class="text-sm text-muted-foreground">
          ¿No tienes cuenta?
          <NuxtLink
            to="/registro"
            class="font-medium text-primary hover:underline"
          >
            Crear cuenta
          </NuxtLink>
        </p>
        <NuxtLink
          to="/"
          class="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          ← Volver al inicio
        </NuxtLink>
      </div>
    </div>

    <!-- Connection Status -->
    <div
      :class="
        cn(
          'mt-4 px-4 py-2 text-xs rounded-full flex items-center justify-center gap-1.5',
          connectionStatusClass,
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
    <UModal
      v-model:open="isModalOpen"
      title="Error de inicio de sesión"
      :description="errorMsg"
      :close="{
        color: 'destructive',
        variant: 'outline',
        class: 'rounded-full',
      }"
    >
      <template #body>
        <div class="text-center">
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-12 h-12 text-red-500 mx-auto mb-4"
          />
          <p class="text-sm text-muted-foreground">
            Por favor, verifica tus credenciales e intenta nuevamente.
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "#imports";
import { useLogin } from "~/composables/auth/useLogin";
import { useHealthCheck } from "~/composables/useHealthCheck";
import { cn } from "@/lib/utils";

definePageMeta({
  layout: "auth",
});

const { username, password, loading, errorMsg, login, checkAuthAndRedirect } =
  useLogin();
const {
  isConnected,
  checkingConnection,
  connectionMessage,
  connectionStatusClass,
  checkConnection,
} = useHealthCheck();

const isModalOpen = ref(false);

watch(errorMsg, (newVal) => {
  if (newVal) {
    isModalOpen.value = true;
  }
});

onMounted(async () => {
  await checkConnection();
  await checkAuthAndRedirect();
});
</script>
