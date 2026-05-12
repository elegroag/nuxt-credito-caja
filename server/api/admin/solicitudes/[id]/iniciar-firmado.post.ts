import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const resultado = await procesoFirmadoAdm.iniciarFirmado({
      solicitudId: id
    });

    if (!resultado.success) {
      setResponseStatus(event, 400);
      return CustomResponse.error(resultado.message, "Error al iniciar firmado");
    }

    return CustomResponse.success(resultado.data, resultado.message);
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al iniciar firmado."
    );
  }
});
