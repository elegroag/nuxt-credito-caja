import { ref, computed } from "vue";
import { useApi } from "~/composables/useApi";

export function useParametrosDetalles() {
  const { getJson } = useApi();

  // Estado reactivo
  const loading = ref(false);
  const error = ref("");
  const parametrosCache = ref<ParametrosDetalles | null>(null);

  // Función para cargar todos los parámetros usando el endpoint existente
  const cargarParametros = async () => {
    if (parametrosCache.value) {
      return parametrosCache.value;
    }

    loading.value = true;
    error.value = "";

    try {
      // Cargar parámetros principales y estados en paralelo
      const [parametrosRes, estadosRes] = await Promise.all([
        getJson<ParametrosResponse>("/api/lineas_credito/parametros", {
          auth: true
        }),
        getJson<{ data: EstadoSolicitudData[] }>("/api/solicitudes/estados-solicitud", {
          auth: true
        })
      ]);

      // Extraer datos de la respuesta existente
      const datosParametros = parametrosRes.data;

      // Mapear a la estructura esperada usando los nombres reales de la API
      parametrosCache.value = {
        tipos_identificacion: [...(datosParametros.codigos_tipo_documento || [])],
        ciudades: [],
        cargos: [...(datosParametros.ocupaciones || [])],
        tipos_vivienda: [...(datosParametros.tipo_vivienda || [])],
        tipos_contrato: [...(datosParametros.tipo_contrato || [])],
        estados_solicitud: estadosRes.data || []
      };

      return parametrosCache.value;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Error cargando parámetros de detalles";
      error.value = errorMessage;
      console.error("Error en useParametrosDetalles:", errorMessage, e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Funciones de búsqueda optimizadas
  const getTipoIdentificacion = computed(() => {
    const tipos = parametrosCache.value?.tipos_identificacion || [];
    return new Map(tipos.map((tipo) => [tipo.coddoc, tipo.detdoc]));
  });

  const getCiudadDescripcion = computed(() => {
    const ciudades = parametrosCache.value?.ciudades || [];
    return new Map(ciudades.map((ciudad) => [ciudad.codciu, ciudad.detciu]));
  });

  const getCargoDescripcion = computed(() => {
    const cargos = parametrosCache.value?.cargos || [];
    return new Map(cargos.map((cargo) => [cargo.codocu, cargo.detalle]));
  });

  const getTipoVivienda = computed(() => {
    const tipos = parametrosCache.value?.tipos_vivienda || [];
    return new Map(tipos.map((tipo) => [tipo.vivienda, tipo.detalle]));
  });

  const getTipoContrato = computed(() => {
    const tipos = parametrosCache.value?.tipos_contrato || [];
    return new Map(tipos.map((tipo) => [tipo.tipcon, tipo.detalle]));
  });

  // Funciones para estados
  const getEstadoData = computed(() => {
    const estados = parametrosCache.value?.estados_solicitud || [];
    return new Map(estados.map((estado) => [estado.id, estado]));
  });

  const getEstadoColor = (estadoId: string): string => {
    const estado = getEstadoData.value.get(estadoId);
    return estado?.color || "#6B7280";
  };

  const getEstadoNombre = (estadoId: string): string => {
    const estado = getEstadoData.value.get(estadoId);
    return estado?.nombre || estadoId;
  };

  const getEstadoBadgeClass = (estadoId: string): string => {
    const color = getEstadoColor(estadoId);
    // Convertir color hex a clases Tailwind
    const colorMap: Record<string, string> = {
      "#6B7280": "bg-gray-100 text-gray-700",
      "#3B82F6": "bg-blue-100 text-blue-700",
      "#F59E0B": "bg-amber-100 text-amber-700",
      "#10B981": "bg-emerald-100 text-emerald-700",
      "#EF4444": "bg-red-100 text-red-700",
      "#8B5CF6": "bg-purple-100 text-purple-700",
      "#F97316": "bg-orange-100 text-orange-700"
    };
    return colorMap[color] || "bg-gray-100 text-gray-700";
  };

  // Flujo de aprobación dinámico
  const flujoAprobacion = computed(() => {
    const estados = parametrosCache.value?.estados_solicitud || [];
    return estados
      .filter((estado) => estado.activo)
      .sort((a, b) => a.orden - b.orden)
      .map((estado) => estado.id);
  });

  const estadoProgressPercent = (estadoId: string): number => {
    const estados = flujoAprobacion.value;
    const index = estados.indexOf(estadoId);
    return index >= 0 && estados.length > 0 ? ((index + 1) / estados.length) * 100 : 0;
  };

  // Funciones helper para búsquedas directas
  const buscarTipoIdentificacion = (id: string): string => {
    return getTipoIdentificacion.value.get(id) || id;
  };

  const buscarCiudad = (codigo: string): string => {
    return getCiudadDescripcion.value.get(codigo) || codigo;
  };

  const buscarCargo = (codigo: string): string => {
    return getCargoDescripcion.value.get(codigo) || codigo;
  };

  const buscarTipoVivienda = (id: string): string => {
    return getTipoVivienda.value.get(id) || id;
  };

  const buscarTipoContrato = (id: string): string => {
    return getTipoContrato.value.get(id) || id;
  };

  // Resetear caché
  const resetCache = () => {
    parametrosCache.value = null;
    error.value = "";
  };

  return {
    // Estado
    loading,
    error,
    parametrosCache,

    // Acciones
    cargarParametros,
    resetCache,

    // Maps computados
    getTipoIdentificacion,
    getCiudadDescripcion,
    getCargoDescripcion,
    getTipoVivienda,
    getTipoContrato,
    getEstadoData,
    getEstadoColor,
    getEstadoNombre,
    getEstadoBadgeClass,
    flujoAprobacion,
    _estadoProgressPercent: estadoProgressPercent,

    // Funciones helper
    buscarTipoIdentificacion,
    buscarCiudad,
    buscarCargo,
    buscarTipoVivienda,
    buscarTipoContrato
  };
}
