<template>
  <div class="w-full max-w-xl mx-auto">
    <div class="bg-card rounded-3xl border border-border/50 p-8 sm:p-10">
      <!-- Stepper -->
      <div class="relative flex justify-between items-center mb-8 px-4">
        <div class="absolute left-0 top-1/2 -z-10 h-0.5 w-full bg-muted" />
        <div
          class="absolute left-0 top-1/2 -z-10 h-0.5 bg-primary transition-all duration-300"
          :style="{ width: ((pasoActual - 1) / 2) * 100 + '%' }"
        />
        <div
          v-for="i in 3"
          :key="i"
          :class="
            cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
              pasoActual >= i
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-card text-muted-foreground'
            )
          "
        >
          <UIcon
            v-if="pasoActual > i"
            name="i-lucide-check"
            class="w-5 h-5"
          />
          <span v-else>{{ i }}</span>
        </div>
      </div>

      <!-- Step Labels -->
      <div class="flex justify-between text-xs text-muted-foreground mb-6 px-2">
        <span :class="{ 'text-primary font-medium': pasoActual === 1 }">Datos</span>
        <span :class="{ 'text-primary font-medium': pasoActual === 2 }">Contacto</span>
        <span :class="{ 'text-primary font-medium': pasoActual === 3 }">Seguridad</span>
      </div>

      <!-- Form -->
      <form
        class="space-y-5"
        @submit.prevent="handleSubmit"
      >
        <!-- Step 1: Personal Info -->
        <div
          v-if="pasoActual === 1"
          class="space-y-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground p-2">Documento</label>
              <USelectMenu
                v-model="formData.tipo_documento"
                :items="tiposDocumento"
                value-key="value"
                label-key="label"
                placeholder="Selecciona el tipo"
                :search-input="false"
                :ui="{
                  base: 'pl-5 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all',
                  trailing: 'pe-3'
                }"
                required
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground p-2">Identificación</label>
              <input
                v-model="formData.numero_documento"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="16"
                placeholder="123456789"
                required
                class="w-full pl-5 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                @input="formData.numero_documento = (($event.target as HTMLInputElement).value.replace(/\D/g, ''))"
              >
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground p-2">Nombres</label>
              <input
                v-model="formData.nombres"
                type="text"
                placeholder="Juan"
                required
                class="w-full pl-5 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              >
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground p-2">Apellidos</label>
              <input
                v-model="formData.apellidos"
                type="text"
                placeholder="Pérez"
                required
                class="w-full pl-5 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              >
            </div>
          </div>
        </div>

        <!-- Step 2: Contact -->
        <div
          v-if="pasoActual === 2"
          class="space-y-4"
        >
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Email</label>
            <div class="relative">
              <UIcon
                name="i-lucide-mail"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              />
              <input
                v-model="formData.email"
                type="email"
                placeholder="tu@email.com"
                required
                class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              >
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Teléfono</label>
            <div class="relative">
              <UIcon
                name="i-lucide-phone"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              />
              <input
                v-model="formData.telefono"
                type="tel"
                inputmode="numeric"
                maxlength="10"
                placeholder="3001234567"
                required
                class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                @input="formData.telefono = (($event.target as HTMLInputElement).value.replace(/\D/g, ''))"
              >
            </div>
          </div>
        </div>

        <!-- Step 3: Security -->
        <div
          v-if="pasoActual === 3"
          class="space-y-4"
        >
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Usuario</label>
            <div class="relative">
              <UIcon
                name="i-lucide-user"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <input
                v-model="formData.username"
                type="text"
                placeholder="Tu usuario"
                required
                class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              >
            </div>
            <p class="text-xs text-muted-foreground">
              Este será tu nombre de usuario para iniciar sesión
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground p-2">Contraseña</label>
              <div class="relative">
                <input
                  v-model="formData.password"
                  :type="mostrarPassword ? 'text' : 'password'"
                  placeholder="Mín. 8 caracteres"
                  required
                  minlength="8"
                  class="w-full pl-5 pr-11 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                >
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  :aria-label="mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="mostrarPassword = !mostrarPassword"
                >
                  <UIcon
                    :name="mostrarPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    class="w-4 h-4"
                  />
                </button>
              </div>
              <button
                type="button"
                class="text-xs text-primary hover:underline inline-flex items-center gap-1"
                @click="sugerirPassword"
              >
                <UIcon
                  name="i-lucide-wand"
                  class="w-3.5 h-3.5"
                />
                Sugerir contraseña segura
              </button>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground p-2">Confirmar</label>
              <div class="relative">
                <input
                  v-model="formData.confirmar_password"
                  :type="mostrarConfirmar ? 'text' : 'password'"
                  placeholder="Repite"
                  required
                  minlength="8"
                  class="w-full pl-5 pr-11 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                >
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  :aria-label="mostrarConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="mostrarConfirmar = !mostrarConfirmar"
                >
                  <UIcon
                    :name="mostrarConfirmar ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    class="w-4 h-4"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex gap-3 pt-2">
          <UButton
            v-if="pasoActual > 1"
            type="button"
            color="neutral"
            variant="soft"
            class="flex-1"
            @click="pasoAnterior"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="w-4 h-4 mr-2"
            />
            Atrás
          </UButton>

          <UButton
            v-if="pasoActual < 3"
            type="button"
            color="primary"
            class="flex-1"
            :disabled="
              (pasoActual === 1 && !validarPaso1)
                || (pasoActual === 2 && !validarPaso2)
            "
            @click="pasoSiguiente"
          >
            Siguiente
            <UIcon
              name="i-lucide-arrow-right"
              class="w-4 h-4 ml-2"
            />
          </UButton>

          <UButton
            v-else
            type="submit"
            color="primary"
            class="flex-1"
            :loading="loading"
            :disabled="!validarPaso3"
          >
            <template #leading>
              <UIcon
                v-if="!loading"
                name="i-lucide-check"
                class="w-4 h-4"
              />
            </template>
            {{ loading ? "Creando..." : "Crear cuenta" }}
          </UButton>
        </div>
      </form>

      <!-- Links -->
      <div class="mt-8 text-center space-y-3">
        <p class="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?
          <NuxtLink
            to="/login"
            class="font-medium text-primary hover:underline"
          >
            Inicia sesión
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

    <UModal
      v-model:open="isModalOpen"
      title="Error en el registro"
      :description="errorMsg"
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
            Por favor, verifica la información e intenta nuevamente.
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRegistro } from "~/composables/auth/useRegistro";
import { cn } from "@/lib/utils";

