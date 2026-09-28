import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readMultipartFormData, setResponseStatus } from "h3";
import { firmarAnexosService } from "~~/server/services/admin/firmar-anexos.service";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
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

    const session = await getUserSession(event).catch(() => null);
    const username = session?.user?.username;
    if (!username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    if (await procesoFirmadoAdm.procesoQueBloqueaEnvio(id)) {
      setResponseStatus(event, 409);
      return CustomResponse.error(
        "La solicitud ya está en proceso de firma con KIAI; no se pueden agregar anexos",
        "Anexo no permitido"
      );
    }

    const formData = await readMultipartFormData(event);
    const archivo = formData?.find((item) => item.name === "archivo");
    const tipo = formData?.find((item) => item.name === "tipo_anexo")?.data.toString();

    const resultado = await firmarAnexosService.crear(id, username, tipo, archivo);
    if (!resultado.success) {
      setResponseStatus(event, resultado.status);
      return CustomResponse.error(resultado.message, "Error al subir anexo");
    }

    return CustomResponse.success({ anexo: resultado.data }, "Anexo subido exitosamente");
  } catch (e: unknown) {
    const err = e as { message?: string };
    Log.error("anexos.post: Error catch", { error: err?.message || "Unknown" });
    setResponseStatus(event, 500);
    return CustomResponse.error(err?.message || "Error al subir anexo", "Error al subir anexo.");
  }
});
