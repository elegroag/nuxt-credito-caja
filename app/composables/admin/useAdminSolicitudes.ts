/**
 * Composable para administración de solicitudes
 * Maneja la lógica de filtros, paginación y operaciones CRUD
 */
import type { SolicitudAdmin, FiltrosSolicitudes, EstadosCount, OpcionesFiltro } from "~~/shared/types/admin-solicitudes";
import { formatCurrency, formatDate } from "#shared/utils/formatters";

export const useAdminSolicitudes = () => {
  const { getJson, putJson, deleteJson } = useApi();

  // Estado reactivo
  const solicitudes = ref<SolicitudAdmin[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalItems = ref(0);

  // Filtros activos
  const filtrosActivos = ref<FiltrosSolicitudes>({
    skip: 0,
    limit: 20
  });

  // Opciones para filtros
  const opcionesFiltro = ref<OpcionesFiltro>({
    estados: [],
    usuarios: []
  });

  // Conteo por estados
  const estadosCount = ref<EstadosCount>({});

  // Estados disponibles desde la API
  const estadosDisponibles = ref<EstadoSolicitudData[]>([]);
  const loadingEstados = ref(false);

  // Estado para el modal de cambio de estado
  const showEstadoModal = ref(false);
  const solicitudSeleccionada = ref<SolicitudAdmin | null>(null);
  const nuevoEstado = ref("");
  const estadoDescripcion = ref("");
  const loadingEstado = ref(false);

  /**
   * Maneja la respuesta del backend de forma estandarizada
   */
  const handleApiResponse = (
    response: { success?: boolean; data?: unknown; message?: string },
    defaultValue: unknown = null
  ): unknown => {
    if (response && response.success) {
      return response.data || defaultValue;
    } else {
      throw new Error(
        response?.message || "Error en la respuesta del servidor"
      );
    }
  };
  /**
   * Carga las solicitudes con los filtros aplicados
   */
  const cargarSolicitudes = async () => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({
        limit: (filtrosActivos.value.limit || 20).toString(),
        skip: (filtrosActivos.value.skip || 0).toString()
      });

      // Agregar estado a la URL solo si está definido
      const estado = filtrosActivos.value.estados?.[0];
      if (estado) {
        params.append("estado", estado);
      }

      const response = await getJson<SolicitudesResponse>(
        `/api/admin/solicitudes?${params.toString()}`,
        { auth: true }
      );

      // Usar el manejador de respuestas estandarizado
      const data = handleApiResponse(response, {
        collection: [] as SolicitudAdmin[],
        pagination: { total: 0 }
      }) as { collection?: SolicitudAdmin[], pagination?: { total?: number } };
      solicitudes.value = data.collection || [];
      totalItems.value = data.pagination?.total || 0;
    } catch (err) {
      console.error("Error cargando solicitudes:", err);
      error.value = "Error al cargar las solicitudes";
    } finally {
      loading.value = false;
    }
  };

  /**
   * Carga los estados disponibles desde la API
   */
  const cargarEstadosDisponibles = async () => {
    loadingEstados.value = true;
    try {
      const response = await getJson<{ data: EstadoSolicitudData[] }>(
        "/api/solicitudes/estados-solicitud",
        { auth: true }
      );
      const data = handleApiResponse(response, []);
      estadosDisponibles.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error cargando estados disponibles:", err);
    } finally {
      loadingEstados.value = false;
    }
  };

  /**
   * Carga el conteo de solicitudes por estado
   */
  const cargarEstadosCount = async () => {
    try {
      const response = await getJson<{ data: EstadosCount }>(
        "/api/admin/solicitudes/estados-count",
        { auth: true }
      );
      const conteo = handleApiResponse(response, {} as EstadosCount) as EstadosCount;

      // Si ya tenemos los estados disponibles, combinamos con el conteo
      if (estadosDisponibles.value.length > 0) {
        const conteoCompleto: EstadosCount = {};
        estadosDisponibles.value.forEach((estado) => {
          // Buscar el conteo por ID o por nombre
          const countPorId = conteo[estado.id] || 0;
          const countPorNombre = conteo[estado.nombre] || 0;
          conteoCompleto[estado.nombre] = countPorId || countPorNombre || 0;
        });
        estadosCount.value = conteoCompleto;
      } else {
        estadosCount.value = conteo as EstadosCount;
      }
    } catch (err) {
      console.error("Error cargando conteo por estados:", err);
    }
  };

  /**
   * Cambia la página
   */
  const cambiarPagina = (pagina: number) => {
    if (pagina < 1) return;
    if (pagina > totalPaginas.value) return;
    const skip = (pagina - 1) * (filtrosActivos.value.limit || 20);
    filtrosActivos.value.skip = skip;
    cargarSolicitudes();
  };

  /**
   * Cambia el límite de resultados por página
   */
  const cambiarLimite = (limite: number) => {
    filtrosActivos.value.limit = limite;
    filtrosActivos.value.skip = 0;
    cargarSolicitudes();
  };

  /**
   * Actualiza el estado de una solicitud
   */
  const actualizarEstado = async (
    solicitudId: string,
    estado: string,
    descripcion?: string
  ) => {
    try {
      const response = await putJson<{ data: SolicitudAdmin }>(
        `/api/admin/solicitudes/${solicitudId}/estado`,
        { estado, descripcion },
        { auth: true }
      );

      // Recargar los datos
      await cargarSolicitudes();
      await cargarEstadosCount();
      return handleApiResponse(response, null) as SolicitudAdmin;
    } catch (err) {
      console.error("Error actualizando estado:", err);
      throw new Error("Error al actualizar el estado de la solicitud");
    }
  };

  /**
   * Obtiene una solicitud específica
   */
  const obtenerSolicitud = async (
    solicitudId: string
  ): Promise<SolicitudAdmin> => {
    try {
      const response = await getJson<{ data: SolicitudAdmin }>(
        `/api/admin/solicitudes/${solicitudId}`,
        { auth: true }
      );
      return handleApiResponse(response, null) as SolicitudAdmin;
    } catch (err) {
      console.error("Error obteniendo solicitud:", err);
      throw new Error("Error al obtener la solicitud");
    }
  };

  /**
   * Elimina una solicitud
   */
  const eliminarSolicitud = async (solicitudId: string) => {
    try {
      await deleteJson(`/api/solicitudes/${solicitudId}`, {
        auth: true
      });

      // Recargar los datos
      await cargarSolicitudes();
      await cargarEstadosCount();
    } catch (err) {
      console.error("Error eliminando solicitud:", err);
      throw new Error("Error al eliminar la solicitud");
    }
  };

  /**
   * Exporta las solicitudes a CSV
   */
  const exportarCSV = () => {
    if (solicitudes.value.length === 0) {
      return;
    }

    const headers = [
      "Número de Solicitud",
      "Fecha de Creación",
      "Estado",
      "Valor Solicitado",
      "Plazo (Meses)",
      "Nombre Completo",
      "Tipo de Documento",
      "Número de Documento",
      "Email",
      "Teléfono"
    ];

    const rows = solicitudes.value.map((s) => {
      const solicitante = s.solicitante;
      return [
        s.numero_solicitud || "",
        formatDate(s.created_at),
        s.estado || "",
        s.valor_solicitud ? formatCurrency(s.valor_solicitud) : "",
        s.plazo_meses?.toString() || "",
        solicitante ? `${solicitante.nombres} ${solicitante.apellidos}` : "",
        solicitante?.tipo_documento || "",
        solicitante?.numero_documento || "",
        solicitante?.email || "",
        solicitante?.telefono_movil || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(",")
      )
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solicitudes_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Recarga todos los datos
   */
  const recargarDatos = () => {
    cargarEstadosDisponibles();
    cargarEstadosCount();
    cargarSolicitudes();
  };

  /**
   * Abre el modal para cambiar estado
   */
  const cambiarEstado = (solicitud: SolicitudAdmin) => {
    solicitudSeleccionada.value = solicitud;
    nuevoEstado.value = solicitud.estado;
    estadoDescripcion.value = "";
    showEstadoModal.value = true;
  };

  /**
   * Cierra el modal de cambio de estado
   */
  const cerrarEstadoModal = () => {
    showEstadoModal.value = false;
    solicitudSeleccionada.value = null;
    nuevoEstado.value = "";
    estadoDescripcion.value = "";
  };

  /**
   * Confirma el cambio de estado
   */
  const confirmarCambioEstado = async () => {
    if (!solicitudSeleccionada.value || !nuevoEstado.value) return;

    loadingEstado.value = true;

    try {
      const solicitudNumero = solicitudSeleccionada.value.numero_solicitud;
      if (!solicitudNumero) {
        throw new Error("No se encontró el número de solicitud");
      }

      await actualizarEstado(
        solicitudNumero,
        nuevoEstado.value,
        estadoDescripcion.value || undefined
      );

      cerrarEstadoModal();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    } finally {
      loadingEstado.value = false;
    }
  };

  /**
   * Elimina una solicitud con confirmación
   */
  const eliminarSolicitudConfirm = (solicitud: SolicitudAdmin) => {
    if (
      confirm(
        `¿Estás seguro de eliminar la solicitud ${solicitud.numero_solicitud}?`
      )
    ) {
      eliminarSolicitud(solicitud.numero_solicitud!);
    }
  };
// Computed properties
  const tieneFiltrosActivos = computed(() => {
    const f = filtrosActivos.value;
    return !!(
      f.numero_documento
      || f.nombre_usuario
      || f.owner_username
      || f.numero_solicitud
      || (f.estados && f.estados.length > 0)
    );
  });

  const totalPaginas = computed(() => {
    const limite = filtrosActivos.value.limit || 20;
    const total = Math.ceil(totalItems.value / limite);
    return totalItems.value > 0 ? Math.max(1, total) : 1;
  });

  const paginaActual = computed(() => {
    const skip = filtrosActivos.value.skip || 0;
    const limite = filtrosActivos.value.limit || 20;
    return Math.floor(skip / limite) + 1;
  });

  const tieneSiguientePagina = computed(() => {
    return paginaActual.value < totalPaginas.value;
  });

  const tienePaginaAnterior = computed(() => {
    return paginaActual.value > 1;
  });

  /**
   * Calcula el total de solicitudes
   */
  const getTotalSolicitudes = computed(() => {
    return Object.values(estadosCount.value).reduce(
      (total, count) => total + count,
      0
    );
  });

  /**
   * Calcula el porcentaje de un estado
   */
  const getEstadoPercentage = (count: number): string => {
    const total = getTotalSolicitudes.value;
    if (total === 0) return "0";
    return ((count / total) * 100).toFixed(1);
  };

  /**
   * Aplica filtros y recarga los datos
   */
  const aplicarFiltroPaginacion = (
    nuevosFiltros: Partial<FiltrosSolicitudes>
  ) => {
    filtrosActivos.value = {
      ...filtrosActivos.value,
      ...nuevosFiltros,
      skip: 0
    };
    cargarSolicitudes();
  };

  /**
   * Filtra solicitudes por estado
   */
  const filtrarPorEstado = (estado: string) => {
    // Buscar el estado por nombre para obtener su ID
    const estadoData = estadosDisponibles.value.find(
      e => e.nombre === estado
    );
    const estadoId = estadoData?.id || estado;

    // Aplicar filtro por estado específico usando el ID del estado
    aplicarFiltroPaginacion({
      estados: [estadoId],
      skip: 0 // Reiniciar paginación
    });
  };

  /**
   * Limpia el filtro por estado
   */
  const limpiarFiltroEstado = () => {
    aplicarFiltroPaginacion({
      estados: [],
      skip: 0
    });
  };

  // Cargar datos iniciales
  onMounted(async () => {
    await cargarEstadosDisponibles();
    await cargarEstadosCount();
    cargarSolicitudes();
  });

  return {
    // Estado
    solicitudes,
    loading,
    error,
    totalItems,
    filtrosActivos,
    opcionesFiltro,
    estadosCount,
    estadosDisponibles,
    loadingEstados,
    showEstadoModal,
    solicitudSeleccionada,
    nuevoEstado,
    estadoDescripcion,
    loadingEstado,

    // Computed
    tieneFiltrosActivos,
    totalPaginas,
    paginaActual,
    tieneSiguientePagina,
    tienePaginaAnterior,
    getTotalSolicitudes,
    getEstadoPercentage,

    // Métodos
    cargarSolicitudes,
    cargarEstadosCount,
    cargarEstadosDisponibles,
    cambiarPagina,
    cambiarLimite,
    actualizarEstado,
    obtenerSolicitud,
    eliminarSolicitud,
    exportarCSV,
    aplicarFiltroPaginacion,
    recargarDatos,
    cambiarEstado,
    cerrarEstadoModal,
    confirmarCambioEstado,
    eliminarSolicitudConfirm,
    filtrarPorEstado,
    limpiarFiltroEstado
  };
};
