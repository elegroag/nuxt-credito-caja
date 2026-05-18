import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useEntidadDigital } from "~/composables/entidad/useEntidadDigital";
import { storage } from "~/composables/useStorage";

export function useEntidadDigitalConfirmation() {
  const router = useRouter();
  const {
    tipoIdentificacion: tipoId,
    numeroIdentificacion: numId,
    clave: claveComp,
    claveConfirm: claveConfirmComp,
    overwrite,
    loading,
    errorMsg,
    result,
    crear
  } = useEntidadDigital();

  const claveLocal = ref("");
  const claveConfirmLocal = ref("");
  const overwriteLocal = ref(false);
  const verificationData = ref<EntidadDigitalVerificationData | null>(null);
  const termsAccepted = ref(false);
  const privacyAccepted = ref(false);
  const successMsg = ref("");

  const canConfirm = computed(() => {
    return (
      verificationData.value
      && claveLocal.value
      && claveConfirmLocal.value
      && claveLocal.value.length >= 10
      && claveLocal.value === claveConfirmLocal.value
      && termsAccepted.value
      && privacyAccepted.value
      && !loading.value
    );
  });

  onMounted(async () => {
    const completeData = await storage.getItem("completeVerificationData");
    const basicData = await storage.getItem("basicFormData");

    if (completeData && basicData) {
      verificationData.value = JSON.parse(completeData);
      verificationData.value = {
        ...verificationData.value,
        ...JSON.parse(basicData)
      };
    } else {
      router.push("/entidad-digital");
    }
  });

  const goBack = async () => {
    if (confirm("¿Estás seguro de que deseas regresar?")) {
      await storage.removeItem("completeVerificationData");
      router.push("/entidad-digital");
    }
  };

  const cancelProcess = async () => {
    if (
      confirm(
        "¿Estás seguro de que deseas cancelar el proceso? Se perderán todos los datos capturados."
      )
    ) {
      await storage.removeItem("capturedDocuments");
      await storage.removeItem("completeVerificationData");
      await storage.removeItem("basicFormData");
      router.push("/entidad-digital");
    }
  };

  const confirmAndCreate = async () => {
    if (!canConfirm.value) return;

    errorMsg.value = "";
    successMsg.value = "";

    try {
      if (!verificationData.value?.numeroIdentificacion?.trim()) {
        errorMsg.value = "El número de identificación es requerido.";
        return;
      }

      if (claveLocal.value.length < 10) {
        errorMsg.value = "La clave debe tener al menos 10 caracteres.";
        return;
      }

      if (claveLocal.value !== claveConfirmLocal.value) {
        errorMsg.value = "La confirmación de clave no coincide.";
        return;
      }

      if (verificationData.value?.tipoIdentificacion) {
        tipoId.value = verificationData.value.tipoIdentificacion as TipoIdentificacionExtendido;
      }
      if (verificationData.value?.numeroIdentificacion) {
        numId.value = verificationData.value.numeroIdentificacion;
      }

      claveComp.value = claveLocal.value;
      claveConfirmComp.value = claveConfirmLocal.value;
      overwrite.value = overwriteLocal.value;

      await crear();

      if (result.value) {
        successMsg.value = "¡Entidad digital creada exitosamente!";
        await storage.removeItem("capturedDocuments");
        await storage.removeItem("completeVerificationData");
        await storage.removeItem("basicFormData");

        setTimeout(() => {
          router.push("/inicio");
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("Error creando entidad digital:", error);
      errorMsg.value
        = (error as { data?: { error?: string } })?.data?.error || (error as Error)?.message || "Error creating digital entity";
    }
  };

  return {
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
    confirmAndCreate
  };
}
