import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { CustomResponse } from "~~/server/utils/customResponse";

interface TipoDocumento {
  coddoc: string;
  detdoc: string;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const datosApi = datosApiSisuwebService();
    const data = (await datosApi.dataGeneral()) as { codigos_tipo_documento?: TipoDocumento[] };

    const codigosTipoDocumento = data?.codigos_tipo_documento || [];

    return CustomResponse.success(
      codigosTipoDocumento,
      "Tipos de documento obtenidos exitosamente."
    );
  } catch (e: unknown) {
    const err = e as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener tipos de documento."
    );
  }
});
