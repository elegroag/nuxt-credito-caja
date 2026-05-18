<template>
  <div class="bg-white shadow-xl rounded-2xl p-6 lg:p-8">
    <div class="space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight">
          Verificar identidad
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Ingresa el código de 6 dígitos enviado a tu correo.
        </p>
      </div>

      <form
        class="space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div
          v-if="error"
          class="rounded-lg border border-red-500/50 bg-red-50 p-3 text-sm text-red-600"
        >
          {{ error }}
        </div>

        <div class="flex justify-center gap-2">
          <UInput
            v-for="i in 6"
            :key="i"
            :ref="(el) => setDigitRef(el as Element, i - 1)"
            v-model="digits[i - 1]"
            inputmode="numeric"
            maxlength="1"
            class="flex h-12 w-12 rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading"
            @input="onDigitInput(i - 1)"
            @keydown.backspace="onBackspace(i - 1)"
          />
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading"
            @click="reset"
          >
            Limpiar
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading || !isComplete"
          >
            {{ loading ? "Validando…" : "Confirmar" }}
          </button>
        </div>

        <div class="text-center text-sm">
          <NuxtLink
            to="/auth/login"
            class="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4"
          >
            Volver al inicio de sesión
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVerify } from "~/composables/auth/useVerify";

definePageMeta({
  layout: "auth"
});

// Obtener parámetros de la URL
const route = useRoute();
const coddoc = route.query.coddoc as string | null;
const documento = route.query.documento as string | null;

// Usar el composable
const {
  digits,
  loading,
  error,
  isComplete,
  code: _code,
  setDigitRef,
  onDigitInput,
  onBackspace,
  reset,
  initialize,
  verifyCode
} = useVerify();

// Inicializar el composable con los parámetros de URL
initialize(coddoc, documento);

const handleSubmit = async (): Promise<void> => {
  try {
    await verifyCode();
    // Redirigir al dashboard o página principal
    await navigateTo("/dash");
  } catch (err) {
    // El error ya se maneja en el composable
    console.error("Error en verificación:", err);
  }
};
</script>
