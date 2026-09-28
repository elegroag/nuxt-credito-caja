import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, sendStream, setResponseHeaders, setResponseStatus } from "h3";
import { createReadStream, existsSync } from "fs";
import { firmarAnexosService } from "~~/server/services/admin/firmar-anexos.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");
    const anexoId = getRouterParam(event, "anexoId");
    if (!id || !anexoId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud o de anexo no proporcionado", "Error de validación");
    }

    const archivo = await firmarAnexosService.obtenerArchivo(id, anexoId);
    if (!archivo || !existsSync(archivo.ruta)) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Anexo no encontrado", "Recurso no encontrado");
    }

    setResponseHeaders(event, {
      "Content-Type": archivo.tipoMime,
      "Content-Disposition": `attachment; filename="${archivo.savedFilename}"`
    });
    return sendStream(event, createReadStream(archivo.ruta));
  } catch (e: unknown) {
    const err = e as { message?: string };
    Log.error("anexos.descargar: Error catch", { error: err?.message || "Unknown" });
    setResponseStatus(event, 500);
    return CustomResponse.error(err?.message || "Error al descargar anexo", "Error al descargar anexo.");
  }
});
