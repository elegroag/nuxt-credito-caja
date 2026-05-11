import { ref, computed, onUnmounted } from "vue";
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
  webhook_recibido_at?: string;
}

interface SolicitudConFirma extends SolicitudCredito {
  proceso_firmado?: ProcesoFirmado;
}

interface EstadisticasFirmas {
  total: number;
  pendientes: number;
  firmados: number;
  rechazados: number;
  expirados: number;
  porcentajeCompletado: number;
}

export function useMonitoreoFirmasRealTime() {
  const router = useRouter();
  const { getJson } = useApi();
  const { ready } = useSession();

  const convenioActivo = ref<ConvenioActivo | null>(null);
  const solicitudes = ref<SolicitudConFirma[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalSolicitudes = ref(0);
  const ultimaActualizacion = ref<Date | null>(null);

  // Polling en tiempo real
  const pollingEnabled = ref(true);
  const pollingInterval = ref(30000); // 30 segundos
  let pollingTimer: NodeJS.Timeout | null = null;

  // Notificaciones de cambios
  const cambiosRecientes = ref<
    Array<{
      solicitudId: string;
      nombreSolicitante: string;
      estadoAnterior: string;
      estadoNuevo: string;
      timestamp: Date;
    }>
  >([]);

  // Paginación
  const currentPage = ref(1);
  const pageSize = ref(20);
  const estadoFiltro = ref<string>("PENDIENTE_FIRMADO");

  // Estados disponibles
  const estadosDisponibles = [
    {
      value: "PENDIENTE_FIRMADO",
      label: "Pendiente de Firmar",
      icon: "lucide:clock",
      color: "yellow",
    },
    {
      value: "FIRMADO",
      label: "Firmado",
      icon: "lucide:check-circle",
      color: "green",
    },
    {
      value: "RECHAZADO",
      label: "Rechazado",
      icon: "lucide:x-circle",
      color: "red",
    },
    {
      value: "EXPIRADO",
      label: "Expirado",
      icon: "lucide:alert-circle",
      color: "gray",
    },
    {
      value: "CANCELADO",
      label: "Cancelado",
      icon: "lucide:ban",
      color: "orange",
    },
    { value: "@", label: "Todos", icon: "lucide:list", color: "blue" },
  ];

  // Computadas
  const totalPages = computed(() =>
    Math.ceil(totalSolicitudes.value / pageSize.value),
  );
  const hasNext = computed(() => currentPage.value < totalPages.value);
  const hasPrevious = computed(() => currentPage.value > 1);

  // Estadísticas calculadas
  const estadisticas = computed<EstadisticasFirmas>(() => {
    const total = solicitudes.value.length;
    const pendientes = solicitudes.value.filter(
      (s) => s.proceso_firmado?.estado === "PENDIENTE_FIRMADO",
    ).length;
    const firmados = solicitudes.value.filter(
      (s) => s.proceso_firmado?.estado === "FIRMADO",
    ).length;
    const rechazados = solicitudes.value.filter(
      (s) => s.proceso_firmado?.estado === "RECHAZADO",
    ).length;
    const expirados = solicitudes.value.filter(
      (s) => s.proceso_firmado?.estado === "EXPIRADO",
    ).length;
    const porcentajeCompletado =
      total > 0 ? Math.round((firmados / total) * 100) : 0;

    return {
      total,
      pendientes,
      firmados,
      rechazados,
      expirados,
      porcentajeCompletado,
    };
  });

  // Cargar solicitudes
  const cargarSolicitudes = async (silencioso = false) => {
    if (!silencioso) {
      loading.value = true;
    }
    error.value = null;

    try {
      await ready;

      const skip = (currentPage.value - 1) * pageSize.value;
      const limit = pageSize.value;
      const estado = estadoFiltro.value;

      const response = await getJson<{
        success: boolean;
        data: {
          solicitudes: SolicitudConFirma[];
          total: number;
          skip: number;
          limit: number;
        };
        message: string;
      }>(
        `/api/admin/solicitudes?limit=${limit}&skip=${skip}${estado !== "all" ? `&estado=${estado}` : ""}`,
        {
          auth: true,
        },
      );

      if (response.success && response.data) {
        const solicitudesAnteriores = new Map(
          solicitudes.value.map((s) => [
            s.numero_solicitud,
            s.proceso_firmado?.estado,
          ]),
        );

        // Filtrar solo las que tienen proceso_firmado
        const nuevasSolicitudes = response.data.solicitudes.filter(
          (s) => s.proceso_firmado && s.proceso_firmado.transaccion_id,
        );

        // Detectar cambios de estado
        nuevasSolicitudes.forEach((solicitud) => {
          const estadoAnterior = solicitudesAnteriores.get(
            solicitud.numero_solicitud,
          );
          const estadoNuevo = solicitud.proceso_firmado?.estado;

          if (estadoAnterior && estadoNuevo && estadoAnterior !== estadoNuevo) {
            cambiosRecientes.value.unshift({
              solicitudId: solicitud.numero_solicitud,
              nombreSolicitante:
                solicitud.solicitante?.nombres_apellidos || "Sin nombre",
              estadoAnterior,
              estadoNuevo,
              timestamp: new Date(),
            });

            // Mantener solo los últimos 10 cambios
            if (cambiosRecientes.value.length > 10) {
              cambiosRecientes.value.pop();
            }
          }
        });

        solicitudes.value = nuevasSolicitudes;
        totalSolicitudes.value = response.data.total;
        ultimaActualizacion.value = new Date();
      } else {
        throw new Error(response.message || "Error al cargar solicitudes");
      }
    } catch (e: any) {
      console.error("Error al cargar solicitudes:", e);
      if (!silencioso) {
        error.value = e.message || "Error al cargar las solicitudes";
      }
      solicitudes.value = [];
    } finally {
      if (!silencioso) {
        loading.value = false;
      }
    }
  };

  // Consultar estado de una solicitud específica
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
      }>(`/api/solicitudes/${solicitudId}/estado-firmado`, { auth: true });

      if (response.success) {
        const index = solicitudes.value.findIndex(
          (s) => s.numero_solicitud === solicitudId,
        );
        if (index !== -1 && solicitudes.value[index]) {
          const solicitud = solicitudes.value[index];
          const estadoAnterior = solicitud?.proceso_firmado?.estado;

          if (solicitud?.proceso_firmado) {
            solicitud.proceso_firmado.estado = response.data.estado;
            solicitud.proceso_firmado.firmantes_completados =
              response.data.firmantes_completados;
            solicitud.proceso_firmado.firmantes_pendientes =
              response.data.firmantes_pendientes;

            // Registrar cambio si hubo
            if (estadoAnterior && estadoAnterior !== response.data.estado) {
              cambiosRecientes.value.unshift({
                solicitudId: solicitud.numero_solicitud,
                nombreSolicitante:
                  solicitud.solicitante?.nombres_apellidos || "Sin nombre",
                estadoAnterior,
                estadoNuevo: response.data.estado,
                timestamp: new Date(),
              });

              if (cambiosRecientes.value.length > 10) {
                cambiosRecientes.value.pop();
              }
            }
          }
        }

        return {
          success: true,
          message: response.message || "Estado actualizado",
          data: response.data,
        };
      } else {
        throw new Error(response.message || "Error al consultar estado");
      }
    } catch (e: any) {
      console.error("Error al consultar estado:", e);
      return {
        success: false,
        message: e.message || "Error al consultar el estado",
      };
    }
  };

  // Refrescar todas las solicitudes visibles
  const refrescarTodos = async () => {
    const promises = solicitudes.value.map((s) =>
      consultarEstado(s.numero_solicitud),
    );
    await Promise.all(promises);
  };

  // Iniciar polling automático
  const iniciarPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }

    pollingEnabled.value = true;
    pollingTimer = setInterval(() => {
      if (pollingEnabled.value) {
        cargarSolicitudes(true); // Silencioso para no mostrar loading
      }
    }, pollingInterval.value);
  };

  // Detener polling
  const detenerPolling = () => {
    pollingEnabled.value = false;
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  // Toggle polling
  const togglePolling = () => {
    if (pollingEnabled.value) {
      detenerPolling();
    } else {
      iniciarPolling();
    }
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

  // Cambiar filtro
  const cambiarFiltroEstado = (nuevoEstado: string) => {
    estadoFiltro.value = nuevoEstado;
    currentPage.value = 1;
    cargarSolicitudes();
  };

  // Navegar a detalles
  const verDetalles = (solicitudId: string) => {
    router.push(`/admin/solicitudes/show/${solicitudId}`);
  };

  // Formateo
  const formatearFecha = (fecha: string | Date | undefined): string => {
    if (!fecha) return "-";
    const date = typeof fecha === "string" ? new Date(fecha) : fecha;
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatearFechaRelativa = (fecha: Date): string => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);

    if (segundos < 60) return "Hace unos segundos";
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
    return formatearFecha(fecha);
  };

  // Colores e iconos
  const getEstadoColor = (estado: string): string => {
    const colores: Record<string, string> = {
      PENDIENTE_FIRMADO: "bg-yellow-100 text-yellow-800 border-yellow-300",
      FIRMADO: "bg-green-100 text-green-800 border-green-300",
      RECHAZADO: "bg-red-100 text-red-800 border-red-300",
      EXPIRADO: "bg-gray-100 text-gray-800 border-gray-300",
      CANCELADO: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return colores[estado] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getEstadoIcon = (estado: string): string => {
    const iconos: Record<string, string> = {
      PENDIENTE_FIRMADO: "lucide:clock",
      FIRMADO: "lucide:check-circle",
      RECHAZADO: "lucide:x-circle",
      EXPIRADO: "lucide:alert-circle",
      CANCELADO: "lucide:ban",
    };
    return iconos[estado] || "lucide:help-circle";
  };

  const cargarConvenio = async () => {
    try {
      const response = await getJson<{
        success: boolean;
        data: EmpresaConvenio | null;
        message: string;
      }>(`/api/convenios/activo`, {
        auth: true,
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

  // Limpiar al desmontar
  onUnmounted(() => {
    detenerPolling();
  });

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
    ultimaActualizacion,
    pollingEnabled,
    pollingInterval,
    cambiosRecientes,
    convenioActivo,

    // Computadas
    totalPages,
    hasNext,
    hasPrevious,
    estadisticas,

    // Funciones
    cargarSolicitudes,
    consultarEstado,
    refrescarTodos,
    irAPagina,
    siguientePagina,
    paginaAnterior,
    cambiarFiltroEstado,
    verDetalles,
    formatearFecha,
    formatearFechaRelativa,
    getEstadoColor,
    getEstadoIcon,
    iniciarPolling,
    detenerPolling,
    togglePolling,
    cargarConvenio,
  };
}
