// filepath: server/api/user/perfil.put.ts
import { defineEventHandler, getHeader, readBody } from "h3";
import { CustomResponse } from "~~/server/utils/customResponse";

interface FetchError {
  statusCode?: number;
  status?: number;
  statusMessage?: string;
  message?: string;
  data?: { message?: string; error?: string };
}

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
    const err = error as FetchError;

    // Si el backend respondió con un status HTTP, propagar ese mismo status
    // para que el cliente vea el error real (validación 4xx, no autorizado,
    // etc.) en vez del 500 genérico.
    const upstreamStatus = err?.statusCode ?? err?.status;
    if (upstreamStatus && upstreamStatus >= 400) {
      console.error(
        "[PUT /api/user/perfil] Backend rechazó la solicitud:",
        upstreamStatus,
        err?.data || err?.message
      );
      throw createError({
        statusCode: upstreamStatus,
        statusMessage: err?.data?.message || err?.statusMessage || err?.message,
        data: err?.data
      });
    }

    // Cualquier otro fallo (red, parseo, etc.) cae aquí. Mostrar el mensaje
    // real del error para que sea accionable en lugar de un 500 opaco.
    console.error("[PUT /api/user/perfil] Error sin statusCode:", error);
    const detail = err?.message || "Error desconocido al actualizar el perfil";
    throw createError({
      statusCode: 500,
      statusMessage: `Error al actualizar el perfil del usuario: ${detail}`,
      data: { error: detail }
    });
  }
});
