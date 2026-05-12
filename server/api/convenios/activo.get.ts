import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import convenioService from "~~/server/services/convenio.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  const convenioSrv = convenioService();

  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      throw createError({
        statusCode: 401,
        message: "No session found"
      });
    }

    const convenios = await convenioSrv.getConveniosByUser(
      session.user.username
    );

    return CustomResponse.success(convenios, "Convenios obtenidos exitosamente");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener convenios."
    );
  }
});
