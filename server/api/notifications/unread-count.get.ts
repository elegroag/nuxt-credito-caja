import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import notificationService from "~~/server/services/notification.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  const notifSrv = notificationService();

  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      throw createError({
        statusCode: 401,
        message: "No session found",
      });
    }

    const unreadCount = await notifSrv.getUnreadCount(session.user.username);

    return CustomResponse.success({ unread_count: unreadCount });
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener notificaciones.",
    );
  }
});
