import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event);
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return {
        error: "No hay sesión activa",
      };
    }

    const onlyUnread = query.unread === "true";
    const limit = query.limit ? parseInt(query.limit as string) : 50;

    const where: any = {
      owner_username: session.user.username,
    };

    if (onlyUnread) {
      where.read_at = null;
    }

    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notifications.count({
      where: {
        owner_username: session.user.username,
        read_at: null,
      },
    });

    const total = await prisma.notifications.count({
      where: {
        owner_username: session.user.username,
      },
    });

    return {
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        total,
      },
    };
  } catch (error: any) {
    console.error("Error al cargar notificaciones:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al cargar notificaciones",
    };
  }
});
