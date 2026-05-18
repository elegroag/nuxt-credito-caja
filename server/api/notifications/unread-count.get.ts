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
        message: "No session found"
      });
    }

    const unreadCount = await notifSrv.getUnreadCount(session.user.username);

    return CustomResponse.success({ unread_count: unreadCount });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener notificaciones."
    );
  }
});
