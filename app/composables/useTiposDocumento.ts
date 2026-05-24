import { ref, computed, readonly } from "vue";
import { useApi } from "~/composables/useApi";

interface TipoDocumento {
  coddoc: string;
  detdoc: string;
}

const tiposDocumentoCache = ref<{ value: string; label: string }[] | null>(null);
const loadingTipos = ref(false);
const errorTipos = ref<string | null>(null);

export const useTiposDocumento = () => {
  const { getJson } = useApi();

  const cargarTiposDocumento = async () => {
    if (tiposDocumentoCache.value) {
      return tiposDocumentoCache.value;
    }

    try {
      loadingTipos.value = true;
      errorTipos.value = null;

      const response = await getJson<{ success: boolean; data: TipoDocumento[]; message?: string }>(
        "/api/parametros/tipos-documento",
        { auth: true }
      );

      if (response.success && response.data) {
        tiposDocumentoCache.value = response.data.map((td) => ({
          value: td.coddoc,
          label: td.detdoc
        }));
        return tiposDocumentoCache.value;
      } else {
        throw new Error(response?.message || "Error al cargar tipos de documento");
      }
    } catch (err: unknown) {
      console.error("Error cargando tipos de documento:", err);
      errorTipos.value = err instanceof Error ? err.message : "No se pudieron cargar los tipos de documento";
      throw err;
    } finally {
      loadingTipos.value = false;
    }
  };

  const tiposDocumentoOptions = computed(() => {
    return tiposDocumentoCache.value || [];
  });

  const limpiarCache = () => {
    tiposDocumentoCache.value = null;
    errorTipos.value = null;
  };

  return {
    // Estado
    loading: readonly(loadingTipos),
    error: readonly(errorTipos),

    // Acciones
    cargarTiposDocumento,
    limpiarCache,

    // Computed
    tiposDocumentoOptions
  };
};