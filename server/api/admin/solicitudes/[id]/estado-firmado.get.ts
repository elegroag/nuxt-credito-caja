import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    // Buscar la solicitud con información de firmantes
    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id },
      include: {
        firmantes_solicitud: true,
      },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    // Calcular estado de firmado basado en los firmantes
    const totalFirmantes = solicitud.firmantes_solicitud.length;
    const firmantesCompletados = solicitud.firmantes_solicitud.filter(
      (f) => f.tipo === "FIRMADO" || f.tipo === "COMPLETADO",
    ).length;
    const firmantesPendientes = totalFirmantes - firmantesCompletados;

    // Determinar estado del proceso
    let estadoFirmado = "PENDIENTE_FIRMADO";
    if (firmantesPendientes === 0 && totalFirmantes > 0) {
      estadoFirmado = "FIRMADO";
    } else if (totalFirmantes === 0) {
      estadoFirmado = "SIN_FIRMANTES";
    }

    // Aquí se podría agregar lógica para consultar el estado actual con el proveedor de firmas
    // Por ahora retornamos el estado calculado de la base de datos

    return {
      success: true,
      message: "Estado de firmado consultado",
      data: {
        solicitud_id: solicitud.numero_solicitud,
        transaccion_id: solicitud.numero_solicitud, // Usamos el número de solicitud como ID de transacción
        estado: estadoFirmado,
        firmantes_completados: firmantesCompletados,
        firmantes_pendientes: firmantesPendientes,
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
