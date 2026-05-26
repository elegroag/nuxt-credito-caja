import { ref, computed, readonly } from "vue";
import { useApi } from "~/composables/useApi";

interface RolFirmante {
  id: number;
  nombre: string;
  etiqueta: string;
  descripcion: string | null;
}

const rolesFirmantesCache = ref<RolFirmante[] | null>(null);
const loadingRoles = ref(false);
const errorRoles = ref<string | null>(null);

export const useRolesFirmantes = () => {
  const { getJson } = useApi();

  const cargarRolesFirmantes = async () => {
    if (rolesFirmantesCache.value) {
      return rolesFirmantesCache.value;
    }

    try {
      loadingRoles.value = true;
      errorRoles.value = null;

      const response = await getJson<{ success: boolean; data: RolFirmante[]; message?: string }>(
        "/api/parametros/roles",
        { auth: true }
      );

      if (response.success && response.data) {
        rolesFirmantesCache.value = response.data;
        return response.data;
      } else {
        throw new Error(response?.message || "Error al cargar roles de firmantes");
      }
    } catch (err: unknown) {
      console.error("Error cargando roles de firmantes:", err);
      errorRoles.value = err instanceof Error ? err.message : "No se pudieron cargar los roles";
      throw err;
    } finally {
      loadingRoles.value = false;
    }
  };

  const rolesFirmantesOptions = computed(() => {
    if (!rolesFirmantesCache.value) return [];
    return rolesFirmantesCache.value.map((rol) => ({
      label: rol.etiqueta,
      value: String(rol.id)
    }));
  });

  const limpiarCache = () => {
    rolesFirmantesCache.value = null;
    errorRoles.value = null;
  };

  return {
    // Estado
    loading: readonly(loadingRoles),
    error: readonly(errorRoles),

    // Acciones
    cargarRolesFirmantes,
    limpiarCache,

    // Computed
    rolesFirmantesOptions,
    rolesFirmantesCache: readonly(rolesFirmantesCache)
  };
};
