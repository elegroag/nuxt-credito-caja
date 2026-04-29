import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import solicitudService from "~~/server/services/solicitud.service";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = solicitudService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    const solicitud = await service.getSolicitudById(id);

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    return {
      success: true,
      data: solicitud,
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
