import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import convenioService from "~~/server/services/convenio.service";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = convenioService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de convenio no proporcionado",
      };
    }

    const convenio = await service.obtenerConvenioPorId(Number(id));

    if (!convenio) {
      setResponseStatus(event, 404);
      return {
        error: "Convenio no encontrado",
      };
    }

    return {
      success: true,
      data: convenio,
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
