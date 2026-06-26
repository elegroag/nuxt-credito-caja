import { ref, computed, nextTick, readonly, onUnmounted } from "#imports";
import type { ComponentPublicInstance } from "vue";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { storage } from "~/composables/useStorage";

const PIN_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;

interface VerifyCodeResponseData {
  access_token?: string
  token_type?: string
  user?: {
    username?: string
    email?: string
    roles?: string[]
    tipo_documento?: string
    numero_documento?: string
    nombres?: string
    apellidos?: string
  }
}

const getResendStorageKey = (coddoc: string, documento: string) =>
  `verify_resend_at_${coddoc}_${documento}`;

export function useVerify() {
  const digits = ref<string[]>(Array.from({ length: PIN_LENGTH }, () => ""));
  const loading = ref(false);
  const resending = ref(false);
  const error = ref("");
  const successMessage = ref("");
  const countdown = ref(0);

  const coddoc = ref<string | null>(null);
  const documento = ref<string | null>(null);
  const maskedEmail = ref("");

  const isComplete = computed((): boolean =>
    digits.value.every(d => d.length === 1)
  );

  const code = computed((): string => digits.value.join(""));

  const inputRefs = ref<Array<HTMLInputElement | null>>(
    Array.from({ length: PIN_LENGTH }, () => null)
  );

  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let completeHandler: (() => Promise<void>) | null = null;

  const resolveInputEl = (
    el: Element | ComponentPublicInstance | null
  ): HTMLInputElement | null => {
    if (!el) return null;
    if (el instanceof HTMLInputElement) return el;
    if ("$el" in el && el.$el instanceof HTMLElement) {
      const input = el.$el.querySelector("input");
      if (input instanceof HTMLInputElement) return input;
    }
    return null;
  };

  const clearCountdownTimer = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  };

  const startCountdown = (seconds: number) => {
    clearCountdownTimer();
    countdown.value = seconds;

    countdownTimer = setInterval(() => {
      if (countdown.value <= 1) {
        countdown.value = 0;
        clearCountdownTimer();
        return;
      }
      countdown.value -= 1;
    }, 1000);
  };

  const persistResendTimestamp = async (timestamp: number) => {
    if (!coddoc.value || !documento.value || !import.meta.client) return;
    await storage.setItem(
      getResendStorageKey(coddoc.value, documento.value),
      String(timestamp)
    );
  };

  const restoreCountdown = async () => {
    if (!coddoc.value || !documento.value || !import.meta.client) return;

    const raw = await storage.getItem(
      getResendStorageKey(coddoc.value, documento.value)
    );
    if (!raw) return;

    const lastSentAt = Number(raw);
    if (!Number.isFinite(lastSentAt)) return;

    const elapsed = Date.now() - lastSentAt;
    const remaining = RESEND_COOLDOWN_SECONDS - Math.floor(elapsed / 1000);
    if (remaining > 0) {
      startCountdown(remaining);
    }
  };

  const maskEmail = (email: string): string => {
    const [localPart = "", domain = ""] = email.split("@");
    if (!localPart || !domain) return email;

    const visible = localPart.slice(0, Math.min(2, localPart.length));
    const [domainName = "", ...domainRest] = domain.split(".");
    const tld = domainRest.length > 0 ? `.${domainRest.join(".")}` : "";

    return `${visible}***@${domainName.slice(0, 1)}***${tld}`;
  };

  const setDigitRef = (el: Element | ComponentPublicInstance | null, index: number): void => {
    inputRefs.value[index] = resolveInputEl(el);
  };

  const focusIndex = async (index: number): Promise<void> => {
    await nextTick();
    const input = inputRefs.value[index];
    if (!input) return;
    input.focus();
    input.select();
  };

  const normalizeDigit = (value: string): string => {
    const v = value.replace(/\D/g, "");
    return v.slice(-1);
  };

  const notifyIfComplete = async (): Promise<void> => {
    if (loading.value || !digits.value.every(d => d.length === 1)) return;
    if (completeHandler) {
      await completeHandler();
    }
  };

  const fillDigitsFromString = async (value: string, startIndex = 0): Promise<void> => {
    const chars = value.replace(/\D/g, "").split("");
    if (!chars.length) return;

    for (let offset = 0; offset < chars.length; offset++) {
      const index = startIndex + offset;
      if (index >= PIN_LENGTH) break;
      digits.value[index] = chars[offset]!;
    }

    const nextEmpty = digits.value.findIndex(d => !d);
    await focusIndex(nextEmpty === -1 ? PIN_LENGTH - 1 : nextEmpty);
    await notifyIfComplete();
  };

  const onDigitInput = async (index: number, event?: Event): Promise<void> => {
    const target = event?.target as HTMLInputElement | undefined;
    const rawValue = target?.value ?? digits.value[index] ?? "";
    const normalized = normalizeDigit(rawValue);

    digits.value[index] = normalized;
    if (target && target.value !== normalized) {
      target.value = normalized;
    }

    if (normalized && index < PIN_LENGTH - 1) {
      await focusIndex(index + 1);
      return;
    }

    await notifyIfComplete();
  };

  const onDigitKeydown = async (
    event: KeyboardEvent,
    index: number
  ): Promise<void> => {
    if (event.key === "Backspace") {
      if (digits.value[index]) {
        digits.value[index] = "";
        return;
      }
      if (index > 0) {
        event.preventDefault();
        digits.value[index - 1] = "";
        await focusIndex(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      await focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      event.preventDefault();
      await focusIndex(index + 1);
      return;
    }

    if (event.key === "Enter" && isComplete.value) {
      event.preventDefault();
      await notifyIfComplete();
    }
  };

  const onPaste = async (event: ClipboardEvent, startIndex: number): Promise<void> => {
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text") || "";
    await fillDigitsFromString(pasted, startIndex);
  };

  const onDigitFocus = (event: FocusEvent): void => {
    const input = event.target as HTMLInputElement | null;
    input?.select();
  };

  const registerCompleteHandler = (handler: () => Promise<void>): void => {
    completeHandler = handler;
  };

  const reset = async (): Promise<void> => {
    digits.value = Array.from({ length: PIN_LENGTH }, () => "");
    error.value = "";
    successMessage.value = "";
    await focusIndex(0);
  };

  const loadMaskedEmail = async () => {
    if (!import.meta.client) return;

    const userRaw = await storage.getItem("comfaca_credito_user");
    if (!userRaw) return;

    try {
      const user = JSON.parse(userRaw) as { email?: string };
      if (typeof user.email === "string" && user.email) {
        maskedEmail.value = maskEmail(user.email);
      }
    } catch {
      maskedEmail.value = "";
    }
  };

  const initialize = (
    initialCoddoc?: string | null,
    initialDocumento?: string | null
  ): void => {
    coddoc.value = initialCoddoc ?? null;
    documento.value = initialDocumento ?? null;
    void loadMaskedEmail();
    void restoreCountdown();
    void reset();
  };

  const verifyCode = async (): Promise<VerifyCodeResponseData> => {
    try {
      loading.value = true;
      error.value = "";
      successMessage.value = "";

      if (!coddoc.value || !documento.value) {
        throw new Error("Faltan datos de verificación. Vuelve a registrarte.");
      }

      const formData = {
        codigo: code.value,
        coddoc: coddoc.value,
        documento: documento.value
      };

      const { postJson } = useApi();
      const response = await postJson<{
        success: boolean
        data?: VerifyCodeResponseData
        error?: string
      }>("/api/auth/verify-code", formData);

      if (!response.success || !response.data) {
        throw new Error(response.error || "No fue posible verificar el código");
      }

      const { setSession } = useSession();
      const user = response.data.user;

      if (response.data.access_token && user) {
        await setSession({
          accessToken: response.data.access_token,
          tokenType: response.data.token_type || "bearer",
          user: {
            username: user.username || "",
            email: user.email || "",
            roles: user.roles || [],
            permissions: [],
            tipo_documento: user.tipo_documento || coddoc.value,
            numero_documento: user.numero_documento || documento.value,
            nombres: user.nombres || "",
            apellidos: user.apellidos || ""
          }
        });
      }

      successMessage.value = "Identidad verificada correctamente.";
      return response.data;
    } catch (err: unknown) {
      const errObj = err as {
        data?: { error?: string; message?: string }
        message?: string
      };
      error.value
        = errObj.data?.error
          || errObj.data?.message
          || errObj.message
          || "Error al verificar el código. Por favor, inténtalo de nuevo.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resendCode = async (): Promise<void> => {
    if (countdown.value > 0 || !coddoc.value || !documento.value) return;

    try {
      resending.value = true;
      error.value = "";
      successMessage.value = "";

      const { postJson } = useApi();
      const response = await postJson<{
        success: boolean
        error?: string
      }>("/api/auth/resend-code", {
        coddoc: coddoc.value,
        documento: documento.value
      });

      if (!response.success) {
        throw new Error(response.error || "No fue posible reenviar el código");
      }

      const timestamp = Date.now();
      await persistResendTimestamp(timestamp);
      startCountdown(RESEND_COOLDOWN_SECONDS);
      successMessage.value = "Te enviamos un nuevo código a tu correo.";
      await reset();
    } catch (err: unknown) {
      const errObj = err as {
        data?: { error?: string; message?: string }
        message?: string
      };
      error.value
        = errObj.data?.error
          || errObj.data?.message
          || errObj.message
          || "No fue posible reenviar el código.";
      throw err;
    } finally {
      resending.value = false;
    }
  };

  onUnmounted(() => {
    clearCountdownTimer();
  });

  return {
    digits,
    loading: readonly(loading),
    resending: readonly(resending),
    error: readonly(error),
    successMessage: readonly(successMessage),
    countdown: readonly(countdown),
    coddoc: readonly(coddoc),
    documento: readonly(documento),
    maskedEmail: readonly(maskedEmail),
    pinLength: PIN_LENGTH,
    isComplete: readonly(isComplete),
    code: readonly(code),
    setDigitRef,
    focusIndex,
    onDigitInput,
    onDigitKeydown,
    onPaste,
    onDigitFocus,
    registerCompleteHandler,
    reset,
    initialize,
    verifyCode,
    resendCode
  };
}
