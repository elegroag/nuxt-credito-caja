// filepath: server/api/user/perfil.put.ts
import { defineEventHandler, getHeader, readBody } from "h3";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event) => {
  try {
    const authorization = getHeader(event, "authorization");

    if (!authorization) {
      throw createError({
        statusCode: 401,
        statusMessage: "No autorizado"
      });
    }

    const body = await readBody(event);
    const config = useRuntimeConfig();

    const response = await $fetch(`${config.backendBaseUrl}/api/auth/perfil`, {
      method: "PUT",
      headers: {
        "Authorization": authorization,
        "Content-Type": "application/json"
      },
      body
    });

    return CustomResponse.success(response, "Perfil actualizado exitosamente");
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string };
    console.error("Error en endpoint /api/auth/perfil (PUT):", error);

    if (err?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Error al actualizar el perfil del usuario"
    });
  }
});
