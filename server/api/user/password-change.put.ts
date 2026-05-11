import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import bcrypt from "bcryptjs";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

const bodySchema = z.object({
  current_password: z.string().min(1, "La contraseña actual es requerida"),
  new_password: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { current_password, new_password } = await readValidatedBody(
      event,
      bodySchema.parse,
    );

    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.id) {
      setResponseStatus(event, 401);
      return CustomResponse.error(
        "No hay sesión activa",
        "Error de autenticación",
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: Number(session.user.id) },
    });

    if (!user) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        "Usuario no encontrado",
        "Recurso no encontrado",
      );
    }

    const isPasswordValid = bcrypt.compareSync(
      current_password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "La contraseña actual es incorrecta",
        "Validación fallida",
      );
    }

    const newPasswordHash = bcrypt.hashSync(new_password, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date(),
      },
    });

    return CustomResponse.ok(null, "Contraseña actualizada exitosamente");
  } catch (error: any) {
    console.error("Error en endpoint /api/user/password-change (PUT):", error);

    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al cambiar la contraseña",
      "Error al cambiar contraseña.",
    );
  }
});
