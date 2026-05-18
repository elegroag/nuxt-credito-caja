import { ref, computed } from "#imports";
import { useApi } from "~/composables/useApi";

export function useConvenioValidation() {
  const api = useApi();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const validationResult = ref<ConvenioValidationResponse["data"] | null>(null);

  const isElegible = computed(() => validationResult.value?.elegible ?? false);
  const convenio = computed(() => validationResult.value?.convenio ?? null);
  const trabajador = computed(() => validationResult.value?.trabajador ?? null);

  /**
   * Valida si un trabajador es elegible para crédito bajo convenio empresarial
   */
  const validarConvenio = async (
    nitEmpresa: string,
    cedulaTrabajador: string
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    validationResult.value = null;

    try {
      const response = await api.getJson<ConvenioValidationResponse>(
        `/api/convenios/validar/${nitEmpresa}/${cedulaTrabajador}`,
        { auth: true }
      );

      if (response.success && response.data) {
        validationResult.value = response.data;
        return response.data.elegible;
      }

      error.value = response.message || "Error al validar convenio";
      return false;
    } catch (err: unknown) {
      const errorData = (err as { data?: ConvenioValidationError }).data;

      if (errorData?.error_type === "NOT_FOUND") {
        error.value
          = errorData.message
            || "No se encontró convenio activo para esta empresa";
      } else if (errorData?.error_type === "VALIDATION_ERROR") {
        error.value
          = errorData.message
            || "El trabajador no cumple con los requisitos mínimos";
      } else {
        error.value = "Error al validar el convenio. Intente nuevamente.";
      }

      console.log("Error validando convenio:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Valida convenio mediante POST (para formularios)
   */
  const validarConvenioPost = async (data: {
    nit_empresa: string
    cedula_trabajador: string
  }): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    validationResult.value = null;

    try {
      const response = await api.postJson<ConvenioValidationResponse>(
        "/api/convenios/validar",
        data,
        { auth: true }
      );

      if (response.success && response.data) {
        validationResult.value = response.data;
        return response.data.elegible;
      }

      error.value = response.message || "Error al validar convenio";
      return false;
    } catch (err: unknown) {
      const errorData = (err as { data?: ConvenioValidationError }).data;

      if (errorData?.error_type === "NOT_FOUND") {
        error.value = errorData.message || "No se encontró convenio activo";
      } else if (errorData?.error_type === "VALIDATION_ERROR") {
        error.value = errorData.message || "No cumple requisitos mínimos";
      } else {
        error.value = "Error al validar el convenio";
      }

      console.error("Error validando convenio:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Limpia el estado de validación
   */
  const limpiarValidacion = () => {
    validationResult.value = null;
    error.value = null;
    loading.value = false;
  };

  /**
   * Obtiene mensaje de error amigable para el usuario
   */
  const getMensajeError = computed(() => {
    if (!error.value) return null;

    // Mensajes amigables basados en el tipo de error
    if (error.value.includes("convenio activo")) {
      return {
        titulo: "Sin convenio empresarial",
        descripcion:
          "La empresa no tiene un convenio activo con Comfaca. Puede aplicar al flujo estándar de crédito.",
        tipo: "info" as const
      };
    }

    if (error.value.includes("tiempo mínimo")) {
      return {
        titulo: "Tiempo de servicio insuficiente",
        descripcion:
          "Debe tener al menos 6 meses de antigüedad en la empresa para acceder a crédito bajo convenio.",
        tipo: "warning" as const
      };
    }

    if (error.value.includes("no está activo")) {
      return {
        titulo: "Estado laboral inactivo",
        descripcion:
          "Su estado laboral debe estar activo para solicitar crédito bajo convenio empresarial.",
        tipo: "warning" as const
      };
    }

    return {
      titulo: "Error de validación",
      descripcion: error.value,
      tipo: "error" as const
    };
  });

  return {
    // Estado
    loading,
    error,
    validationResult,
    isElegible,
    convenio,
    trabajador,
    getMensajeError,

    // Métodos
    validarConvenio,
    validarConvenioPost,
    limpiarValidacion
  };
}
