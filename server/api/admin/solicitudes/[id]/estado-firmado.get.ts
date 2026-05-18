import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id },
      include: {
        firmantes_solicitud: true
      }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    const totalFirmantes = solicitud.firmantes_solicitud.length;
    const firmantesCompletados = solicitud.firmantes_solicitud.filter(
      f => f.tipo === "FIRMADO" || f.tipo === "COMPLETADO"
    ).length;
    const firmantesPendientes = totalFirmantes - firmantesCompletados;

    let estadoFirmado = "PENDIENTE_FIRMADO";
    if (firmantesPendientes === 0 && totalFirmantes > 0) {
      estadoFirmado = "FIRMADO";
    } else if (totalFirmantes === 0) {
      estadoFirmado = "SIN_FIRMANTES";
    }

    return CustomResponse.success(
      {
        solicitud_id: solicitud.numero_solicitud,
        transaccion_id: solicitud.numero_solicitud,
        estado: estadoFirmado,
        firmantes_completados: firmantesCompletados,
        firmantes_pendientes: firmantesPendientes
      },
      "Estado de firmado consultado"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al consultar estado de firmado."
    );
  }
});
