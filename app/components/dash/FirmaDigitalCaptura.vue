<template>
  <UModal
    v-model:open="isOpen"
    title="Validación de Firma Digital"
    icon="i-lucide-shield-alert"
    :close="false"
    class="max-w-md"
  >
    <template #body>
      <div class="space-y-6">
        <UAlert color="muted" variant="soft">
          <template #title>Sin Firma Digital</template>
          <template #description>
            No posee firma digital activa. Para continuar, ingrese el código de verificación de 6 dígitos.
          </template>
        </UAlert>

        <div class="space-y-2">
          <p class="text-sm text-muted-foreground text-center">
            Ingrese su código de verificación
          </p>
          <div class="flex justify-center gap-2">
            <UInput
              v-for="(digit, index) in digits"
              :key="index"
              v-model="digits[index]"
              type="text"
              maxlength="1"
              size="lg"
              class="w-12 text-center text-xl font-bold"
              :autofocus="index === 0"
              @input="handleInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
              @paste="handlePaste($event)"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive text-center">
          {{ errorMessage }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" @click="handleCancel">
          Cancelar
        </UButton>
        <UButton
          :disabled="!isComplete || loading"
          :loading="loading"
          color="primary"
          @click="handleValidar"
        >
          Validar y Enviar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps<{
  open: boolean
  loading?: boolean
  errorMessage?: string | null
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "validar", codigo: string): void
  (e: "cancel"): void
}>();

const digits = ref(["", "", "", "", "", ""]);

const isComplete = computed(() => {
  return digits.value.every(d => d.length === 1 && /^\d$/.test(d));
});

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value)
});

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value.replace(/\D/g, "").slice(-1);
  digits.value[index] = value;

  if (value && index < 5) {
    const nextInput = target.closest(".flex")?.querySelectorAll("input")[index + 1] as HTMLInputElement | undefined;
    nextInput?.focus();
  }
};

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === "Backspace" && !digits.value[index] && index > 0) {
    const inputs = (event.target as HTMLElement).closest(".flex")?.querySelectorAll("input");
    const prevInput = inputs?.[index - 1] as HTMLInputElement | undefined;
    digits.value[index - 1] = "";
    prevInput?.focus();
  }
};

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const paste = event.clipboardData?.getData("text").replace(/\D/g, "").slice(0, 6);
  if (paste) {
    for (let i = 0; i < 6; i++) {
      digits.value[i] = paste[i] || "";
    }
  }
};

const handleValidar = () => {
  if (isComplete.value) {
    emit("validar", digits.value.join(""));
  }
};

const handleCancel = () => {
  emit("cancel");
  isOpen.value = false;
};

watch(() => props.open, (newVal) => {
  if (newVal) {
    digits.value = ["", "", "", "", "", ""];
  }
});
</script>