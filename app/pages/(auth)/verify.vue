<template>
  <div class="w-full max-w-md mx-auto">
    <div class="bg-card rounded-3xl border border-border/50 p-8 sm:p-10">
      <div class="space-y-6">
        <div class="text-center space-y-3">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <UIcon
              name="i-lucide-shield-check"
              class="w-7 h-7"
            />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">
              Verificar identidad
            </h1>
            <p class="text-sm text-muted-foreground mt-2">
              Ingresa el código de {{ pinLength }} dígitos enviado a tu correo.
            </p>
            <p
              v-if="maskedEmail"
              class="text-xs text-muted-foreground mt-1"
            >
              Enviado a {{ maskedEmail }}
            </p>
          </div>
        </div>

        <form
          class="space-y-6"
          @submit.prevent="handleSubmit"
        >
          <div
            v-if="error"
            class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ error }}
          </div>

          <div
            v-if="successMessage"
            class="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
          >
            {{ successMessage }}
          </div>

          <div class="flex justify-center gap-2 sm:gap-3">
            <UInput
              v-for="i in pinLength"
              :key="i"
              :ref="(el) => setDigitRef(el as Element, i - 1)"
              v-model="digits[i - 1]"
              inputmode="numeric"
              maxlength="1"
              size="xl"
              :disabled="loading"
              class="h-14 w-12 sm:w-14 text-center text-lg font-semibold bg-muted/50 rounded-xl border-0 focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              @input="onDigitInput(i - 1)"
              @keydown.backspace="onBackspace(i - 1)"
            />
          </div>

          <div class="flex gap-3">
            <UButton
              type="button"
              color="neutral"
              variant="soft"
              class="flex-1"
              :disabled="loading"
              @click="reset"
            >
              Limpiar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              class="flex-1"
              :loading="loading"
              :disabled="loading || !isComplete"
            >
              <template #leading>
                <UIcon
                  v-if="!loading"
                  name="i-lucide-check"
                  class="w-4 h-4"
                />
              </template>
              {{ loading ? "Validando…" : "Confirmar" }}
            </UButton>
          </div>

          <div class="text-center space-y-2">
            <p class="text-sm text-muted-foreground">
              ¿No recibiste el código?
            </p>
            <button
              type="button"
              class="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              :disabled="loading || resending || countdown > 0"
              @click="handleResend"
            >
              <span v-if="resending">Reenviando…</span>
              <span v-else-if="countdown > 0">
                Reenviar código en {{ countdown }}s
              </span>
              <span v-else>Reenviar código</span>
            </button>
          </div>
        </form>
      </div>

      <div class="mt-8 text-center space-y-3">
        <NuxtLink
          to="/login"
          class="text-sm font-medium text-primary hover:underline"
        >
          Volver al inicio de sesión
        </NuxtLink>
        <div>
          <NuxtLink
            to="/"
            class="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </NuxtLink>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isModalOpen"
      title="Error de verificación"
      :description="error"
      :close="{
        color: 'destructive',
        variant: 'outline',
        class: 'rounded-full'
      }"
    >
      <template #body>
        <div class="text-center">
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-12 h-12 text-red-500 mx-auto mb-4"
          />
          <p class="text-sm text-muted-foreground">
            Verifica el código e intenta nuevamente.
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useVerify } from "~/composables/auth/useVerify";

definePageMeta({
  layout: "auth"
});

useHead({
  title: "Verificar identidad · Comfaca Créditos"
});

const route = useRoute();
const coddoc = route.query.coddoc as string | null;
const documento = route.query.documento as string | null;

const {
  digits,
  loading,
  resending,
  error,
  successMessage,
  countdown,
  maskedEmail,
  pinLength,
  isComplete,
  setDigitRef,
  onDigitInput,
  onBackspace,
  reset,
  initialize,
  verifyCode,
  resendCode
} = useVerify();

const isModalOpen = ref(false);

watch(error, (newVal) => {
  if (newVal) {
    isModalOpen.value = true;
  }
});

initialize(coddoc, documento);

const handleSubmit = async (): Promise<void> => {
  try {
    await verifyCode();
    await navigateTo("/dash");
  } catch {
    // El error ya se maneja en el composable
  }
};

const handleResend = async (): Promise<void> => {
  try {
    await resendCode();
  } catch {
    // El error ya se maneja en el composable
  }
};
</script>
