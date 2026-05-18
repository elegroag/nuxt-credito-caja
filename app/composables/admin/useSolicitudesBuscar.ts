/**
 * Composable para la página de búsqueda de solicitudes.
 * Encapsula la lógica de filtros y estado de carga.
 */
import { computed, onMounted, ref } from "vue";
import type { FiltrosSolicitudes, UseSolicitudesBuscar, SolicitudAdmin } from "~~/shared/types/admin-solicitudes";

export const useSolicitudesBuscar = (props: {
  filtrosActivos: FiltrosSolicitudes
}): UseSolicitudesBuscar => {
  const { getJson } = useApi();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const solicitudesCache = ref<SolicitudAdmin[]>([]);
  const totalItems = ref(0);

  // Opciones para filtros
  const _opcionesFiltro = ref<OpcionesFiltro>({
    estados: [],
    usuarios: []
  });

  // Computed properties
  const tieneFiltrosActivos = computed(() => {
    const f = props.filtrosActivos;
    return !!(
      f.numero_documento
      || f.nombre_usuario
      || f.owner_username
      || f.numero_solicitud
      || (f.estados && f.estados.length > 0)
    );
  });

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
   * Carga todas las solicitudes sin paginación (para exportar, etc.)
   */
  const cargarSolicitudesFilter = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const payload = props.filtrosActivos;
      const params = new URLSearchParams();
      if (payload?.limit) params.set("limit", String(payload.limit));
      if (payload?.skip) params.set("skip", String(payload.skip));
      if (payload?.estados && payload.estados.length > 0) {
        const firstEstado = payload.estados[0];
        if (firstEstado) params.set("estado", firstEstado);
      }
      const response = await getJson<unknown>(
        `/api/admin/solicitudes?${params.toString()}`,
        { auth: true }
      );
      const data = handleApiResponse(response as { success?: boolean; data?: unknown; message?: string }, []);
      solicitudesCache.value = Array.isArray(data) ? data : [];
      totalItems.value = solicitudesCache.value.length;
    } catch (err) {
      console.error("Error cargando todas las solicitudes:", err);
      error.value = "Error al cargar las solicitudes";
      solicitudesCache.value = [];
      totalItems.value = 0;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Aplica filtros y recarga los datos
   */
  const aplicarFiltros = (nuevosFiltros: Partial<FiltrosSolicitudes>) => {
    props.filtrosActivos = {
      ...props.filtrosActivos,
      ...nuevosFiltros,
      skip: 0
    };
    cargarSolicitudesFilter();
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    props.filtrosActivos = {
      skip: 0,
      limit: 20
    };
    cargarSolicitudesFilter();
  };

  const solicitudes = computed(() => {
    return solicitudesCache.value;
  });

  onMounted(() => {
    cargarSolicitudesFilter();
  });

  return {
    loading,
    error,
    solicitudes,
    totalItems,
    tieneFiltrosActivos,
    aplicarFiltros,
    limpiarFiltros
  };
};
