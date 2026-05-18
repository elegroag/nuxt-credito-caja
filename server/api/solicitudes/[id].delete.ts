import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    // Admin con cualquier rol puede eliminar sin restricción de ownership
    const userRoles = (session.user as { roles?: string[] })?.roles;
    const isAdmin = userRoles?.includes("administrator");
    const isOwner = solicitud.owner_username === session.user.username;

    if (!isAdmin && !isOwner) {
      setResponseStatus(event, 403);
      return CustomResponse.error("No tienes permiso para eliminar esta solicitud", "Acceso denegado");
    }

    await prisma.solicitudes_credito.delete({
      where: { numero_solicitud: solicitudId }
    });

    return CustomResponse.success(null, "Solicitud eliminada exitosamente");
  } catch (error: unknown) {
    const err = error as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    console.error("Error al eliminar solicitud:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al eliminar la solicitud",
      "Error al eliminar solicitud."
    );
  }
});
