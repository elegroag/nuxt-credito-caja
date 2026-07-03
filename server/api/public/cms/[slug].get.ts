import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import cmsPaginasService from "~~/server/services/cms-paginas.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const slug = getRouterParam(event, "slug");

    if (!slug) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Slug requerido", "Error de validación");
    }

    const safeSlug = cmsPaginasService().sanitizeSlug(slug);
    if (!safeSlug) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Slug inválido", "Error de validación");
    }

    const service = cmsPaginasService();
    const content = await service.getPageContent(safeSlug);

    return CustomResponse.success(content, "Contenido obtenido exitosamente");
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 500);
    return CustomResponse.error(
      err?.message || "Error al obtener el contenido",
      "Error al obtener el contenido de la página"
    );
  }
});