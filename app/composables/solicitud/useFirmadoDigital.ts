import { ref, computed } from "#imports";
import { useApi } from "~/composables/useApi";

interface FirmadoIniciarResponse {
  success: boolean
  data: {
    solicitud_id: string
    transaccion_id: string
    estado: string
    urls_firma: Record<string, string>
    firmantes: number
    mensaje: string
  }
  message: string
}

interface FirmadoEstadoResponse {
  success: boolean
  data: {
    solicitud_id: string
    transaccion_id: string
    estado: string
    firmantes_completados: number
    firmantes_pendientes: number
    fecha_consulta: string
  }
  message: string
}

type EstadoFirmado = "PENDIENTE_FIRMADO" | "FIRMADO" | "RECHAZADO" | "EXPIRADO";

export function useFirmadoDigital() {
  const api = useApi();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const procesoFirmado = ref<FirmadoIniciarResponse["data"] | null>(null);
  const estadoActual = ref<FirmadoEstadoResponse["data"] | null>(null);

  const enProceso = computed(
    () => estadoActual.value?.estado === "PENDIENTE_FIRMADO"
  );
  const firmadoCompleto = computed(
    () => estadoActual.value?.estado === "FIRMADO"
  );
  const firmadoRechazado = computed(
    () => estadoActual.value?.estado === "RECHAZADO"
  );
  const porcentajeCompletado = computed(() => {
    if (!estadoActual.value) return 0;
    const total
      = estadoActual.value.firmantes_completados
        + estadoActual.value.firmantes_pendientes;
    if (total === 0) return 0;
    return Math.round((estadoActual.value.firmantes_completados / total) * 100);
  });

  /**
   * Inicia el proceso de firmado digital enviando el PDF a FirmaPlus
   */
  const iniciarFirmado = async (solicitudId: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    procesoFirmado.value = null;

    try {
      const response = await api.postJson<FirmadoIniciarResponse>(
        `/api/solicitudes/${solicitudId}/iniciar-firmado`,
        {},
        { auth: true }
      );

      if (response.success && response.data) {
        procesoFirmado.value = response.data;
        estadoActual.value = {
          solicitud_id: response.data.solicitud_id,
          transaccion_id: response.data.transaccion_id,
          estado: response.data.estado,
          firmantes_completados: 0,
          firmantes_pendientes: response.data.firmantes,
          fecha_consulta: new Date().toISOString()
        };
        return true;
      }

      error.value
        = response.message || "Error al iniciar el proceso de firmado";
      return false;
    } catch (err: unknown) {
      const errorData = (err as { data?: { error_type?: string; message?: string } })?.data;

      if (errorData?.error_type === "NOT_FOUND") {
        error.value
          = "No se encontró la solicitud o el PDF no ha sido generado";
      } else if (errorData?.error_type === "VALIDATION_ERROR") {
        error.value
          = errorData?.message
            || "Faltan datos requeridos para iniciar el firmado";
      } else {
        error.value = "Error al iniciar el firmado. Intente nuevamente.";
      }

      console.error("Error iniciando firmado:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Consulta el estado actual del proceso de firmado
   */
  const consultarEstado = async (
    solicitudId: string
  ): Promise<EstadoFirmado | null> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getJson<FirmadoEstadoResponse>(
        `/api/solicitudes/${solicitudId}/estado-firmado`,
        { auth: true }
      );

      if (response.success && response.data) {
        estadoActual.value = response.data;
        return response.data.estado as EstadoFirmado;
      }

      error.value = response.message || "Error al consultar el estado";
      return null;
    } catch (err: unknown) {
      const errorData = (err as { data?: { error_type?: string } })?.data;

      if (errorData?.error_type === "NOT_FOUND") {
        error.value = "No se encontró proceso de firmado para esta solicitud";
      } else {
        error.value = "Error al consultar el estado";
      }

      console.error("Error consultando estado:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Polling automático del estado (útil para actualizaciones en tiempo real)
   */
  const iniciarPolling = (
    solicitudId: string,
    intervalo: number = 5000,
    callback?: (estado: EstadoFirmado) => void
  ) => {
    const intervalId = setInterval(async () => {
      const estado = await consultarEstado(solicitudId);

      if (estado && callback) {
        callback(estado);
      }

      // Detener polling si el proceso terminó
      if (estado && ["FIRMADO", "RECHAZADO", "EXPIRADO"].includes(estado)) {
        clearInterval(intervalId);
      }
    }, intervalo);

    return intervalId;
  };

  /**
   * Obtiene URLs de firma para compartir con firmantes
   */
  const obtenerURLsFirma = computed(() => {
    return procesoFirmado.value?.urls_firma ?? {};
  });

  /**
   * Mensaje de estado amigable para el usuario
   */
  const mensajeEstado = computed(() => {
    if (!estadoActual.value) return null;

    const { estado, firmantes_completados, firmantes_pendientes }
      = estadoActual.value;

    switch (estado) {
      case "PENDIENTE_FIRMADO":
        return {
          titulo: "Documento en proceso de firma",
          descripcion: `${firmantes_completados} de ${firmantes_completados + firmantes_pendientes} firmantes han completado su firma`,
          tipo: "info" as const,
          icono: "pending"
        };

      case "FIRMADO":
        return {
          titulo: "Documento firmado exitosamente",
          descripcion: "Todos los firmantes han completado el proceso",
          tipo: "success" as const,
          icono: "check_circle"
        };

      case "RECHAZADO":
        return {
          titulo: "Firma rechazada",
          descripcion: "Uno o más firmantes rechazaron el documento",
          tipo: "error" as const,
          icono: "cancel"
        };

      case "EXPIRADO":
        return {
          titulo: "Proceso expirado",
          descripcion: "El tiempo para firmar el documento ha expirado",
          tipo: "warning" as const,
          icono: "schedule"
        };

      default:
        return {
          titulo: "Estado desconocido",
          descripcion: estado,
          tipo: "info" as const,
          icono: "info"
        };
    }
  });

  /**
   * Verifica si se puede reintentar el firmado
   */
  const puedeReintentar = computed(() => {
    return (
      estadoActual.value?.estado === "RECHAZADO"
      || estadoActual.value?.estado === "EXPIRADO"
    );
  });

  /**
   * Limpia el estado
   */
  const limpiarEstado = () => {
    procesoFirmado.value = null;
    estadoActual.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    // Estado
    loading,
    error,
    procesoFirmado,
    estadoActual,
    enProceso,
    firmadoCompleto,
    firmadoRechazado,
    porcentajeCompletado,
    obtenerURLsFirma,
    mensajeEstado,
    puedeReintentar,

    // Métodos
    iniciarFirmado,
    consultarEstado,
    iniciarPolling,
    limpiarEstado
  };
}
