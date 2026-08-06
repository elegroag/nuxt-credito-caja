import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { z } from "zod";
import solicitantesReporteService from "~~/server/services/reports/solicitantes-reporte.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { requireAdministrator } from "~~/server/utils/requireAdministrator";
import { REPORTE_SOLICITANTES_PREVIEW_LIMIT } from "~~/shared/types/reports/solicitantes-reporte";

const filtrosSchema = z.object({
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  tipo_documento: z.string().optional(),
  estado_solicitud: z.string().optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    requireAdministrator(event);

    const filtros = filtrosSchema.parse(getQuery(event));
    const service = solicitantesReporteService();
    const rows = await service.obtenerSolicitantesReporte(filtros);

    return CustomResponse.success(
      {
        collection: rows.slice(0, REPORTE_SOLICITANTES_PREVIEW_LIMIT),
        total: rows.length,
        limit: REPORTE_SOLICITANTES_PREVIEW_LIMIT
      },
      "Vista previa del reporte obtenida exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (status === 403) {
      throw e;
    }

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error consultando reporte",
      "Error al consultar reporte de solicitantes."
    );
  }
});
