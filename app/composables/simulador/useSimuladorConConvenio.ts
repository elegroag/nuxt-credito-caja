import { ref, computed } from "#imports";
import { useApi } from "~/composables/useApi";
import type { ConvenioActivo } from "#shared/types/trabajador";

/**
 * Extensión del simulador con validación de convenio empresarial
 * Usa el endpoint /api/convenios/activo que devuelve los convenios del trabajador
 */
export function useSimuladorConConvenio() {
  const { getJson } = useApi();

  // Datos del trabajador para validación
  const nitEmpresa = ref("");
  const cedulaTrabajador = ref("");

  // Estados
  const convenioVerificado = ref(false);
  const loadingConvenio = ref(false);
  const errorConvenio = ref<string | null>(null);
  const convenio = ref<ConvenioActivo | null>(null);

  // Computed
  const isElegible = computed(
    () => !!convenio.value && convenio.value.estado === "Activo",
  );

  const getMensajeError = computed(() => {
    if (!errorConvenio.value) return null;
    return {
      titulo: "Sin convenio empresarial",
      descripcion: "No se encontró un convenio activo para tu empresa.",
      tipo: "info" as const,
    };
  });

  /**
   * Valida el convenio consultando /api/convenios/activo
   */
  const validarConvenioAntesDSimular = async (): Promise<boolean> => {
    if (!nitEmpresa.value || !cedulaTrabajador.value) {
      return false;
    }

    loadingConvenio.value = true;
    errorConvenio.value = null;

    try {
      console.log("Consultando convenios activos...");

      const response = await getJson<{
        success: boolean;
        data: ConvenioActivo[];
      }>("/api/convenios/activo", { auth: true });

      console.log("Respuesta convenios:", response);

      // Verificar si hay convenios activos
      if (
        response.success &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        // Tomar el primer convenio activo que coincida con el NIT
        const convenioEncontrado =
          response.data.find(
            (c) =>
              c.nit === nitEmpresa.value ||
              String(c.nit) === String(nitEmpresa.value),
          ) || response.data[0]; // Si no coincide el NIT, tomar el primero

        convenio.value = convenioEncontrado;
        convenioVerificado.value = true;

        console.log("Convenio encontrado:", convenio.value);
        return isElegible.value;
      }

      // No hay convenios
      convenio.value = null;
      convenioVerificado.value = true;
      errorConvenio.value = "No tienes convenios activos";

      return false;
    } catch (err: any) {
      console.error("Error consultando convenios:", err);
      errorConvenio.value = "Error al consultar convenios";
      convenio.value = null;
      convenioVerificado.value = true;
      return false;
    } finally {
      loadingConvenio.value = false;
    }
  };

  /**
   * Resetea el estado del convenio
   */
  const resetearConvenio = () => {
    nitEmpresa.value = "";
    cedulaTrabajador.value = "";
    convenioVerificado.value = false;
    convenio.value = null;
    errorConvenio.value = null;
  };

  return {
    // Datos de entrada
    nitEmpresa,
    cedulaTrabajador,

    // Estados
    loadingConvenio,
    errorConvenio,
    convenioVerificado,
    isElegible,

    // Datos del convenio
    convenio,
    getMensajeError,

    // Métodos
    validarConvenioAntesDSimular,
    resetearConvenio,
  };
}