definePageMeta({
  layout: "auth"
});

const {
  formData,
  loading,
  errorMsg,
  pasoActual,
  tiposDocumento,
  validarPaso1,
  validarPaso2,
  validarPaso3,
  pasoSiguiente,
  pasoAnterior,
  registrar
} = useRegistro();

const isModalOpen = ref(false);
const mostrarPassword = ref(false);
const mostrarConfirmar = ref(false);

watch(errorMsg, (newVal) => {
  if (newVal) {
    isModalOpen.value = true;
  }
});

const generarPasswordSegura = (longitud = 14): string => {
  const mayusculas = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const minusculas = "abcdefghjkmnpqrstuvwxyz";
  const numeros = "23456789";
  const simbolos = "!@#$%&*?+-";
  const todos = mayusculas + minusculas + numeros + simbolos;

  const aleatorio = (charset: string): string =>
    charset.charAt(Math.floor(Math.random() * charset.length));

  const semilla: string[] = [
    aleatorio(mayusculas),
    aleatorio(minusculas),
    aleatorio(numeros),
    aleatorio(simbolos)
  ];

  for (let i = semilla.length; i < longitud; i++) {
    semilla.push(aleatorio(todos));
  }

  for (let i = semilla.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [semilla[i], semilla[j]] = [semilla[j]!, semilla[i]!];
  }

  return semilla.join("");
};

const sugerirPassword = () => {
  const nueva = generarPasswordSegura(14);
  formData.value.password = nueva;
  formData.value.confirmar_password = nueva;
  mostrarPassword.value = true;
  mostrarConfirmar.value = true;
};

const handleSubmit = async () => {
  if (pasoActual.value === 3) {
    await registrar();
  }
};
</script>
