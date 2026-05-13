import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

interface ProcesoFirmado {
  transaccion_id: string;
  estado: string;
  fecha_inicio: string;
  proveedor: string;
  urls_firma?: Record<string, string>;
  firmantes_completados: number;
  firmantes_pendientes: number;
  fecha_completado?: string;
}

interface SolicitudConFirma extends SolicitudCredito {
  proceso_firmado?: ProcesoFirmado;
}

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

  // Estados disponibles para filtrar
  const estadosDisponibles = [
    { value: "PENDIENTE_FIRMADO", label: "Pendiente de Firmar" },
    { value: "FIRMADO", label: "Firmado" },
    { value: "RECHAZADO", label: "Rechazado" },
    { value: "EXPIRADO", label: "Expirado" },
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
      }>(`/api/admin/solicitudes?${params.toString()}`, {
        auth: true
      });

      if (response.success && response.data) {
        // Filtrar solo las que tienen firmantes
        solicitudes.value = response.data.collection.filter(
          (s) => s.firmantes && s.firmantes.length > 0
        );
        totalSolicitudes.value = response.data.pagination?.total || 0;
      } else {
        throw new Error(response.message || "Error al cargar solicitudes");
      }
    } catch (e: any) {
      console.error("Error al cargar solicitudes:", e);
      error.value = e.message || "Error al cargar las solicitudes";
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
        data: {
          solicitud_id: string;
          transaccion_id: string;
          estado: string;
          firmantes_completados: number;
          firmantes_pendientes: number;
        };
        message: string;
      }>(`/api/admin/solicitudes/${solicitudId}/estado-firmado`, {
        auth: true
      });

      if (response.success) {
        // Actualizar localmente
        const index = solicitudes.value.findIndex((s) => s.numero_solicitud === solicitudId);
        if (index !== -1 && solicitudes.value[index]) {
          const solicitud = solicitudes.value[index];
          if (solicitud?.proceso_firmado) {
            solicitud.proceso_firmado.estado = response.data.estado;
            solicitud.proceso_firmado.firmantes_completados = response.data.firmantes_completados;
            solicitud.proceso_firmado.firmantes_pendientes = response.data.firmantes_pendientes;
          }
        }

        return {
          success: true,
          message: response.message || "Estado actualizado",
          data: response.data
        };
      } else {
        throw new Error(response.message || "Error al consultar estado");
      }
    } catch (e: any) {
      console.error("Error al consultar estado:", e);
      return {
        success: false,
        message: e.message || "Error al consultar el estado"
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
  const formatearFecha = (fecha: string | Date | undefined): string => {
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

  // Obtener badge color por estado
  const getEstadoColor = (estado: string): string => {
    const colores: Record<string, string> = {
      PENDIENTE_FIRMADO: "bg-yellow-100 text-yellow-800 border-yellow-300",
      FIRMADO: "bg-green-100 text-green-800 border-green-300",
      RECHAZADO: "bg-red-100 text-red-800 border-red-300",
      EXPIRADO: "bg-gray-100 text-gray-800 border-gray-300"
    };
    return colores[estado] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  // Obtener icono por estado
  const getEstadoIcon = (estado: string): string => {
    const iconos: Record<string, string> = {
      PENDIENTE_FIRMADO: "lucide:clock",
      FIRMADO: "lucide:check-circle",
      RECHAZADO: "lucide:x-circle",
      EXPIRADO: "lucide:alert-circle"
    };
    return iconos[estado] || "lucide:help-circle";
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
    } catch (e: any) {
      console.error("Error al cargar convenio activo:", e);
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
    getEstadoColor,
    getEstadoIcon
  };
}
