import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { firmarAnexosService } from "~~/server/services/admin/firmar-anexos.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const anexos = await firmarAnexosService.listar(id);
    return CustomResponse.success({ anexos }, "Anexos obtenidos");
  } catch (e: unknown) {
    const err = e as { message?: string };
    Log.error("anexos.get: Error catch", { error: err?.message || "Unknown" });
    setResponseStatus(event, 500);
    return CustomResponse.error(err?.message || "Error al listar anexos", "Error al listar anexos.");
  }
});
