import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { navigateTo } from "#app";
import { useApi } from "~/composables/useApi";
import { storage } from "~/composables/useStorage";
import { useEntidadDigitalQr } from "./useEntidadDigitalQr";

export function useEntidadDigital() {
  const route = useRoute();
  const { postJson } = useApi();
  const {
    qrCodeUrl,
    loadingQR,
    tokenExpired,
    timeRemaining,
    timeRemainingClass,
    isCapturasConfirmadas,
    formatTimeRemaining,
    generateQR,
    cleanup
  } = useEntidadDigitalQr();

  // Form state
  const tipoIdentificacion = ref<TipoIdentificacionExtendido>("CC");
  const numeroIdentificacion = ref("");
  const clave = ref("");
  const claveConfirm = ref("");
  const overwrite = ref(false);

  // UI state
  const loading = ref(false);
  const errorMsg = ref("");
  const result = ref<unknown | null>(null);

  // Flow state
  const currentStep = ref<"basic" | "qr">("basic");
  const redirectTo = ref("");

  // Computed
  const isBasicFormValid = computed(() => {
    return tipoIdentificacion.value && numeroIdentificacion.value;
  });

  // Initialize from query params or storage
  onMounted(async () => {
    const t = route.query.tipo_identificacion;
    const n = route.query.numero_identificacion;
    const r = route.query.redirect;

    if (
      typeof t === "string"
      && (t === "CC" || t === "CE" || t === "NIT" || t === "PAS")
    ) {
      tipoIdentificacion.value = t;
    }
    if (typeof n === "string" && n.trim()) {
      numeroIdentificacion.value = n;
    }
    if (typeof r === "string" && r.startsWith("/")) {
      redirectTo.value = r;
    }

    if (!numeroIdentificacion.value) {
      const savedData = await storage.getItem("basicFormData");
      if (savedData) {
        const data = JSON.parse(savedData);
        tipoIdentificacion.value = data.tipoIdentificacion || "CC";
        numeroIdentificacion.value = data.numeroIdentificacion || "";
      }
    }
  });

  const validateForm = () => {
    if (!numeroIdentificacion.value.trim()) {
      errorMsg.value = "El número de identificación es requerido.";
      return false;
    }
    if (clave.value.length < 10) {
      errorMsg.value = "La clave debe tener al menos 10 caracteres.";
      return false;
    }
    if (clave.value !== claveConfirm.value) {
      errorMsg.value = "La confirmación de clave no coincide.";
      return false;
    }
    return true;
  };

  const _handleQrConfirm = async (data: unknown) => {
    await storage.setItem("completeVerificationData", JSON.stringify(data));
    result.value = data;
    await navigateTo("/dash/entidad-digital/confirmation");
  };

  const _generateQR = async (canvasRef: HTMLCanvasElement | null) => {
    try {
      errorMsg.value = "";
      const userSession = await storage.getItem("comfaca_credito_user");
      if (!userSession) throw new Error("No se encontró sesión de usuario");
      const { username } = JSON.parse(userSession);
      await generateQR(username, canvasRef);
    } catch (error: unknown) {
      const err = error as { message?: string };
      errorMsg.value = err.message || "Error al generar el código QR";
    }
  };

  const nextToQR = async (canvasRef: HTMLCanvasElement | null) => {
    if (!isBasicFormValid.value) {
      errorMsg.value = "Por favor completa todos los campos correctamente";
      return;
    }

    const basicData = {
      tipoIdentificacion: tipoIdentificacion.value,
      numeroIdentificacion: numeroIdentificacion.value
    };
    await storage.setItem("basicFormData", JSON.stringify(basicData));

    errorMsg.value = "";
    currentStep.value = "qr";
    await _generateQR(canvasRef);
  };

  const goBack = () => {
    cleanup();
    currentStep.value = "basic";
    errorMsg.value = "";
  };

  const resetForm = () => {
    tipoIdentificacion.value = "CC";
    numeroIdentificacion.value = "";
    clave.value = "";
    claveConfirm.value = "";
    overwrite.value = false;
    errorMsg.value = "";
    result.value = null;
  };

  const crear = async () => {
    errorMsg.value = "";
    result.value = null;

    if (!validateForm()) return;

    loading.value = true;
    try {
      const userSession = await storage.getItem("comfaca_credito_user");
      if (!userSession)
        throw new Error("No se encontró sesión de usuario activa");
      const { username } = JSON.parse(userSession);

      const completeData = await storage.getItem("completeVerificationData");
      let documentos = {};
      let selfie = "";

      if (completeData) {
        const data = JSON.parse(completeData);
        documentos = data.documents || {};
        selfie = data.selfie || "";
      }

      result.value = await postJson<unknown>("/api/entidad-digital/completo", {
        username,
        tipo_identificacion: tipoIdentificacion.value,
        numero_identificacion: numeroIdentificacion.value,
        clave: clave.value,
        documentos,
        selfie
      });

      if (redirectTo.value) {
        await navigateTo(redirectTo.value);
      }
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      errorMsg.value
        = err?.data?.error || err?.message || "Error creando entidad digital";
    } finally {
      loading.value = false;
    }
  };

  return {
    tipoIdentificacion,
    numeroIdentificacion,
    clave,
    claveConfirm,
    overwrite,
    loading,
    errorMsg,
    result,
    currentStep,
    qrCodeUrl,
    loadingQR,
    tokenExpired,
    timeRemaining,
    isCapturasConfirmadas,
    isBasicFormValid,
    timeRemainingClass,
    crear,
    resetForm,
    validateForm,
    formatTimeRemaining,
    generateQR: _generateQR,
    nextToQR,
    goBack
  };
}
