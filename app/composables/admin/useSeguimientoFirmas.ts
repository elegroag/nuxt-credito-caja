import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { getEstadoFirmaBadgeColor, getEstadoFirmaIcon, getEstadoFirmaLabel } from "~/lib/estados_firma_kiai";

interface ProcesoFirmado {
  transaccion_id: string;
  estado: string;
  proveedor: string;
  simulado: boolean;
  fecha_inicio: string | null;
  expira_en: string | null;
  fecha_completado: string | null;
  ultima_consulta: string | null;
  firmantes_completados: number;
  firmantes_pendientes: number;
}

interface SolicitudConFirma {
  numero_solicitud: string;
  owner_username: string;
  estado: string;
  estado_info: { id: string; nombre: string; color: string | null } | null;
  fecha_radicado: string | null;
  created_at: string | null;
  updated_at: string | null;
  solicitante: {
    nombres: string | null;
    apellidos: string | null;
    numero_documento: string | null;
    email: string | null;
    nombres_apellidos: string;
  } | null;
  proceso_firmado: ProcesoFirmado | null;
}

type EstadoFirmadoResponse = ProcesoFirmado & {
  solicitud_id: string;
  estado_solicitud: string;
};

export function useSeguimientoFirmas() {
  const router = useRouter();
  const { getJson } = useApi();
  const { ready } = useSession();

  const solicitudes = ref<SolicitudConFirma[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalSolicitudes = ref(0);
  const convenioActivo = ref<ConvenioActivo | null>(null);

  // Paginación
  const currentPage = ref(1);
  const pageSize = ref(20);
  const estadoFiltro = ref<string>("PENDIENTE_FIRMADO");

  // Estados de la solicitud; un proceso vencido en KIAI devuelve la solicitud a APROBADA
  const estadosDisponibles = [
    { value: "PENDIENTE_FIRMADO", label: "Pendiente de Firmar" },
    { value: "FIRMADO", label: "Firmado" },
    { value: "RECHAZADA", label: "Rechazada" },
    { value: "CANCELADA", label: "Cancelada" },
    { value: "APROBADA", label: "Vencido (por reenviar)" },
    { value: "@", label: "Todos con proceso de firma" }
  ];

  // Computadas
  const totalPages = computed(() => Math.ceil(totalSolicitudes.value / pageSize.value));
  const hasNext = computed(() => currentPage.value < totalPages.value);
  const hasPrevious = computed(() => currentPage.value > 1);

  // Cargar solicitudes con proceso de firma
  const cargarSolicitudes = async () => {
    loading.value = true;
    error.value = null;

    try {
      await ready;

      const skip = (currentPage.value - 1) * pageSize.value;
      const limit = pageSize.value;
      const estado = estadoFiltro.value;

      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString()
      });

      if (estado && estado !== "@") {
        params.append("estado", estado);
      }

      const response = await getJson<{
        success: boolean;
        data: {
          collection: SolicitudConFirma[];
          pagination: {
            total: number;
          };
        };
        message: string;
      }>(`/api/admin/firmas?${params.toString()}`, {
        auth: true
      });

      if (response.success && response.data) {
        solicitudes.value = response.data.collection;
        totalSolicitudes.value = response.data.pagination?.total || 0;
      } else {
        throw new Error(response.message || "Error al cargar solicitudes");
      }
    } catch (e: unknown) {
      console.error("Error al cargar solicitudes:", e);
      const message = e instanceof Error ? e.message : String(e);
      error.value = message || "Error al cargar las solicitudes";
      solicitudes.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Consultar estado actualizado de una solicitud específica
  const consultarEstado = async (solicitudId: string) => {
    try {
      await ready;

      const response = await getJson<{
        success: boolean;
        data: EstadoFirmadoResponse;
        message: string;
      }>(`/api/admin/solicitudes/${solicitudId}/estado-firmado`, {
        auth: true
      });

      if (response.success) {
        const solicitud = solicitudes.value.find((s) => s.numero_solicitud === solicitudId);
        if (solicitud) {
          const { solicitud_id: _id, estado_solicitud, ...proceso } = response.data;
          solicitud.proceso_firmado = proceso;
          solicitud.estado = estado_solicitud;
        }

        return {
          success: true,
          message: response.message || "Estado actualizado",
          data: response.data
        };
      } else {
        throw new Error(response.message || "Error al consultar estado");
      }
    } catch (e: unknown) {
      console.error("Error al consultar estado:", e);
      const message = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        message: message || "Error al consultar el estado"
      };
    }
  };

  // Refrescar estado de todas las solicitudes visibles
  const refrescarTodos = async () => {
    const promises = solicitudes.value.map((s) => consultarEstado(s.numero_solicitud));
    await Promise.all(promises);
  };

  // Paginación
  const irAPagina = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      cargarSolicitudes();
    }
  };

  const siguientePagina = () => {
    if (hasNext.value) {
      irAPagina(currentPage.value + 1);
    }
  };

  const paginaAnterior = () => {
    if (hasPrevious.value) {
      irAPagina(currentPage.value - 1);
    }
  };

  // Cambiar filtro de estado
  const cambiarFiltroEstado = (nuevoEstado: string) => {
    estadoFiltro.value = nuevoEstado;
    currentPage.value = 1;
    cargarSolicitudes();
  };

  // Navegar a detalles
  const verDetalles = (solicitudId: string) => {
    router.push(`/admin/solicitudes/show/${solicitudId}`);
  };

  // Formateo de fechas
  const formatearFecha = (fecha: string | Date | null | undefined): string => {
    if (!fecha) return "-";
    const date = typeof fecha === "string" ? new Date(fecha) : fecha;
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  // Estados del proceso en KIAI (proceso_firmado.estado)
  const getEstadoLabel = getEstadoFirmaLabel;
  const getEstadoIcon = getEstadoFirmaIcon;
  const getEstadoBadgeColor = getEstadoFirmaBadgeColor;

  const getEstadoColor = (estado: string): string => {
    const colores: Record<string, string> = {
      IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-300",
      COMPLETED: "bg-green-100 text-green-800 border-green-300",
      DECLINED: "bg-red-100 text-red-800 border-red-300",
      EXPIRED: "bg-gray-100 text-gray-800 border-gray-300",
      CANCELLED: "bg-gray-100 text-gray-800 border-gray-300"
    };
    return colores[estado] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const cargarConvenio = async () => {
    try {
      const response = await getJson<{
        success: boolean;
        data: EmpresaConvenio | null;
        message: string;
      }>("/api/convenios/activo", {
        auth: true
      });

      if (response.success) {
        convenioActivo.value = response.data;
      } else {
        throw new Error(response.message || "Error al cargar convenio activo");
      }
    } catch (e: unknown) {
      console.error("Error al cargar convenio activo:", e);
      const message = e instanceof Error ? e.message : String(e);
      error.value = message || "Error al cargar convenio activo";
      convenioActivo.value = null;
    }
  };

  return {
    // Estado
    solicitudes,
    loading,
    error,
    totalSolicitudes,
    currentPage,
    pageSize,
    estadoFiltro,
    estadosDisponibles,
    convenioActivo,

    // Computadas
    totalPages,
    hasNext,
    hasPrevious,

    // Funciones
    cargarSolicitudes,
    cargarConvenio,
    consultarEstado,
    refrescarTodos,
    irAPagina,
    siguientePagina,
    paginaAnterior,
    cambiarFiltroEstado,
    verDetalles,
    formatearFecha,
    getEstadoLabel,
    getEstadoColor,
    getEstadoIcon,
    getEstadoBadgeColor
  };
}
