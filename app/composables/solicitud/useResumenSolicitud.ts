import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { useDocumentos } from "~/composables/solicitud/useDocumentos";

export const useResumenSolicitud = () => {
  const route = useRoute();
  const router = useRouter();
  const { getJson, postJson } = useApi();
  const { session } = useSession();

  const solicitudId = route.params.id as string;

  // Composable de documentos
  const { cargarDocumentos, documentosCargados, documentosRequeridos } =
    useDocumentos(solicitudId);

  // Estado
  const solicitud = ref<SolicitudCredito | null>(null);
  const loadingSolicitud = ref(true);
  const errorSolicitud = ref<string | null>(null);
  const enviando = ref(false);

  // Computed
  const todosDocumentosCompletos = computed(() => {
    if (!documentosRequeridos.value) return false;
    const obligatorios = documentosRequeridos.value.filter(
      (d) => d.obligatorio,
    );
    return obligatorios.every((d) => getDocumentoCargado(d.id));
  });

  // Métodos
  const getDocumentoCargado = (reqId: string) => {
    if (!documentosCargados.value) return null;
    return documentosCargados.value.find(
      (d) => d.documento_requerido_id === reqId,
    );
  };

  const cargarSolicitud = async () => {
    loadingSolicitud.value = true;
    errorSolicitud.value = null;

    try {
      // Cargar datos de la solicitud
      const response = await getJson<{
        success: boolean;
        data: SolicitudCredito;
      }>(`/api/solicitudes/${solicitudId}`, { auth: true });
      solicitud.value = response.data;

      // Cargar documentos requeridos y existentes
      await cargarDocumentos();
    } catch (e: any) {
      console.error(e);
      errorSolicitud.value =
        e.message || "No se pudo cargar la información de la solicitud.";
    } finally {
      loadingSolicitud.value = false;
    }
  };

  const handleNavigation = (step: string) => {
    if (step === "documentos") {
      router.push(`/solicitud/documentos/${solicitudId}`);
    } else if (step === "formulario") {
      router.push("/solicitud");
    }
  };

  const handleBack = () => {
    router.push(`/solicitud/documentos/${solicitudId}`);
  };

  const handleEdit = () => {
    router.push("/solicitud");
  };

  const handleEnviarValidacion = async () => {
    if (!todosDocumentosCompletos.value || enviando.value) return;

    try {
      enviando.value = true;

      // Generar oficio PDF usando el endpoint existente
      const response = await postJson<{ success: boolean; message?: string }>(
        `/api/solicitudes/${solicitudId}/generar-pdf`,
        {
          fecha_envio: new Date().toISOString(),
        },
        { auth: true },
      );

      console.log("Response generacion PDF:", response);

      // Navegar a página de confirmación si el PDF se generó exitosamente
      if (response.success) {
        router.push(`/solicitud/special_thanks/${solicitudId}`);
      } else {
        errorSolicitud.value = response.message || "Error al generar el PDF";
      }
    } catch (e: any) {
      console.error(e);
      errorSolicitud.value =
        e.message || "Error al enviar la solicitud para validación.";
    } finally {
      enviando.value = false;
    }
  };

  return {
    // Estado
    solicitud,
    loadingSolicitud,
    errorSolicitud,
    enviando,

    // Computed
    todosDocumentosCompletos,

    // Métodos
    getDocumentoCargado,
    cargarSolicitud,
    handleNavigation,
    handleBack,
    handleEdit,
    handleEnviarValidacion,

    // Datos del composable de documentos
    documentosCargados,
    documentosRequeridos,
  };
};
