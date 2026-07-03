import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
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

    const pages = await cmsPaginasService().listAllPages();
    return CustomResponse.success({ pages }, "Páginas CMS obtenidas");
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 500);
    return CustomResponse.error(
      err?.message || "Error al listar páginas",
      "Error al listar páginas CMS"
    );
  }
});