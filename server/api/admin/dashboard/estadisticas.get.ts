import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import statsAdminDashboard from "~~/server/services/admin/stats.service";

export default defineEventHandler(async (event: H3Event) => {
  const stats = statsAdminDashboard(event);
  try {
    return {
      success: true,
      message: "Proceso de consulta completado exitosamente",
      data: {
        solicitudes: await stats.solicitudes(),
        convenios: await stats.convenios(),
        usuarios: await stats.usuarios(),
        actividadReciente: await stats.actividadReciente(),
        ultimaActualizacion: new Date().toISOString(),
      },
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
