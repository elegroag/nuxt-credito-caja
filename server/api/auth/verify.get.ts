import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  try {
    const result = await authSrv.verify(event);
    return {
      success: true,
      message: result.message || "Proceso de verificación completado.",
      data: result,
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
