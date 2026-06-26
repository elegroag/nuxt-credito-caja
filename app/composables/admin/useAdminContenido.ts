import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { invalidateCmsCache } from "~/composables/public/useContenidoPagina";
import type {
  CmsFieldInput,
  CmsPageContent,
  CmsPageResponse,
  CmsPagesListResponse,
  CmsSavePayload,
  CmsUploadResponse
} from "~~/shared/types/cms";

export const useAdminContenido = () => {
  const api = useApi();
  const { session } = useSession();

  const listarPaginas = async () => {
    const response = await api.getJson<CmsPagesListResponse>("/api/cms/pages", {
      auth: true
    });
    return response?.data?.pages ?? [];
  };

  const obtenerPagina = async (slug: string): Promise<CmsPageContent> => {
    const response = await api.getJson<CmsPageResponse>(
      `/api/cms/${encodeURIComponent(slug)}`,
      { auth: true }
    );
    if (!response?.success || !response.data) {
      throw new Error("No se pudo obtener la página");
    }
    return response.data;
  };

  const guardarPagina = async (
    slug: string,
    fields: CmsFieldInput[]
  ): Promise<CmsPageContent> => {
    const payload: CmsSavePayload = { fields };
    const response = await api.putJson<CmsPageResponse>(
      `/api/cms/${encodeURIComponent(slug)}`,
      payload,
      { auth: true }
    );
    if (!response?.success || !response.data) {
      throw new Error("No se pudo guardar la página");
    }
    invalidateCmsCache(slug);
    return response.data;
  };

  const subirImagen = async (slug: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("slug", slug);

    const response = await $fetch<CmsUploadResponse>(
      "/api/cms/upload",
      {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${session.value.accessToken}` }
      }
    );

    if (!response?.success || !response.data) {
      throw new Error("No se pudo subir la imagen");
    }
    return response.data;
  };

  return {
    listarPaginas,
    obtenerPagina,
    guardarPagina,
    subirImagen
  };
};