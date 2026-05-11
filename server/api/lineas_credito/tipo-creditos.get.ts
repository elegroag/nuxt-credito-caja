import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const datosApi = datosApiSisuwebService();
    const data = await datosApi.tipoCreditos();

    return CustomResponse.success(data, "Tipos de créditos obtenidos exitosamente.");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener tipos de crédito.",
    );
  }
});
