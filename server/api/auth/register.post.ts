import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

const bodySchema = z.object({
  tipo_documento: z.string().max(3),
  numero_documento: z.string().max(16),
  nombres: z.string().max(80).toUpperCase(),
  apellidos: z.string().max(80).toUpperCase(),
  telefono: z.string().max(10),
  email: z
    .string()
    .toUpperCase()
    .trim()
    .refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Email is not valid"
    }),
  confirmar_password: z.string(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  const payload = await readValidatedBody(event, bodySchema.parse);

  try {
    const result = await authSrv.register(event, payload);
    return CustomResponse.success(result);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error en registro."
    );
  }
});
