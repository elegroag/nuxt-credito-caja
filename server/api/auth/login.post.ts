import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  const { username, password } = await readValidatedBody(
    event,
    bodySchema.parse,
  );

  try {
    const result = await authSrv.login(event, {
      username,
      password,
    });

    return {
      success: true,
      message: result.message || "Proceso de login completado.",
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
