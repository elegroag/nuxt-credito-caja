import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  try {
    const result = await authSrv.verify(event);
    return CustomResponse.success(result, result.message || "Verificación completada.");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error en verificación.",
    );
  }
});
