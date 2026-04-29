import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return {
        error: "No hay sesión activa",
      };
    }

    const result = await prisma.notifications.updateMany({
      where: {
        owner_username: session.user.username,
        read_at: null,
      },
      data: {
        read_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: "Notificaciones marcadas como leídas",
      data: {
        marked_count: result.count,
      },
    };
  } catch (error: any) {
    console.error("Error al marcar todas las notificaciones como leídas:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al marcar todas las notificaciones como leídas",
    };
  }
});
