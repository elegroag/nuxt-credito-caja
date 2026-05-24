import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { useDocumentos } from "~/composables/solicitud/useDocumentos";
import { useConfigurations } from "~/composables/admin/useConfigurations";

interface VerificationResult {
  tiene_firma: boolean;
  message?: string;
}

export const useResumenSolicitud = () => {
  const route = useRoute();
  const router = useRouter();
  const { getJson, postJson } = useApi();
  const { ready: _ready } = useSession();

  const solicitudId = route.params.id as string;

  // Composable de documentos
  const { cargarDocumentos, documentosCargados, documentosRequeridos } = useDocumentos(solicitudId);

  // Estado
  const solicitud = ref<SolicitudCredito | null>(null);
  const loadingSolicitud = ref(true);
  const errorSolicitud = ref<string | null>(null);
  const enviando = ref(false);
  const showCapturaModal = ref(false);
  const capturaError = ref<string | null>(null);

  // Computed
  const todosDocumentosCompletos = computed(() => {
    if (!documentosRequeridos.value) return false;
    const obligatorios = documentosRequeridos.value.filter((d) => d.obligatorio);
    return obligatorios.every((d) => getDocumentoCargado(d.id));
  });

  const { loadConfigurations, getConfigurationAsBoolean } = useConfigurations();

  onMounted(async () => {
    await loadConfigurations();
  });

  const firmaDigitalLocal = computed(() => getConfigurationAsBoolean("firma_digital_local", false));

  // Métodos
  const getDocumentoCargado = (reqId: string) => {
    if (!documentosCargados.value) return null;
    return documentosCargados.value.find((d) => d.documento_requerido_id === reqId);
  };

  const verificarFirmaDigital = async (): Promise<VerificationResult> => {
    try {
      const response = await getJson<{
        success: boolean;
        data?: { tiene_firma: boolean };
        message?: string;
      }>("/mercurio/firma_digital_keys", { auth: true });

      return {
        tiene_firma: response.success && response.data?.tiene_firma === true,
        message: response.message
      };
    } catch (e) {
      console.error("Error verificando firma digital:", e);
      return { tiene_firma: false, message: "Error al verificar firma digital" };
    }
  };

  const cargarSolicitud = async () => {
    loadingSolicitud.value = true;
    errorSolicitud.value = null;

    try {
      // Cargar datos de la solicitud
      const response = await getJson<{
        success: boolean;
        data: SolicitudCredito;
      }>(`/api/solicitudes/${solicitudId}`, { auth: true });
      solicitud.value = response.data;

      // Cargar documentos requeridos y existentes
      await cargarDocumentos();
    } catch (e: unknown) {
      console.error(e);
      errorSolicitud.value =
        (e as Error).message || "No se pudo cargar la información de la solicitud.";
    } finally {
      loadingSolicitud.value = false;
    }
  };

  const handleNavigation = (step: string) => {
    if (step === "documentos") {
      router.push(`/dash/solicitud/documentos/${solicitudId}`);
    } else if (step === "formulario") {
      router.push(`/dash/solicitud/edit/${solicitudId}`);
    }
  };

  const handleBack = () => {
    router.push(`/dash/solicitud/documentos/${solicitudId}`);
  };

  const handleEdit = () => {
    router.push(`/dash/solicitud/edit/${solicitudId}`);
  };

  const handleEnviarValidacion = async () => {
    if (!todosDocumentosCompletos.value || enviando.value) return;

    try {
      if (firmaDigitalLocal.value === true) {
        // Verificar si el usuario tiene firma digital
        const verificacion = await verificarFirmaDigital();

        if (!verificacion.tiene_firma) {
          // Mostrar modal de captura de código
          showCapturaModal.value = true;
          capturaError.value = null;
          return;
        }
      }

      // Continuar con el flujo normal si no requiere firma local o si tiene firma
      // await enviarSolicucion();
    } catch (e: unknown) {
      console.error(e);
      errorSolicitud.value = (e as Error).message || "Error al procesar la solicitud.";
    }
  };

  const enviarSolicucion = async () => {
    if (!todosDocumentosCompletos.value || enviando.value) return;

    try {
      enviando.value = true;

      // Primero cambiar el estado a ENVIADO_VALIDACION
      const estadoResponse = await postJson<{
        success: boolean;
        message?: string;
      }>(
        `/api/solicitudes/${solicitudId}/cambiar-estado`,
        {
          estado: "ENVIADO_VALIDACION"
        },
        { auth: true }
      );

      if (!estadoResponse.success) {
        errorSolicitud.value =
          estadoResponse.message || "Error al cambiar el estado de la solicitud";
        return;
      }

      console.log("Estado cambiado a ENVIADO_VALIDACION:", estadoResponse);

      // Generar oficio PDF usando el endpoint existente
      const pdfResponse = await postJson<{
        success: boolean;
        message?: string;
      }>(
        `/api/solicitudes/${solicitudId}/generar-pdf`,
        {
          fecha_envio: new Date().toISOString()
        },
        { auth: true }
      );

      console.log("Response generacion PDF:", pdfResponse);

      // Navegar a página de confirmación si el PDF se generó exitosamente
      if (pdfResponse.success) {
        router.push(`/dash/solicitud/special_thanks/${solicitudId}`);
      } else {
        errorSolicitud.value = pdfResponse.message || "Error al generar el PDF";
      }
    } catch (e: unknown) {
      console.error(e);
      errorSolicitud.value =
        (e as Error).message || "Error al enviar la solicitud para validación.";
    } finally {
      enviando.value = false;
    }
  };

  const handleValidarCodigo = async (codigo: string) => {
    try {
      capturaError.value = null;

      // Validar código con el backend
      const response = await postJson<{
        success: boolean;
        message?: string;
      }>(
        "/api/validacion/codigo-firma",
        {
          codigo,
          solicitud_id: solicitudId
        },
        { auth: true }
      );

      if (response.success) {
        showCapturaModal.value = false;
        await enviarSolicucion();
      } else {
        capturaError.value = response.message || "Código inválido";
      }
    } catch (e: unknown) {
      capturaError.value = (e as Error).message || "Error al validar código";
    }
  };

  const handleCancelarCaptura = () => {
    showCapturaModal.value = false;
    capturaError.value = null;
  };

  return {
    // Estado
    solicitud,
    loadingSolicitud,
    errorSolicitud,
    enviando,
    showCapturaModal,
    capturaError,

    // Computed
    todosDocumentosCompletos,

    // Métodos
    getDocumentoCargado,
    cargarSolicitud,
    handleNavigation,
    handleBack,
    handleEdit,
    handleEnviarValidacion,
    handleValidarCodigo,
    handleCancelarCaptura,

    // Datos del composable de documentos
    documentosCargados,
    documentosRequeridos
  };
};
