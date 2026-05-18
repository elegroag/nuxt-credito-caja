import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { useDocumentos } from "~/composables/solicitud/useDocumentos";

export const useDocumentosSolicitud = () => {
  const route = useRoute();
  const router = useRouter();
  const { getJson, postJson, urlFor } = useApi();
  const { ready, authHeader } = useSession();

  const solicitudId = route.params.id as string;
  const buildDownloadUrl = (documentoId: string) =>
    urlFor(
      `/api/solicitudes/${solicitudId}/documentos/${documentoId}/descargar`
    );
  const extractDownloadError = (payload: unknown, status: number) => {
    if (!payload || typeof payload !== "object") {
      return `Error HTTP: ${status}`;
    }
    const data = payload as {
      message?: string
      error?: string
      success?: boolean
      data?: {
        message?: string
        error?: string
        success?: boolean
      }
    };
    return (
      data.message
      || data.error
      || data.data?.error
      || data.data?.message
      || `Error HTTP: ${status}`
    );
  };
  const getFilenameFromHeader = (
    contentDisposition: string | null,
    defaultName: string
  ) => {
    if (!contentDisposition) return defaultName;

    // RFC 5987: filename*=utf-8''nombre%20archivo.pdf
    const filenameStarMatch = contentDisposition.match(
      /filename\*\s*=\s*([^;]+)/i
    );
    if (filenameStarMatch && filenameStarMatch[1]) {
      const value = filenameStarMatch[1]?.trim();
      if (value) {
        const parts = value.split("''");
        const encodedName: string
          = parts.length === 2 ? (parts[1] ?? value) : value;
        try {
          return (
            decodeURIComponent(encodedName.replace(/['"]/g, "")) || defaultName
          );
        } catch {
          // Si falla la decodificación, continuar con el fallback estándar
        }
      }
    }

    const fileNameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i
    );
    if (fileNameMatch && fileNameMatch[1]) {
      return fileNameMatch[1].replace(/['"]/g, "");
    }
    return defaultName;
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  // Composable de documentos existente
  const {
    subirDocumento,
    eliminarDocumento,
    cargarDocumentos,
    documentosCargados,
    documentosRequeridos,
    progreso,
    error: errorUpload
  } = useDocumentos(solicitudId);

  // Estado local
  const solicitud = ref<SolicitudCredito | null>(null);
  const loadingSolicitud = ref(true);
  const errorSolicitud = ref<string | null>(null);
  const cargandoId = ref<string | null | undefined>(null);
  const downloadError = ref<string | null>(null);
  const downloadErrorDialogOpen = ref(false);

  // Métodos helper
  const getDocumentoCargado = (reqId: string) => {
    if (!documentosCargados.value || !Array.isArray(documentosCargados.value)) {
      return undefined;
    }
    return documentosCargados.value.find(
      d => d.documento_requerido_id === reqId
    );
  };

  // Computed properties
  const puedeContinuar = computed(() => {
    if (
      !solicitud.value
      || !documentosRequeridos.value
      || !Array.isArray(documentosRequeridos.value)
    )
      return false;
    const obligatorios = documentosRequeridos.value.filter(
      d => d.obligatorio
    );
    return obligatorios.every(req => getDocumentoCargado(req.id));
  });

  const progresoDocumentos = computed(() => {
    if (
      !documentosRequeridos.value
      || !Array.isArray(documentosRequeridos.value)
    )
      return 0;

    // Contar cuántos documentos requeridos están cargados
    const cargados = documentosRequeridos.value.filter(req =>
      getDocumentoCargado(req.id)
    ).length;
    const total = documentosRequeridos.value.length;

    return total > 0 ? Math.round((cargados / total) * 100) : 0;
  });

  const documentosCargadosCount = computed(() => {
    if (
      !documentosRequeridos.value
      || !Array.isArray(documentosRequeridos.value)
    )
      return 0;

    // Contar cuántos documentos requeridos están cargados
    return documentosRequeridos.value.filter(req =>
      getDocumentoCargado(req.id)
    ).length;
  });

  // Métodos de acción
  const cargarSolicitud = async () => {
    loadingSolicitud.value = true;
    errorSolicitud.value = null;

    try {
      await ready;
      // Cargar datos de la solicitud
      const response = await getJson<{
        success: boolean
        data: SolicitudCredito
      }>(`/api/solicitudes/${solicitudId}`, { auth: true });
      solicitud.value = response.data;

      // Cargar documentos requeridos y existentes con una sola llamada
      await cargarDocumentos();
    } catch (e: unknown) {
      console.error(e);
      errorSolicitud.value
        = (e as Error).message || "No se pudo cargar la información de la solicitud.";
    } finally {
      loadingSolicitud.value = false;
    }
  };

  const handleUpload = async (file: File, docReqId: string) => {
    cargandoId.value = docReqId;
    try {
      await subirDocumento(file, docReqId);
    } catch {
      // El error ya se maneja en el composable y se pasa via prop
    } finally {
      cargandoId.value = null;
    }
  };

  const handleDelete = async (docCargadoId: string) => {
    // Encontrar a qué requerimiento pertenece para mostrar loading si es necesario
    const doc = documentosCargados.value?.find(
      d => d.documento_uuid === docCargadoId
    );
    if (doc) {
      cargandoId.value = doc.documento_requerido_id;
    }

    try {
      await eliminarDocumento(docCargadoId);
    } catch (e) {
      console.error(e);
    } finally {
      cargandoId.value = null;
    }
  };

  const handleDownload = async (documentoId: string) => {
    try {
      const headers = authHeader.value as Record<string, string>;
      const url = buildDownloadUrl(documentoId);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...headers
        }
      });

      const contentType
        = response.headers.get("content-type")?.toLowerCase() || "";

      if (contentType.includes("application/json")) {
        const payload = await response.json().catch(() => null);
        const errorMessage = extractDownloadError(payload, response.status);
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = getFilenameFromHeader(
        response.headers.get("content-disposition"),
        "documento"
      );
      triggerDownload(blob, fileName);
    } catch (error) {
      const message
        = error instanceof Error ? error.message : "Error al descargar documento";
      console.error("Error al descargar documento:", error);
      downloadError.value = message;
      downloadErrorDialogOpen.value = true;
    }
  };

  const handleNavigation = (step: string) => {
    if (step === "formulario") {
      router.push(`/dash/solicitud/edit/${solicitudId}`);
    } else if (step === "completado") {
      router.push(`/dash/solicitud/resumen/${solicitudId}`);
    }
    // 'documentos' es el paso actual, no navegamos
  };

  const handleBack = () => {
    // Volver a la lista de solicitudes o al paso anterior si fuera wizard
    router.push("/dash/solicitudes");
  };

  const handleContinue = async () => {
    if (!puedeContinuar.value) return;

    try {
      // Cambiar el estado de la solicitud a DOCUMENTOS_CARGADOS
      await postJson(
        `/api/solicitudes/${solicitudId}/cambiar-estado`,
        {
          estado: "DOCUMENTOS_CARGADOS"
        },
        { auth: true }
      );

      // Navegar al resumen
      router.push(`/dash/solicitud/resumen/${solicitudId}`);
    } catch (e: unknown) {
      console.error("Error al cambiar estado:", e);
      errorSolicitud.value
        = (e as Error).message || "Error al actualizar el estado de la solicitud";
    }
  };

  const setDownloadErrorDialogOpen = (value: boolean) => {
    downloadErrorDialogOpen.value = value;
    if (!value) {
      downloadError.value = null;
    }
  };

  return {
    // Estado
    solicitud,
    loadingSolicitud,
    errorSolicitud,
    cargandoId,
    downloadError,
    downloadErrorDialogOpen,

    // Computed
    puedeContinuar,
    progresoDocumentos,
    documentosCargadosCount,

    // Métodos
    getDocumentoCargado,
    cargarSolicitud,
    handleUpload,
    handleDelete,
    handleDownload,
    handleNavigation,
    handleBack,
    handleContinue,
    setDownloadErrorDialogOpen,

    // Del composable useDocumentos
    documentosCargados,
    documentosRequeridos,
    progreso,
    errorUpload
  };
};
