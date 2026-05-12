import { ref } from "vue";
import { useApi } from "~/composables/useApi";

export function useDocumentosPostulante() {
  const { postJson } = useApi();

  const loading = ref(false);
  const errorMsg = ref("");
  const result = ref<any | null>(null);

  const guardarDocumentos = async (
    documentos: DocumentosPostulante,
    datosBasicos: { tipoIdentificacion: string, numeroIdentificacion: string }
  ) => {
    loading.value = true;
    errorMsg.value = "";
    result.value = null;

    try {
      // Convertir URLs de data a base64 si es necesario
      const documentosBase64: Record<string, string> = {};

      for (const [tipo, url] of Object.entries(documentos) as [
        string,
        string
      ][]) {
        if (typeof url === "string") {
          // Si ya es base64 (data:image/...), usarlo directamente
          if (url.startsWith("data:")) {
            documentosBase64[tipo] = url;
          } else {
            // Si es una URL, convertirla a base64
            const response = await fetch(url);
            const blob = await response.blob();
            documentosBase64[tipo] = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        }
      }

      const payload: DocumentosRequestPayload = {
        postulante_id: datosBasicos.numeroIdentificacion,
        tipo_identificacion: datosBasicos.tipoIdentificacion,
        numero_identificacion: datosBasicos.numeroIdentificacion,
        documentos: documentosBase64
      };

      result.value = await postJson<any>(
        "/api/entidad-digital/documentos",
        payload
      );

      return result.value;
    } catch (error: any) {
      errorMsg.value
        = error?.data?.error || error?.message || "Error guardando documentos";
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const guardarSelfie = async (
    selfie: string,
    datosBasicos: { tipoIdentificacion: string, numeroIdentificacion: string }
  ) => {
    loading.value = true;
    errorMsg.value = "";
    result.value = null;

    try {
      // Convertir a base64 si es necesario
      let selfieBase64 = selfie;
      if (!selfie.startsWith("data:")) {
        const response = await fetch(selfie);
        const blob = await response.blob();
        selfieBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const payload: SelfieRequestPayload = {
        postulante_id: datosBasicos.numeroIdentificacion,
        tipo_identificacion: datosBasicos.tipoIdentificacion,
        numero_identificacion: datosBasicos.numeroIdentificacion,
        selfie: selfieBase64
      };

      result.value = await postJson<any>(
        "/api/entidad-digital/selfie",
        payload
      );

      return result.value;
    } catch (error: any) {
      errorMsg.value
        = error?.data?.error || error?.message || "Error guardando selfie";
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const guardarProcesoCompleto = async (
    documentos: DocumentosPostulante,
    selfie: string,
    datosBasicos: { tipoIdentificacion: string, numeroIdentificacion: string }
  ) => {
    loading.value = true;
    errorMsg.value = "";
    result.value = null;

    try {
      // Convertir a base64 si es necesario
      const documentosBase64: Record<string, string> = {};

      for (const [tipo, url] of Object.entries(documentos) as [
        string,
        string
      ][]) {
        if (typeof url === "string") {
          if (url.startsWith("data:")) {
            documentosBase64[tipo] = url;
          } else {
            const response = await fetch(url);
            const blob = await response.blob();
            documentosBase64[tipo] = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        }
      }

      let selfieBase64 = selfie;
      if (!selfie.startsWith("data:")) {
        const response = await fetch(selfie);
        const blob = await response.blob();
        selfieBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const payload: ProcesoCompletoRequestPayload = {
        postulante_id: datosBasicos.numeroIdentificacion,
        tipo_identificacion: datosBasicos.tipoIdentificacion,
        numero_identificacion: datosBasicos.numeroIdentificacion,
        documentos: documentosBase64,
        selfie: selfieBase64
      };

      result.value = await postJson<any>(
        "/api/entidad-digital/completo",
        payload
      );

      return result.value;
    } catch (error: any) {
      errorMsg.value
        = error?.data?.error
          || error?.message
          || "Error guardando proceso completo";
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    errorMsg,
    result,
    guardarDocumentos,
    guardarSelfie,
    guardarProcesoCompleto
  };
}
