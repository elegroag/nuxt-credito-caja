import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import usersAdmService from "~~/server/services/admin/users-adm.service";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = usersAdmService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de usuario no proporcionado",
      };
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      setResponseStatus(event, 400);
      return {
        error: "ID de usuario inválido",
      };
    }

    const user = await service.getUserById(userId);

    if (!user) {
      setResponseStatus(event, 404);
      return {
        error: "Usuario no encontrado",
      };
    }

    return {
      success: true,
      data: user,
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
