import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import convenioService from "~~/server/services/convenio.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = convenioService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de convenio no proporcionado", "Error de validación");
    }

    const convenio = await service.obtenerConvenioPorId(Number(id));

    if (!convenio) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Convenio no encontrado", "Recurso no encontrado");
    }

    return CustomResponse.success(convenio);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener convenio."
    );
  }
});
