import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import cmsPaginasService from "~~/server/services/cms-paginas.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);
    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const user = await prisma.users.findUnique({
      where: { username: session.user.username },
      select: { roles: true }
    });

    if (!user) {
      setResponseStatus(event, 401);
      return CustomResponse.error("Usuario no encontrado", "Error de autenticación");
    }

    const roles = (user.roles as string[]) || [];
    const isAdmin = roles.includes("administrator");

    if (!isAdmin) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "Acceso denegado. Se requiere rol administrador",
        "Error de permisos"
      );
    }

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

    const content = await cmsPaginasService().getPageContent(safeSlug);
    return CustomResponse.success(content, "Contenido de página obtenido");
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 500);
    return CustomResponse.error(
      err?.message || "Error al obtener la página",
      "Error al obtener el contenido de la página"
    );
  }
});