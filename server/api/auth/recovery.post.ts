import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  const payload = await readBody(event);

  try {
    const result = await authSrv._recovery(event, payload);
    return CustomResponse.success(result);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error en recovery."
    );
  }
});
