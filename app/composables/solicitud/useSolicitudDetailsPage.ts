import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { useParametrosDetalles } from "~/composables/useParametrosDetalles";

export const useSolicitudDetailsPage = () => {
  const route = useRoute();
  const router = useRouter();
  const { getJson, deleteJson } = useApi();
  const { ready } = useSession();

  const {
    loading: loadingParametros,
    error: errorParametros,
    cargarParametros,
    buscarTipoIdentificacion,
    buscarCiudad,
    buscarCargo,
    buscarTipoVivienda,
    buscarTipoContrato,
    getEstadoNombre,
    getEstadoBadgeClass
  } = useParametrosDetalles();

  const solicitudId = route.params.id as string;
  const solicitud = ref<SolicitudCreditoResponse | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const mostrarModalEliminar = ref(false);
  const eliminando = ref(false);

  const numeroSolicitudDisplay = computed(() => {
    return (
      solicitud.value?.payload?.solicitud?.numero_solicitud
      || solicitud.value?.numero_solicitud
      || "-"
    );
  });

  // Verificar si tiene PDF generado
  const tienePdf = computed(() => {
    return !!solicitud.value?.pdfs_generados;
  });

  // Estados base para el timeline
  const estadosTimelineBase = [
    {
      id: "POSTULADO",
      nombre: "Postulación Inicial",
      descripcion: "Solicitud de crédito iniciada y datos básicos registrados"
    },
    {
      id: "DOCUMENTOS_CARGADOS",
      nombre: "Documentación Completada",
      descripcion:
        "Todos los documentos requeridos han sido cargados exitosamente"
    },
    {
      id: "ENVIADO_VALIDACION",
      nombre: "Enviado para Validación",
      descripcion: "Solicitud enviada para validación por asesores"
    },
    {
      id: "PENDIENTE_FIRMADO",
      nombre: "Pendiente de Firma",
      descripcion: "La solicitud está lista para ser firmada electrónicamente"
    },
    {
      id: "FIRMADO",
      nombre: "Solicitud Firmada",
      descripcion: "La solicitud ha sido firmada y está lista para ser enviada"
    },
    {
      id: "ENVIADO_PENDIENTE_APROBACION",
      nombre: "En Proceso de Aprobación",
      descripcion: "La solicitud está siendo evaluada por el comité de crédito"
    }
  ];

  // Estados con fechas reales del timeline
  const estadosTimelineConFechas = computed(() => {
    if (!solicitud.value?.timeline) return estadosTimelineBase;

    return estadosTimelineBase.map((estado) => {
      const timelineEntry = solicitud.value?.timeline?.find(
        t => t.estado === estado.id
      );
      return {
        ...estado,
        fecha: timelineEntry ? fmtDate(timelineEntry.fecha) : undefined
      };
    });
  });

  // Funciones de utilidad
  const fmtMoney = (value: number | undefined) => {
    if (!value) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(value);
  };

  const fmtDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const fmtPct = (value: number | string | undefined) => {
    if (value === undefined || value === null) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "-";
    return `${num.toFixed(2).replace(".", ",")}%`;
  };

  const cargarSolicitud = async () => {
    loading.value = true;
    error.value = null;
    try {
      await ready;
      const response = await getJson<{
        success: boolean
        data: SolicitudCreditoResponse
      }>(`/api/solicitudes/${solicitudId}`, { auth: true });
      solicitud.value = response.data;
    } catch (e: any) {
      console.error(e);
      error.value
        = e.message || "No se pudo cargar la información de la solicitud.";
    } finally {
      loading.value = false;
    }
  };

  const descargarPdf = async () => {
    // Permitir descarga si tiene PDF generado o si está en estado ENVIADO_VALIDACION
    if (!tienePdf.value && solicitud.value?.estado !== "ENVIADO_VALIDACION")
      return;

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
        console.error(
          "Error descargando PDF:",
          errorData.message || "El PDF no está disponible"
        );
        return;
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
    } catch (e) {
      console.error("Error descargando PDF:", e);
    }
  };

  const eliminarSolicitud = async () => {
    eliminando.value = true;
    try {
      await ready;
      await deleteJson(`/api/solicitudes/${solicitudId}`, {
        auth: true
      });

      // Redirigir a la página de solicitudes después de eliminar
      router.push("/dash");
    } catch (e: any) {
      console.error("Error eliminando solicitud:", e);
      error.value = e.message || "No se pudo eliminar la solicitud.";
      mostrarModalEliminar.value = false;
    } finally {
      eliminando.value = false;
    }
  };

  // Cargar datos al montar el componente
  onMounted(() => {
    cargarSolicitud();
  });

  return {
    // Estado principal
    solicitudId,
    solicitud,
    loading,
    error,
    mostrarModalEliminar,
    eliminando,

    // Datos computados
    numeroSolicitudDisplay,
    estadosTimelineConFechas,
    tienePdf,

    // Funciones de parámetros
    buscarTipoIdentificacion,
    buscarCiudad,
    buscarCargo,
    buscarTipoVivienda,
    buscarTipoContrato,
    getEstadoNombre,
    getEstadoBadgeClass,

    // Funciones de utilidad
    fmtMoney,
    fmtDate,
    fmtPct,

    // Funciones principales
    cargarSolicitud,
    descargarPdf,
    eliminarSolicitud
  };
};
