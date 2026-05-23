import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import apiFlaskPdf from "~~/server/services/api-flaskpdf";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";
import type {
  Ciudades,
  Paises,
  Ocupacion,
  SectorEconomico,
  CodigoTipoDocumento,
  TipoViviendaParam,
  EstadoCivil,
  NivelEducativoParam,
  SexoParam,
  TipoContratoParam
} from "~~/shared/types/parametros";
import pdfPayloadService from "~~/server/services/pdf/pdf-payload.service";
import pdfStorageService from "~~/server/services/pdf/pdf-storage.service";

const Log = loggerService();

interface PdfPayloadData {
  informacion_laboral?: Record<string, unknown>;
  ingresos_descuentos?: Record<string, unknown>;
  informacion_economica?: Record<string, unknown>;
  propiedades?: unknown[];
  deudas?: unknown[];
  referencias?: { familiares?: unknown[]; personales?: unknown[] };
}

interface FlaskPdfResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  errors?: unknown;
}

export default defineEventHandler(async (event: H3Event) => {
  let solicitudId: string = "";

  try {
    const rawSolicitudId = getRouterParam(event, "id");

    if (!rawSolicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    solicitudId = rawSolicitudId;

    // ---- 1. Obtener solicitud desde Prisma ----
    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
      include: {
        pdfs_generados: true,
        solicitud_solicitante: true,
        firmantes_solicitud: {
          orderBy: { orden: "asc" }
        },
        solicitud_payload: {
          orderBy: { created_at: "desc" },
          take: 1
        }
      }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    // ---- 2. Cargar catálogos de parámetros ----
    const datosApi = datosApiSisuwebService();
    let catalogosParam = {
      ciudades: [] as readonly Ciudades[],
      paises: [] as readonly Paises[],
      ocupaciones: [] as readonly Ocupacion[],
      sectores_economicos: [] as readonly SectorEconomico[],
      codigos_tipo_documento: [] as readonly CodigoTipoDocumento[],
      tipo_vivienda: [] as readonly TipoViviendaParam[],
      tipo_contrato: [] as readonly TipoContratoParam[],
      nivel_educativos: [] as readonly NivelEducativoParam[],
      sexos: [] as readonly SexoParam[],
      estado_civiles: [] as readonly EstadoCivil[]
    };

    try {
      const datosGenerales = (await datosApi.dataGeneral()) as {
        ciudades?: readonly Ciudades[];
        paises?: readonly Paises[];
        ocupaciones?: readonly Ocupacion[];
        nivel_educativos?: readonly NivelEducativoParam[];
        tipo_vivienda?: readonly TipoViviendaParam[];
        tipo_contrato?: readonly TipoContratoParam[];
        sectores_economicos?: readonly SectorEconomico[];
        sexos?: readonly SexoParam[];
        codigos_tipo_documento?: readonly CodigoTipoDocumento[];
        estado_civiles?: readonly EstadoCivil[];
      } | null;

      if (datosGenerales) {
        catalogosParam = {
          ciudades: datosGenerales.ciudades || [],
          paises: datosGenerales.paises || [],
          ocupaciones: datosGenerales.ocupaciones || [],
          sectores_economicos: datosGenerales.sectores_economicos || [],
          codigos_tipo_documento: datosGenerales.codigos_tipo_documento || [],
          tipo_vivienda: datosGenerales.tipo_vivienda || [],
          tipo_contrato: datosGenerales.tipo_contrato || [],
          nivel_educativos: datosGenerales.nivel_educativos || [],
          sexos: datosGenerales.sexos || [],
          estado_civiles: datosGenerales.estado_civiles || []
        };
      }
    } catch {
      await Log.warn("No se pudieron cargar catálogos, usando códigos sin resolver", {
        solicitudId
      });
    }

    // ---- 3. Extraer datos del payload JSON ----
    const rawPayload = solicitud.solicitud_payload?.[0];
    const payloadData = rawPayload as Record<string, unknown> as PdfPayloadData | undefined;
    const informacionLaboral = (payloadData?.informacion_laboral || {}) as Record<string, unknown>;
    const ingresosDescuentos = (payloadData?.ingresos_descuentos || {}) as Record<string, unknown>;
    const informacionEconomica = (payloadData?.informacion_economica || {}) as Record<
      string,
      unknown
    >;
    const propiedades = payloadData?.propiedades || [];
    const deudas = payloadData?.deudas || [];
    const referencias = payloadData?.referencias || { familiares: [], personales: [] };

    // ---- 4. Construir payload con el servicio ----
    const builder = pdfPayloadService();
    const payload = builder.buildPayload(
      solicitud,
      catalogosParam,
      informacionLaboral,
      ingresosDescuentos,
      informacionEconomica,
      propiedades,
      deudas,
      { familiares: referencias.familiares ?? [], personales: referencias.personales ?? [] }
    );

    await Log.debug("Payload construido para Flask PDF", payload);

    // ---- 5. Enviar a Flask PDF ----
    const flaskPdf = apiFlaskPdf();
    const response = await flaskPdf.generatePdf<FlaskPdfResponse>(payload);

    await Log.info("Respuesta de Flask PDF", {
      solicitudId,
      success: response.success,
      message: response.message
    });

    if (!response.success) {
      await Log.error("Flask PDF retornó error", {
        solicitudId,
        success: response.success,
        message: response.message,
        errors: response.errors
      });
      setResponseStatus(event, 500);
      return CustomResponse.error(
        response.message || "Error al generar el PDF",
        "Error en Flask PDF"
      );
    }

    const pdfData = response.data as Record<string, unknown>;

    // ---- 6. Guardar PDF en storage + DB ----
    const storage = pdfStorageService();
    const { filename, path } = await storage.guardar(solicitudId, pdfData);

    await Log.info("PDF generado exitosamente", {
      solicitudId,
      filename,
      path
    });

    return CustomResponse.success(
      {
        solicitud_id: solicitudId,
        filename,
        path
      },
      "PDF generado exitosamente"
    );
  } catch (error: unknown) {
    const err = error as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
      stack?: string;
    };
    const sid = typeof solicitudId === "string" ? solicitudId : "unknown";
    await Log.error("Error al generar PDF", error as Error, {
      solicitudId: sid,
      stack: err?.stack
    });
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al generar el PDF",
      "Error al generar PDF."
    );
  }
});