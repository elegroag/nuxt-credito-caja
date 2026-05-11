import { ref, computed } from "vue";
import { $fetch } from "ofetch";
import { useSession } from "~/composables/useSession";

export function useAdminUsers() {
  const { ready } = useSession();

  // Estado
  const usuarios = ref<Usuario[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const totalUsuarios = ref(0);
  const conteoRoles = ref<Record<string, number>>({});
  const conteoEstados = ref<Record<string, number>>({});

  // Filtros
  const filtros = ref({
    rol: null as string | null,
    busqueda: "",
    estado: null as string | null,
  });

  // Paginación
  const paginacion = ref<Paginacion>({
    limit: 10,
    offset: 0,
  });

  // Debounce para búsqueda
  const debounceSearch = ref<NodeJS.Timeout | null>(null);

  // Computed properties
  const paginaActual = computed(
    () => Math.floor(paginacion.value.offset / paginacion.value.limit) + 1,
  );
  const totalPaginas = computed(() =>
    Math.ceil(totalUsuarios.value / paginacion.value.limit),
  );

  const paginasVisibles = computed(() => {
    const paginas: number[] = [];
    const maxPaginasVisibles = 5;
    const mitad = Math.floor(maxPaginasVisibles / 2);

    let inicio = Math.max(1, paginaActual.value - mitad);
    let fin = Math.min(totalPaginas.value, inicio + maxPaginasVisibles - 1);

    if (fin - inicio + 1 < maxPaginasVisibles) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  });

  // Cargar usuarios
  const cargarUsuarios = async () => {
    loading.value = true;
    error.value = null;

    try {
      await ready;

      // Construir query params
      const params = new URLSearchParams({
        limit: paginacion.value.limit.toString(),
        offset: paginacion.value.offset.toString(),
      });

      if (filtros.value.rol) {
        params.append("rol", filtros.value.rol);
      }

      if (filtros.value.estado) {
        params.append("estado", filtros.value.estado);
      }

      if (filtros.value.busqueda) {
        params.append("busqueda", filtros.value.busqueda);
      }

      const response = await $fetch<{
        success: boolean;
        data: {
          usuarios: Usuario[];
          total: number;
          conteo_roles: Record<string, number>;
          conteo_estados: Record<string, number>;
        };
        message?: string;
      }>(`/api/admin/users?${params.toString()}`);

      if (response.success && response.data) {
        usuarios.value = response.data.usuarios || [];
        totalUsuarios.value = response.data.total || 0;
        conteoRoles.value = response.data.conteo_roles || {};
        conteoEstados.value = response.data.conteo_estados || {};
      } else {
        error.value = response.message || "No se pudieron cargar los usuarios";
        usuarios.value = [];
        totalUsuarios.value = 0;
        conteoRoles.value = {};
        conteoEstados.value = {};
      }
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err);
      error.value = err.message || "Error al cargar los usuarios";
      usuarios.value = [];
      totalUsuarios.value = 0;
      conteoRoles.value = {};
      conteoEstados.value = {};
    } finally {
      loading.value = false;
    }
  };

  // Recargar datos
  const recargarDatos = () => {
    paginacion.value.offset = 0;
    cargarUsuarios();
  };

  // Cambiar página
  const paginaAnterior = () => {
    if (paginacion.value.offset > 0) {
      paginacion.value.offset -= paginacion.value.limit;
      cargarUsuarios();
    }
  };

  const paginaSiguiente = () => {
    if (paginacion.value.offset + usuarios.value.length < totalUsuarios.value) {
      paginacion.value.offset += paginacion.value.limit;
      cargarUsuarios();
    }
  };

  const irAPagina = (pagina: number) => {
    paginacion.value.offset = (pagina - 1) * paginacion.value.limit;
    cargarUsuarios();
  };

  // Toggle estado de usuario
  const toggleEstadoUsuario = async (usuario: Usuario) => {
    try {
      const nuevoEstado = usuario.estado === "active" ? "inactive" : "active";

      const response = await $fetch<{
        success: boolean;
        message: string;
      }>(`/api/admin/users/${usuario.id}`, {
        method: "PUT",
        body: {
          disabled: nuevoEstado === "inactive",
        },
      });

      if (response.success) {
        // Actualizar el usuario localmente
        const index = usuarios.value.findIndex((u) => u.id === usuario.id);
        if (index !== -1 && usuarios.value[index]) {
          usuarios.value[index].estado = nuevoEstado;

          // Actualizar conteos
          if (nuevoEstado === "active") {
            conteoEstados.value.active = (conteoEstados.value.active || 0) + 1;
            conteoEstados.value.inactive = Math.max(
              0,
              (conteoEstados.value.inactive || 0) - 1,
            );
          } else {
            conteoEstados.value.inactive =
              (conteoEstados.value.inactive || 0) + 1;
            conteoEstados.value.active = Math.max(
              0,
              (conteoEstados.value.active || 0) - 1,
            );
          }
        }
      } else {
        error.value = response.message || "No se pudo cambiar el estado";
      }
    } catch (err: any) {
      console.error("Error al cambiar estado:", err);
      error.value = err.message || "Error al cambiar el estado";
    }
  };

  // Cambiar límite de paginación
  const cambiarLimite = (nuevoLimite: number) => {
    paginacion.value.limit = nuevoLimite;
    paginacion.value.offset = 0;
    cargarUsuarios();
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    paginacion.value.offset = 0;
    cargarUsuarios();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    filtros.value = {
      rol: null,
      busqueda: "",
      estado: null,
    };
    paginacion.value.offset = 0;
    cargarUsuarios();
  };

  // Búsqueda con debounce
  const buscarConDebounce = () => {
    if (debounceSearch.value) {
      clearTimeout(debounceSearch.value);
    }

    debounceSearch.value = setTimeout(() => {
      aplicarFiltros();
    }, 300);
  };

  // Utilidades
  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      administrator: "Administrador",
      user_trabajador: "Trabajador",
      user_empresa: "Empresa",
    };
    return roles[rol] || rol;
  };

  const getRolVariant = (
    rol: string,
  ): "solid" | "outline" | "soft" | "subtle" => {
    const variants: Record<
      string,
      "solid" | "outline" | "soft" | "subtle"
    > = {
      administrator: "solid",
      user_trabajador: "soft",
      user_empresa: "outline",
    };
    return variants[rol] || "soft";
  };

  const getEstadoLabel = (estado: string) => {
    const estados: Record<string, string> = {
      active: "Activo",
      inactive: "Inactivo",
      suspended: "Suspendido",
    };
    return estados[estado] || estado;
  };

  const getEstadoVariant = (
    estado: string,
  ): "solid" | "outline" | "soft" | "subtle" => {
    const variants: Record<
      string,
      "solid" | "outline" | "soft" | "subtle"
    > = {
      active: "soft",
      inactive: "outline",
      suspended: "solid",
    };
    return variants[estado] || "soft";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Retornar todo lo necesario
  return {
    // Estado
    usuarios,
    loading,
    error,
    totalUsuarios,
    conteoRoles,
    conteoEstados,
    filtros,
    paginacion,
    debounceSearch,

    // Computed
    paginaActual,
    totalPaginas,
    paginasVisibles,

    // Métodos
    cargarUsuarios,
    recargarDatos,
    paginaAnterior,
    paginaSiguiente,
    irAPagina,
    toggleEstadoUsuario,
    cambiarLimite,
    aplicarFiltros,
    limpiarFiltros,
    buscarConDebounce,

    // Utilidades
    getRolLabel,
    getRolVariant,
    getEstadoLabel,
    getEstadoVariant,
    formatDate,
  };
}
