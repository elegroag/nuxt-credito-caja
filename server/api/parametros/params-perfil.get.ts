import { defineEventHandler, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { CustomResponse } from "~~/server/utils/customResponse";

/**
 * GET /api/parametros/params-perfil
 *
 * Devuelve las colecciones que el formulario de Perfil necesita para
 * mostrar las descripciones legibles de los códigos que la API de
 * SISUweb maneja (datos-generales):
 *   - tipos_documento: catálogo de tipos de identificación
 *
 * Se devuelven los objetos completos (con codrua, coddoc_circular,
 * numpob, clarur, etc.) para mantener la misma forma que expone
 * /api/lineas_credito/parametros y poder reusar el cache de
 * useParametrosDetalles sin pérdida de información.
 */
export default defineEventHandler(async (event) => {
  try {
    const datosApi = datosApiSisuwebService();
    const data = (await datosApi.dataGeneral()) as {
      codigos_tipo_documento?: unknown[];
    };

    return CustomResponse.success(
      {
        tipos_documento: data?.codigos_tipo_documento || []
      },
      "Parámetros de perfil obtenidos exitosamente."
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
      "Error al obtener parámetros de perfil."
    );
  }
});
