import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseHeader, setResponseStatus } from "h3";
import { z } from "zod";
import { generarReporteSolicitantesExcel } from "~~/server/services/reports/solicitantes-excel.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { requireAdministrator } from "~~/server/utils/requireAdministrator";

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
    const { buffer, filename } = await generarReporteSolicitantesExcel(filtros);

    setResponseHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    setResponseHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);
    setResponseHeader(event, "Content-Length", buffer.length);
    setResponseHeader(event, "Cache-Control", "no-store");

    return buffer;
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (status === 403) {
      throw e;
    }

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error generando reporte",
      "Error al generar reporte de solicitantes."
    );
  }
});
