import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

export function useAccionesSolicitud() {
  const route = useRoute();
  const router = useRouter();
  const { getJson, putJson } = useApi();
  const { ready } = useSession();

  const solicitudId = computed(() => route.params.id as string);
  const solicitud = ref<SolicitudCredito | null>(null);
  const estados = ref<InEstadoSolicitud[]>([]);
  const loading = ref(true);
  const loadingEstados = ref(false);
  const loadingAccion = ref(false);

  const error = ref<string | null>(null);

  // Datos del formulario
  const estadoSeleccionado = ref<string>("");
  const notificacion = ref<string>("");

  // Cargar datos de la solicitud
  const cargarSolicitud = async () => {
    loading.value = true;
    error.value = null;
    try {
      await ready;
      const response = await getJson<{
        success: boolean;
        data: SolicitudCredito;
      }>(`/api/admin/solicitudes/${solicitudId.value}`, { auth: true });

      solicitud.value = response.data;
      estadoSeleccionado.value = response.data.estado;
    } catch (e: any) {
      console.error("Error al cargar solicitud:", e);
      error.value = e.message || "No se pudo cargar la información de la solicitud.";
    } finally {
      loading.value = false;
    }
  };

  // Cargar estados disponibles
  const cargarEstados = async () => {
    loadingEstados.value = true;
    try {
      await ready;
      const response = await getJson<{
        success: boolean;
        data: InEstadoSolicitud[];
      }>("/api/solicitudes/estados-solicitud", { auth: true });

      if (response.data && Array.isArray(response.data)) {
        estados.value = response.data.sort((a, b) => a.orden - b.orden);
      }
    } catch (e: any) {
      console.error("Error al cargar estados:", e);
      error.value = e.message || "No se pudieron cargar los estados disponibles.";
    } finally {
      loadingEstados.value = false;
    }
  };

  // Registrar acción y cambiar estado
  const registrarAccion = async () => {
    if (!estadoSeleccionado.value) {
      return {
        success: false,
        message: "Debe seleccionar un estado"
      };
    }

    loadingAccion.value = true;
    try {
      await ready;

      const accionData: AccionData = {
        estado: estadoSeleccionado.value,
        descripcion: notificacion.value || undefined
      };

      const response = await putJson<{
        success: boolean;
        data: SolicitudCredito;
        message: string;
      }>(`/api/admin/solicitudes/${solicitudId.value}/estado`, accionData, {
        auth: true
      });

      if (response.success) {
        // Actualizar datos locales
        await cargarSolicitud();

        return {
          success: true,
          message: response.message || "Estado actualizado exitosamente"
        };
      } else {
        throw new Error(response.message || "Error al actualizar estado");
      }
    } catch (e: any) {
      console.error("Error al registrar acción:", e);
      return {
        success: false,
        message: e.message || "Error al registrar la acción"
      };
    } finally {
      loadingAccion.value = false;
    }
  };

  // Estado actual formateado
  const estadoActualInfo = computed(() => {
    if (!solicitud.value || !estados.value.length) return null;

    return estados.value.find((e) => e.id === solicitud.value?.estado);
  });

  // Validar si el estado seleccionado es diferente al actual
  const estadoCambiado = computed(() => {
    return solicitud.value && estadoSeleccionado.value !== solicitud.value.estado;
  });

  // Obtener nombre del estado
  const getNombreEstado = (estadoId: string): string => {
    const estado = estados.value.find((e) => e.id === estadoId);
    return estado?.nombre || estadoId;
  };

  // Navegación
  const volverADetalle = () => {
    router.push(`/admin/solicitudes/show/${solicitudId.value}`);
  };

  const volverAListado = () => {
    router.push("/admin/solicitudes");
  };

  // Cargar datos al montar
  onMounted(async () => {
    await cargarEstados();
    await cargarSolicitud();
  });

  return {
    solicitud,
    solicitudId,
    estados,
    loading,
    loadingEstados,
    loadingAccion,
    error,
    estadoSeleccionado,
    notificacion,
    estadoActualInfo,
    estadoCambiado,
    cargarSolicitud,
    cargarEstados,
    registrarAccion,
    getNombreEstado,
    volverADetalle,
    volverAListado
  };
}
