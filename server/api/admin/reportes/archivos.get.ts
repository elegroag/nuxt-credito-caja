import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import reporteStorageService from "~~/server/services/reports/reporte-storage.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { requireAdministrator } from "~~/server/utils/requireAdministrator";

export default defineEventHandler(async (event: H3Event) => {
  try {
    requireAdministrator(event);

    const storageService = reporteStorageService();
    const archivos = await storageService.listarReportes();

    return CustomResponse.success(
      { collection: archivos, total: archivos.length },
      "Reportes guardados obtenidos exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (status === 403) {
      throw e;
    }

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error listando reportes",
      "Error al listar reportes guardados."
    );
  }
});
