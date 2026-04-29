import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    const resultado = await procesoFirmadoAdm.iniciarFirmado({
      solicitudId: id,
    });

    if (!resultado.success) {
      setResponseStatus(event, 400);
      return {
        error: resultado.message,
      };
    }

    return {
      success: true,
      message: resultado.message,
      data: resultado.data,
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
