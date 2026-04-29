<template>
  <div class="mx-auto max-w-5xl p-4 sm:p-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Confirmación de entidad digital
        </h1>
        <p class="text-sm text-zinc-600">
          Revisa y confirma tu información antes de crear la entidad digital
        </p>
      </div>
      <NuxtLink
        to="/"
        class="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Volver
      </NuxtLink>
    </div>

    <!-- Barra de progreso -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2">
          <div class="relative group">
            <div
              class="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-medium cursor-help"
            >
              1
            </div>
            <div
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              Datos básicos
            </div>
          </div>
          <div class="w-16 h-1 bg-emerald-500"></div>
          <div class="relative group">
            <div
              class="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-medium cursor-help"
            >
              2
            </div>
            <div
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              Documentos
            </div>
          </div>
          <div class="w-16 h-1 bg-emerald-500"></div>
          <div class="relative group">
            <div
              class="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-medium cursor-help"
            >
              3
            </div>
            <div
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              Selfie
            </div>
          </div>
          <div class="w-16 h-1 bg-emerald-500"></div>
          <div class="relative group">
            <div
              class="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-medium cursor-help"
            >
              4
            </div>
            <div
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              Confirmación
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen completo -->
    <div class="space-y-6">
      <!-- Datos de identificación -->
      <div class="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <svg
            class="w-5 h-5 mr-2 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            ></path>
          </svg>
          Datos de identificación
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-zinc-50 p-4 rounded-lg">
            <div class="text-sm text-zinc-600 mb-1">Tipo de identificación</div>
            <div class="font-medium">
              {{ verificationData?.tipoIdentificacion || "CC" }}
            </div>
          </div>
          <div class="bg-zinc-50 p-4 rounded-lg">
            <div class="text-sm text-zinc-600 mb-1">
              Número de identificación
            </div>
            <div class="font-medium">
              {{ verificationData?.numeroIdentificacion || "No disponible" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Claves de seguridad -->
      <div class="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <svg
            class="w-5 h-5 mr-2 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            ></path>
          </svg>
          Clave de seguridad
        </h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-zinc-900"
              >Clave segura</label
            >
            <UInput
              v-model="claveLocal"
              type="password"
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Mínimo 10 caracteres"
            />
            <p class="mt-1 text-xs text-zinc-600">
              Esta clave se usa para cifrar la llave privada (PEM). No se
              almacena en el servidor.
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-zinc-900"
              >Confirmar clave</label
            >
            <UInput
              v-model="claveConfirmLocal"
              type="password"
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Repite tu clave"
            />
          </div>
          <div class="flex items-center">
            <label
              class="flex items-center gap-2 text-sm text-zinc-900 cursor-pointer"
            >
              <UInput
                v-model="overwriteLocal"
                type="checkbox"
                class="h-4 w-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500"
              />
              Reemplazar entidad digital si ya existe
            </label>
          </div>
        </div>
      </div>

      <!-- Términos y condiciones -->
      <div class="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 class="text-lg font-semibold mb-4">Términos y condiciones</h2>
        <div class="space-y-3">
          <label class="flex items-start space-x-3 cursor-pointer">
            <UInput
              v-model="termsAccepted"
              type="checkbox"
              class="mt-1 h-4 w-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500"
            />
            <span class="text-sm text-zinc-700">
              Acepto los
              <a
                href="#"
                class="text-emerald-600 hover:text-emerald-700 underline"
                >términos y condiciones</a
              >
              para la creación de mi entidad digital
            </span>
          </label>
          <label class="flex items-start space-x-3 cursor-pointer">
            <UInput
              v-model="privacyAccepted"
              type="checkbox"
              class="mt-1 h-4 w-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500"
            />
            <span class="text-sm text-zinc-700">
              Autorizo el tratamiento de mis datos personales según la
              <a
                href="#"
                class="text-emerald-600 hover:text-emerald-700 underline"
                >política de privacidad</a
              >
            </span>
          </label>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="rounded-md border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
          @click="goBack"
          :disabled="loading"
        >
          <svg
            class="w-4 h-4 inline mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Atrás
        </button>

        <div class="flex items-center space-x-4">
          <button
            type="button"
            class="rounded-md border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
            @click="cancelProcess"
            :disabled="loading"
          >
            Cancelar proceso
          </button>

          <button
            type="button"
            class="rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            :disabled="!canConfirm || loading"
            @click="confirmAndCreate"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{
              loading
                ? "Creando entidad..."
                : "Confirmar y crear entidad digital"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mensajes de error y éxito -->
    <div
      v-if="errorMsg"
      class="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <div class="flex">
        <svg
          class="w-5 h-5 mr-2 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <span>{{ errorMsg }}</span>
      </div>
    </div>

    <div
      v-if="successMsg"
      class="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
    >
      <div class="flex">
        <svg
          class="w-5 h-5 mr-2 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <span>{{ successMsg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEntidadDigitalConfirmation } from "~/composables/entidad/useEntidadDigitalConfirmation";

const {
  claveLocal,
  claveConfirmLocal,
  overwriteLocal,
  verificationData,
  termsAccepted,
  privacyAccepted,
  successMsg,
  loading,
  errorMsg,
  canConfirm,
  goBack,
  cancelProcess,
  confirmAndCreate,
} = useEntidadDigitalConfirmation();

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});
</script>
