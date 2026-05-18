import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import statsAdminDashboard from "~~/server/services/admin/stats.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  const stats = statsAdminDashboard(event);
  try {
    return CustomResponse.success(
      {
        solicitudes: await stats.solicitudes(),
        convenios: await stats.convenios(),
        usuarios: await stats.usuarios(),
        actividadReciente: await stats.actividadReciente(),
        ultimaActualizacion: new Date().toISOString()
      },
      "Consulta completada exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener estadísticas."
    );
  }
});
