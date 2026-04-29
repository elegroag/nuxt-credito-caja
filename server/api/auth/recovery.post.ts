import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  const payload = await readBody(event);

  try {
    const result = await authSrv.recovery(event, payload);
    return result;
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
