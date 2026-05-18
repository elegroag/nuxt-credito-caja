import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event);
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const onlyUnread = query.unread === "true";
    const limit = query.limit ? parseInt(query.limit as string) : 50;

    const where: Record<string, unknown> = {
      owner_username: session.user.username
    };

    if (onlyUnread) {
      where.read_at = null;
    }

    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit
    });

    const unreadCount = await prisma.notifications.count({
      where: {
        owner_username: session.user.username,
        read_at: null
      }
    });

    const total = await prisma.notifications.count({
      where: {
        owner_username: session.user.username
      }
    });

    return CustomResponse.success(
      { notifications, unread_count: unreadCount, total },
      "Notificaciones obtenidas exitosamente"
    );
  } catch (error: unknown) {
    const err = error as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    console.error("Error al cargar notificaciones:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al cargar notificaciones",
      "Error al obtener notificaciones."
    );
  }
});