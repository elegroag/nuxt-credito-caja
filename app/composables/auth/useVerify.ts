import { ref, computed, nextTick, readonly } from "#imports";

export function useVerify() {
  // Estado local
  const digits = ref<string[]>(["", "", "", "", "", ""]);
  const loading = ref(false);
  const error = ref("");

  // Props que vendrían de la página
  const coddoc = ref<string | null>(null);
  const documento = ref<string | null>(null);

  // Computed properties
  const isComplete = computed((): boolean =>
    digits.value.every(d => d.length === 1)
  );

  const code = computed((): string => digits.value.join(""));

  // Referencias a inputs
  const inputRefs = ref<Array<HTMLInputElement | null>>([
    null,
    null,
    null,
    null,
    null,
    null
  ]);

  // Métodos
  const setDigitRef = (el: Element | null, index: number): void => {
    inputRefs.value[index] = el instanceof HTMLInputElement ? el : null;
  };

  const focusIndex = async (index: number): Promise<void> => {
    await nextTick();
    inputRefs.value[index]?.focus();
  };

  const normalizeDigit = (value: string): string => {
    const v = value.replace(/\D/g, "");
    return v.slice(0, 1);
  };

  const onDigitInput = async (index: number): Promise<void> => {
    digits.value[index] = normalizeDigit(digits.value[index] || "");

    if (digits.value[index] && index < 5) {
      await focusIndex(index + 1);
    }
  };

  const onBackspace = async (index: number): Promise<void> => {
    if (digits.value[index]) return;
    if (index === 0) return;
    await focusIndex(index - 1);
  };

  const reset = async (): Promise<void> => {
    digits.value = ["", "", "", "", "", ""];
    error.value = "";
    await focusIndex(0);
  };

  const initialize = (
    initialCoddoc?: string | null,
    initialDocumento?: string | null
  ): void => {
    coddoc.value = initialCoddoc ?? null;
    documento.value = initialDocumento ?? null;
    reset();
  };

  const verifyCode = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = "";

      const formData: VerifyForm = {
        codigo: code.value,
        coddoc: coddoc.value,
        documento: documento.value
      };

      const { postJson } = useApi();
      await postJson("/auth/verify", formData);

      // Éxito - la página manejará la redirección
      return;
    } catch (err: any) {
      error.value
        = err.data?.message
          || "Error al verificar el código. Por favor, inténtalo de nuevo.";
      throw err; // Re-lanzar para que la página pueda manejarlo si es necesario
    } finally {
      loading.value = false;
    }
  };

  return {
    // Estado
    digits: readonly(digits),
    loading: readonly(loading),
    error: readonly(error),
    coddoc: readonly(coddoc),
    documento: readonly(documento),

    // Computed
    isComplete: readonly(isComplete),
    code: readonly(code),

    // Métodos
    setDigitRef,
    focusIndex,
    onDigitInput,
    onBackspace,
    reset,
    initialize,
    verifyCode
  };
}
