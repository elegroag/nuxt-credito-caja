import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const bloqueante = await procesoFirmadoAdm.procesoQueBloqueaFirmantes(id);
    if (bloqueante) {
      setResponseStatus(event, 409);
      return CustomResponse.error(
        "Los firmantes no se pueden eliminar mientras exista un proceso de firma con KIAI",
        "Eliminación de firmante no permitida"
      );
    }

    const body = await readBody<{ firmanteId: string }>(event);

    if (!body?.firmanteId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de firmante no proporcionado", "Error de validación");
    }

    await prisma.firmantes_solicitud.delete({
      where: {
        id: BigInt(body.firmanteId),
        solicitud_id: id
      }
    });

    return CustomResponse.success(null, "Firmante eliminado exitosamente");
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 502);
    return CustomResponse.error(
      err?.message || "Error conectando con backend",
      "Error al eliminar firmante."
    );
  }
});
