import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const result = await prisma.notifications.updateMany({
      where: {
        owner_username: session.user.username,
        read_at: null
      },
      data: {
        read_at: new Date(),
        updated_at: new Date()
      }
    });

    return CustomResponse.success({ marked_count: result.count }, "Notificaciones marcadas como leídas");
  } catch (error: unknown) {
    const err = error as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    console.error("Error al marcar todas las notificaciones como leídas:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al marcar todas las notificaciones como leídas",
      "Error al marcar leídas."
    );
  }
});
