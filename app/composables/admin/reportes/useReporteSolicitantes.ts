import type {
  ReporteArchivoItem,
  ReporteSolicitanteRow,
  ReporteSolicitantesFiltros,
  ReporteSolicitantesPreview
} from "~~/shared/types/reports/solicitantes-reporte";

interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
}

const cleanValue = (value?: string) => value?.trim() || "";

export const useReporteSolicitantes = () => {
  const api = useApi();
  const { authHeader } = useSession();

  const loading = ref(false);
  const downloading = ref(false);
  const loadingArchivos = ref(false);
  const downloadingArchivo = ref<string | null>(null);
  const error = ref<string | null>(null);
  const previewRows = ref<ReporteSolicitanteRow[]>([]);
  const previewTotal = ref(0);
  const archivosGuardados = ref<ReporteArchivoItem[]>([]);
  const filtros = ref<ReporteSolicitantesFiltros>({
    fecha_desde: "",
    fecha_hasta: "",
    tipo_documento: "",
    estado_solicitud: ""
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();

    Object.entries(filtros.value).forEach(([key, value]) => {
      const cleaned = cleanValue(value);
      if (cleaned) params.append(key, cleaned);
    });

    return params.toString();
  };

  const cargarPreview = async () => {
    loading.value = true;
    error.value = null;

    try {
      const query = buildQueryString();
      const path = `/api/admin/reportes/solicitadores/preview${query ? `?${query}` : ""}`;
      const response = await api.getJson<ApiResponse<ReporteSolicitantesPreview>>(
        path,
        { auth: true }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible cargar la vista previa");
      }

      previewRows.value = response.data.collection;
      previewTotal.value = response.data.total;
    } catch (err) {
      console.error("Error cargando vista previa del reporte:", err);
      error.value = err instanceof Error ? err.message : "Error al cargar el reporte";
    } finally {
      loading.value = false;
    }
  };

  const filenameFromResponse = (response: Response) => {
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    return match?.[1] || `solicitantes-${new Date().toISOString().slice(0, 10)}.xlsx`;
  };

  const descargarExcel = async () => {
    if (import.meta.server) return;

    downloading.value = true;
    error.value = null;

    try {
      const query = buildQueryString();
      const path = `/api/admin/reportes/solicitadores${query ? `?${query}` : ""}`;
      const response = await fetch(api.urlFor(path), {
        method: "GET",
        headers: authHeader.value as HeadersInit
      });

      if (!response.ok) {
        throw new Error("No fue posible generar el archivo Excel");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromResponse(response);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await cargarArchivosGuardados();
    } catch (err) {
      console.error("Error descargando reporte de solicitantes:", err);
      error.value = err instanceof Error ? err.message : "Error al descargar el reporte";
    } finally {
      downloading.value = false;
    }
  };

  const cargarArchivosGuardados = async () => {
    loadingArchivos.value = true;

    try {
      const response = await api.getJson<ApiResponse<{ collection: ReporteArchivoItem[], total: number }>>(
        "/api/admin/reportes/archivos",
        { auth: true }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible cargar los reportes guardados");
      }

      archivosGuardados.value = response.data.collection;
    } catch (err) {
      console.error("Error cargando reportes guardados:", err);
      error.value = err instanceof Error ? err.message : "Error al cargar reportes guardados";
    } finally {
      loadingArchivos.value = false;
    }
  };

  const descargarArchivoGuardado = async (_filename: string) => {
    if (import.meta.server) return;

    downloadingArchivo.value = _filename;
    error.value = null;

    try {
      const query = buildQueryString();
      const encoded = encodeURIComponent(_filename);
      const path = `/api/admin/reportes/archivos/${encoded}${query ? `?${query}` : ""}`;
      const response = await fetch(api.urlFor(path), {
        method: "GET",
        headers: authHeader.value as HeadersInit
      });

      if (!response.ok) {
        throw new Error("No fue posible regenerar el reporte con datos actuales");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromResponse(response);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await cargarArchivosGuardados();
    } catch (err) {
      console.error("Error regenerando reporte:", err);
      error.value = err instanceof Error ? err.message : "Error al regenerar el reporte";
    } finally {
      downloadingArchivo.value = null;
    }
  };

  const limpiarFiltros = async () => {
    filtros.value = {
      fecha_desde: "",
      fecha_hasta: "",
      tipo_documento: "",
      estado_solicitud: ""
    };
    await cargarPreview();
  };

  return {
    loading,
    downloading,
    loadingArchivos,
    downloadingArchivo,
    error,
    filtros,
    previewRows,
    previewTotal,
    archivosGuardados,
    cargarPreview,
    descargarExcel,
    cargarArchivosGuardados,
    descargarArchivoGuardado,
    limpiarFiltros
  };
};
