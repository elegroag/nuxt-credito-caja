import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus, getQuery } from "h3";
import solicitudService from "~~/server/services/solicitud.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  const solicitudSrv = solicitudService();

  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      throw createError({
        statusCode: 401,
        message: "No session found"
      });
    }

    const query = getQuery(event);
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const result = await solicitudSrv.getSolicitudesByUser(session.user.username, limit, offset);

    return CustomResponse.success(
      { solicitudes: result.data, total: result.total, limit: result.limit, offset: result.offset },
      "Solicitudes obtenidas exitosamente"
    );
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener solicitudes."
    );
  }
});
