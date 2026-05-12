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
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener estadísticas."
    );
  }
});
