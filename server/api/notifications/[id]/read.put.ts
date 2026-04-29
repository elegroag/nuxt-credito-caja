import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return {
        error: "No hay sesión activa",
      };
    }

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de notificación no proporcionado",
      };
    }

    const notification = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      setResponseStatus(event, 404);
      return {
        error: "Notificación no encontrada",
      };
    }

    if (notification.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return {
        error: "No tienes permiso para modificar esta notificación",
      };
    }

    await prisma.notifications.update({
      where: { id },
      data: {
        read_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: "Notificación marcada como leída",
    };
  } catch (error: any) {
    console.error("Error al marcar notificación como leída:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al marcar notificación como leída",
    };
  }
});
