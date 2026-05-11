import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import AuthService from "~~/server/services/auth.service";
import { z } from "zod";
import { CustomResponse } from "~~/server/utils/customResponse";

const bodySchema = z.object({
  username: z.string().min(3, "Username debe tener al menos 3 caracteres"),
  password: z.string().min(8, "Password debe tener al menos 8 caracteres"),
});

export default defineEventHandler(async (event: H3Event) => {
  const authService = AuthService();
  const { username, password } = await readValidatedBody(
    event,
    bodySchema.parse,
  );

  try {
    const result = await authService.login(event, {
      username,
      password,
    });

    return CustomResponse.success(
      result,
      result.message || "Login completado.",
    );
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error en el proceso de login.",
    );
  }
});
