import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import authService from "~~/server/services/auth.service";
import { z } from "zod";

const bodySchema = z.object({
  tipo_documento: z.string(),
  numero_documento: z.string(),
  nombres: z.string().max(80),
  apellidos: z.string().max(80),
  telefono: z.string().max(10),
  email: z
    .string()
    .toLowerCase()
    .trim()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Email is not valid",
    }),
  confirmar_password: z.string(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default defineEventHandler(async (event: H3Event) => {
  const authSrv = authService();
  const payload = await readValidatedBody(event, bodySchema.parse);

  try {
    const result = await authSrv.register(event, payload);
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
