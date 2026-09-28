import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { firmarAnexosService } from "~~/server/services/admin/firmar-anexos.service";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
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

    if (await procesoFirmadoAdm.procesoQueBloqueaEnvio(id)) {
      setResponseStatus(event, 409);
      return CustomResponse.error(
        "La solicitud ya está en proceso de firma con KIAI; no se pueden eliminar anexos",
        "Anexo no permitido"
      );
    }

    const resultado = await firmarAnexosService.eliminar(id, anexoId);
    if (!resultado.success) {
      setResponseStatus(event, resultado.status);
      return CustomResponse.error(resultado.message, "Error al eliminar anexo");
    }

    return CustomResponse.success(null, "Anexo eliminado exitosamente");
  } catch (e: unknown) {
    const err = e as { message?: string };
    Log.error("anexos.delete: Error catch", { error: err?.message || "Unknown" });
    setResponseStatus(event, 500);
    return CustomResponse.error(err?.message || "Error al eliminar anexo", "Error al eliminar anexo.");
  }
});
