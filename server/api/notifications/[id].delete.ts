import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de notificación no proporcionado", "Error de validación");
    }

    const notification = await prisma.notifications.findUnique({
      where: { id }
    });

    if (!notification) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Notificación no encontrada", "Recurso no encontrado");
    }

    if (notification.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error("No tienes permiso para eliminar esta notificación", "Acceso denegado");
    }

    await prisma.notifications.delete({
      where: { id }
    });

    return CustomResponse.ok(null, "Notificación eliminada exitosamente");
  } catch (error: any) {
    console.error("Error al eliminar notificación:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al eliminar notificación",
      "Error al eliminar notificación."
    );
  }
});
