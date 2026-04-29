import { ref, computed } from "vue";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

export const useDocumentos = (solicitudId: string) => {
  const { urlFor } = useApi();
  const { authHeader } = useSession();

  const cargando = ref(false);
  const error = ref<string | null>(null);
  const progreso = ref(0);
  const documentosCargados = ref<DocumentoCargado[]>([]);
  const documentosRequeridos = ref<DocumentoRequerido[]>([]);

  const validarArchivo = (file: File): string | null => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (file.size > MAX_SIZE) {
      return `El archivo excede el tamaño máximo permitido de 5MB`;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Formato de archivo no válido. Se permiten: PDF, JPG, PNG`;
    }

    return null;
  };

  const cargarDocumentos = async () => {
    cargando.value = true;
    const { getJson } = useApi();
    try {
      // Cargar documentos cargados desde el endpoint actual
      const responseCargados = await getJson<{
        success: boolean;
        data: DocumentoCargado[];
        count: number;
      }>(`/api/solicitudes/${solicitudId}/documentos`, {
        auth: true,
      });

      // Procesar documentos cargados
      if (
        responseCargados &&
        responseCargados.success &&
        Array.isArray(responseCargados.data)
      ) {
        documentosCargados.value = responseCargados.data;
      } else {
        documentosCargados.value = [];
      }

      // Cargar documentos requeridos desde el nuevo endpoint
      const responseRequeridos = await getJson<{
        success: boolean;
        data: DocumentoRequerido[];
        count: number;
      }>(`/api/solicitudes/${solicitudId}/documentos/requeridos`, {
        auth: true,
      });

      // Procesar documentos requeridos
      if (
        responseRequeridos &&
        responseRequeridos.success &&
        Array.isArray(responseRequeridos.data)
      ) {
        documentosRequeridos.value = responseRequeridos.data;
      } else {
        documentosRequeridos.value = [];
      }
    } catch (e: any) {
      console.error("Error cargando documentos", e);
      documentosRequeridos.value = [];
      documentosCargados.value = [];
    } finally {
      cargando.value = false;
    }
  };

  const subirDocumento = async (file: File, documentoRequeridoId: string) => {
    cargando.value = true;
    error.value = null;
    progreso.value = 0;

    try {
      const errorValidacion = validarArchivo(file);
      if (errorValidacion) {
        throw new Error(errorValidacion);
      }

      const formData = new FormData();
      formData.append("documento", file); // Cambiado de 'file' a 'documento'
      formData.append("documento_requerido_id", documentoRequeridoId);

      const response = await $fetch<{
        success: boolean;
        data: SolicitudCredito;
        message: string;
      }>(urlFor(`/api/solicitudes/${solicitudId}/documentos`), {
        method: "POST",
        body: formData,
        headers: {
          ...(authHeader.value as any),
        },
      });

      // Actualizar la lista de documentos cargados desde la respuesta del backend
      if (
        response &&
        response.success &&
        response.data &&
        response.data.documentos
      ) {
        documentosCargados.value = response.data.documentos;
      }

      // Forzar un refresh de los documentos para asegurar sincronización
      await cargarDocumentos();

      return response;
    } catch (e: any) {
      error.value = e.message || "Error al subir el documento";
      throw e;
    } finally {
      cargando.value = false;
      progreso.value = 0;
    }
  };

  const eliminarDocumento = async (documentoCargadoId: string) => {
    cargando.value = true;
    error.value = null;

    try {
      await $fetch(
        urlFor(
          `/api/solicitudes/${solicitudId}/documentos/${documentoCargadoId}`,
        ),
        {
          method: "DELETE",
          headers: {
            ...(authHeader.value as any),
          },
        },
      );

      // Forzar refresh de documentos después de eliminar
      await cargarDocumentos();
    } catch (e: any) {
      error.value = e.message || "Error al eliminar el documento";
      throw e;
    } finally {
      cargando.value = false;
    }
  };

  return {
    cargando,
    error,
    progreso,
    documentosCargados,
    documentosRequeridos,
    subirDocumento,
    eliminarDocumento,
    cargarDocumentos,
    validarArchivo,
  };
};
