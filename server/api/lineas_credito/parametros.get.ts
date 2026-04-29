import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const datosApi = datosApiSisuwebService();
    const data = await datosApi.dataGeneral();

    return {
      success: true,
      message: "Parámetros obtenidos exitosamente.",
      data,
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
