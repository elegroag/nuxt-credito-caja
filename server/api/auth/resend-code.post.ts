import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

const bodySchema = z.object({
  coddoc: z.string().max(3),
  documento: z.string().max(16)
});

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  const payload = await readValidatedBody(event, bodySchema.parse);

  try {
    const result = await authSrv.resendCode(payload);
    return CustomResponse.success(result, result.message || "Código reenviado.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al reenviar el código",
      "Error en reenvío."
    );
  }
});
