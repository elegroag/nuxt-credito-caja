import type { H3Event } from "h3";
import { defineEventHandler } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const contextUser = event.context.user;

    if (!contextUser) {
      throw createError({ statusCode: 401, statusMessage: "No autenticado" });
    }

    const user = await prisma.users.findUnique({
      where: { id: contextUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        nombres: true,
        apellidos: true,
        phone: true,
        tipo_documento: true,
        numero_documento: true,
        roles: true,
        is_active: true,
        disabled: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "Usuario no encontrado"
      });
    }

    return CustomResponse.success(
      { ...user, id: Number(user.id) },
      "Perfil obtenido exitosamente"
    );
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Error al obtener el perfil"
    });
  }
});
