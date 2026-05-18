import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import usersAdmService from "~~/server/services/admin/users-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = usersAdmService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de usuario no proporcionado", "Error de validación");
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de usuario inválido", "Error de validación");
    }

    const user = await service.getUserById(userId);

    if (!user) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Usuario no encontrado", "Recurso no encontrado");
    }

    return CustomResponse.success(user);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener usuario."
    );
  }
});
