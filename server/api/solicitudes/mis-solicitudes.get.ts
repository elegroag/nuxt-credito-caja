import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus, getQuery } from "h3";
import solicitudService from "~~/server/services/solicitud.service";

export default defineEventHandler(async (event: H3Event) => {
  const solicitudSrv = solicitudService();

  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      throw createError({
        statusCode: 401,
        message: "No session found",
      });
    }

    const query = getQuery(event);
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const result = await solicitudSrv.getSolicitudesByUser(
      session.user.username,
      limit,
      offset,
    );

    return {
      success: true,
      message: "Solicitudes obtenidas exitosamente",
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (e?.data && typeof e.data === "object") {
      return e.data;
    }

    return {
      error: e?.data?.error || e?.message || "Error conectando con backend",
    };
  }
});
