import { ref, computed } from "#imports";
import { useApi } from "~/composables/useApi";

interface PDFGenerationResponse {
  success: boolean
  data: {
    solicitud_id: string
    pdf_path: string
    pdf_filename: string
    convenio: boolean
    firmantes: number
    generado_en: string
  }
  message: string
}

interface PDFEstadoResponse {
  success: boolean
  data: {
    solicitud_id: string
    tiene_pdf: boolean
    pdf_generado: {
      filename: string
      generado_en: string
      archivo_existe: boolean
      path: string | null
    } | null
  }
  message: string
}

export function usePDFGenerator() {
  const api = useApi();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const pdfData = ref<PDFGenerationResponse["data"] | null>(null);
  const estadoPdf = ref<PDFEstadoResponse["data"] | null>(null);

  const tienePDF = computed(() => estadoPdf.value?.tiene_pdf ?? false);
  const pdfFilename = computed(
    () =>
      pdfData.value?.pdf_filename
      ?? estadoPdf.value?.pdf_generado?.filename
      ?? null
  );

  /**
   * Genera el PDF de una solicitud de crédito
   */
  const generarPDF = async (solicitudId: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    pdfData.value = null;

    try {
      const path = `/api/solicitudes/${solicitudId}/generar-pdf`;
      const response = await api.postJson<PDFGenerationResponse>(
        path,
        {},
        { auth: true }
      );

      if (response.success && response.data) {
        pdfData.value = response.data;
        return true;
      }

      error.value = response.message || "Error al generar el PDF";
      return false;
    } catch (err: any) {
      const errorData = err.data;

      if (errorData?.error_type === "NOT_FOUND") {
        error.value = "No se encontró la solicitud";
      } else if (errorData?.error_type === "VALIDATION_ERROR") {
        error.value
          = errorData.message || "Datos insuficientes para generar el PDF";
      } else {
        error.value = "Error al generar el PDF. Intente nuevamente.";
      }

      console.error("Error generando PDF:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Descarga el PDF generado de una solicitud
   */
  const descargarPDF = async (solicitudId: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const { authHeader } = useSession();

      const baseUrl = String(config.public.backendBaseUrl || "").replace(
        /\/+$/,
        ""
      );
      const url = `${baseUrl}/api/solicitudes/${solicitudId}/descargar-pdf`;

      const headers = authHeader.value as Record<string, string>;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        error.value
          = errorData.message
            || "El PDF no está disponible. Por favor genérelo primero.";
        return false;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `solicitud_${solicitudId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (err: any) {
      error.value = "Error al descargar el PDF";
      console.error("Error descargando PDF:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Visualiza el PDF en una nueva ventana/pestaña
   */
  const visualizarPDF = async (solicitudId: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const { authHeader } = useSession();

      const baseUrl = String(config.public.backendBaseUrl || "").replace(
        /\/+$/,
        ""
      );
      const url = `${baseUrl}/api/solicitudes/${solicitudId}/descargar-pdf`;

      const headers = authHeader.value as Record<string, string>;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        error.value
          = errorData.message
            || "El PDF no está disponible. Por favor genérelo primero.";
        return false;
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const newWindow = window.open(blobUrl, "_blank");

      if (!newWindow) {
        error.value
          = "Por favor permita ventanas emergentes para visualizar el PDF";
        window.URL.revokeObjectURL(blobUrl);
        return false;
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);

      return true;
    } catch (err: any) {
      error.value = "Error al visualizar el PDF";
      console.error("Error visualizando PDF:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Verifica el estado del PDF de una solicitud
   */
  const verificarEstadoPDF = async (solicitudId: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getJson<PDFEstadoResponse>(
        `/api/solicitudes/${solicitudId}/estado-pdf`,
        { auth: true }
      );

      if (response.success && response.data) {
        estadoPdf.value = response.data;
        return response.data.tiene_pdf;
      }

      error.value = response.message || "Error al verificar el estado del PDF";
      return false;
    } catch (err: any) {
      error.value = "Error al verificar el estado del PDF";
      console.error("Error verificando estado PDF:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Genera y descarga el PDF en una sola operación
   */
  const generarYDescargarPDF = async (
    solicitudId: string
  ): Promise<boolean> => {
    const generado = await generarPDF(solicitudId);

    if (generado) {
      // Pequeña espera para asegurar que el archivo esté listo
      await new Promise(resolve => setTimeout(resolve, 500));
      await descargarPDF(solicitudId);
      return true;
    }

    return false;
  };

  /**
   * Limpia el estado
   */
  const limpiarEstado = () => {
    pdfData.value = null;
    estadoPdf.value = null;
    error.value = null;
    loading.value = false;
  };

  /**
   * Mensaje de progreso amigable
   */
  const mensajeProgreso = computed(() => {
    if (loading.value) {
      return "Generando documento PDF...";
    }
    if (pdfData.value) {
      return `PDF generado exitosamente${pdfData.value.convenio ? " con convenio empresarial" : ""}`;
    }
    return null;
  });

  return {
    // Estado
    loading,
    error,
    pdfData,
    estadoPdf,
    tienePDF,
    pdfFilename,
    mensajeProgreso,

    // Métodos
    generarPDF,
    descargarPDF,
    visualizarPDF,
    verificarEstadoPDF,
    generarYDescargarPDF,
    limpiarEstado
  };
}
