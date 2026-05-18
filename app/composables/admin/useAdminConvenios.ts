import { ref, computed, reactive } from "vue";
import { useApi } from "~/composables/useApi";
import type { EmpresaConvenio, ConveniosResponse } from "~~/shared/types/convenios";
import type { SuccessResponse } from "~~/shared/types/response";

export function useAdminConvenios() {
  // Estado reactivo
  const empresas = ref<EmpresaConvenio[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalEmpresas = ref(0);
  const conteoEstados = ref<Record<string, number>>({});

  // Filtros
  const filtros = reactive({
    estado: null as string | null,
    nit: "",
    busqueda: ""
  });

  // Paginación
  const paginacion = reactive({
    page: 1,
    limit: 20,
    offset: 0
  });

  // Computed properties
  const paginaActual = computed(() => paginacion.page);
  const totalPaginas = computed(() => Math.ceil(totalEmpresas.value / paginacion.limit));

  const paginasVisibles = computed(() => {
    const total = totalPaginas.value;
    const actual = paginaActual.value;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, actual - delta); i <= Math.min(total - 1, actual + delta); i++) {
      range.push(i);
    }

    if (actual - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (actual + delta < total - 1) {
      rangeWithDots.push("...", total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots.filter((item, index, arr) => item !== arr[index - 1]);
  });

  // Métodos
  const cargarEmpresas = async () => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();

      // Parámetros de paginación
      params.append("page", paginacion.page.toString());
      params.append("limit", paginacion.limit.toString());

      // Filtros
      if (filtros.estado) params.append("estado", filtros.estado);
      if (filtros.nit) params.append("nit", filtros.nit);
      if (filtros.busqueda) params.append("busqueda", filtros.busqueda);

      const api = useApi();
      const response = await api.getJson<SuccessResponse<ConveniosResponse>>(`/api/admin/convenios?${params.toString()}`, {
        auth: true
      });

      console.log("Respuesta de la API:", response);

      // La respuesta del backend usa el formato success_response
      if (response && response.success && response.data) {
        const data = response.data;
        empresas.value = data.empresas || [];
        totalEmpresas.value = data.pagination?.total || 0;
        conteoEstados.value = data.conteo_estados || {};

        // Actualizar paginación con los datos reales
        if (data.pagination) {
          paginacion.page = data.pagination.page;
          paginacion.limit = data.pagination.limit;
          paginacion.offset = (data.pagination.page - 1) * data.pagination.limit;
        }
      } else {
        console.warn("Estructura de respuesta inesperada:", response);
        empresas.value = [];
        totalEmpresas.value = 0;
        conteoEstados.value = {};
      }
    } catch (err: unknown) {
      console.error("Error al cargar empresas con convenios:", err);
      error.value = (err as Error).message || "Error al cargar las empresas con convenios";
      empresas.value = [];
      totalEmpresas.value = 0;
    } finally {
      loading.value = false;
    }
  };

  const recargarDatos = () => {
    paginacion.page = 1;
    paginacion.offset = 0;
    cargarEmpresas();
  };

  const aplicarFiltros = () => {
    paginacion.page = 1;
    paginacion.offset = 0;
    cargarEmpresas();
  };

  const limpiarFiltros = () => {
    filtros.estado = null;
    filtros.nit = "";
    filtros.busqueda = "";
    paginacion.page = 1;
    paginacion.offset = 0;
    cargarEmpresas();
  };

  const cambiarLimite = () => {
    paginacion.page = 1;
    paginacion.offset = 0;
    cargarEmpresas();
  };

  const paginaAnterior = () => {
    if (paginaActual.value > 1) {
      paginacion.page--;
      paginacion.offset = (paginacion.page - 1) * paginacion.limit;
      cargarEmpresas();
    }
  };

  const paginaSiguiente = () => {
    if (paginaActual.value < totalPaginas.value) {
      paginacion.page++;
      paginacion.offset = (paginacion.page - 1) * paginacion.limit;
      cargarEmpresas();
    }
  };

  const irAPagina = (page: number) => {
    paginacion.page = page;
    paginacion.offset = (page - 1) * paginacion.limit;
    cargarEmpresas();
  };

  const toggleEstadoEmpresa = async (empresa: EmpresaConvenio) => {
    try {
      const nuevoEstado = empresa.estado === "Activo" ? "Inactivo" : "Activo";

      const api = useApi();
      await api.putJson(
        `/api/admin/empresas-convenios/${empresa.id}/estado`,
        {
          estado: nuevoEstado
        },
        { auth: true }
      );

      // Actualizar estado localmente
      const index = empresas.value.findIndex((e) => e.id === empresa.id);
      const empresaIndex = empresas.value[index];
      if (index !== -1 && empresaIndex) {
        empresaIndex.estado = nuevoEstado;

        // Actualizar conteos
        const estadoAnterior = empresa.estado || "unknown";
        conteoEstados.value[estadoAnterior] = (conteoEstados.value[estadoAnterior] || 0) - 1;
        conteoEstados.value[nuevoEstado] = (conteoEstados.value[nuevoEstado] || 0) + 1;
      }
    } catch (err: unknown) {
      console.error("Error al cambiar estado de la empresa:", err);
      error.value = (err as Error).message || "Error al cambiar el estado de la empresa";
    }
  };

  const eliminarEmpresa = async (empresa: EmpresaConvenio) => {
    try {
      const api = useApi();
      await api.deleteJson(`/api/admin/empresas-convenios/${empresa.id}`, {
        auth: true
      });

      // Eliminar del listado local
      const index = empresas.value.findIndex((e) => e.id === empresa.id);
      if (index !== -1) {
        empresas.value.splice(index, 1);
        totalEmpresas.value--;

        // Actualizar conteos
        conteoEstados.value[empresa.estado] = (conteoEstados.value[empresa.estado] || 0) - 1;
      }
    } catch (err: unknown) {
      console.error("Error al eliminar empresa:", err);
      error.value = (err as Error).message || "Error al eliminar la empresa";
    }
  };

  // Búsqueda con debounce
  let debounceTimeout: NodeJS.Timeout | null = null;
  const debounceSearch = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      aplicarFiltros();
    }, 500);
  };

  // Utilidades
  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      Activo: "Activo",
      Inactivo: "Inactivo"
    };
    return labels[estado] || estado;
  };

  const getEstadoVariant = (estado: string): "solid" | "outline" | "soft" | "subtle" => {
    const variants: Record<string, "solid" | "outline" | "soft" | "subtle"> = {
      Activo: "solid",
      Inactivo: "outline"
    };
    return variants[estado] || "soft";
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return {
    // Estado
    empresas,
    loading,
    error,
    totalEmpresas,
    conteoEstados,
    filtros,
    paginacion,
    paginaActual,
    totalPaginas,
    paginasVisibles,

    // Métodos
    cargarEmpresas,
    recargarDatos,
    aplicarFiltros,
    limpiarFiltros,
    cambiarLimite,
    paginaAnterior,
    paginaSiguiente,
    irAPagina,
    toggleEstadoEmpresa,
    eliminarEmpresa,
    debounceSearch,

    // Utilidades
    getEstadoLabel,
    getEstadoVariant,
    formatDate
  };
}
