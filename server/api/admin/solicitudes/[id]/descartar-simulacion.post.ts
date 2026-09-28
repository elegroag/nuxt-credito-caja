import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const resultado = await procesoFirmadoAdm.descartarSimulacion(id);
    if (!resultado.success) {
      setResponseStatus(event, 400);
      return CustomResponse.error(resultado.message, "Error al descartar la simulación");
    }

    const session = await getUserSession(event).catch(() => null);
    const username = session?.user?.username || "system";
    const now = new Date();
    const procesoId = resultado.data?.transaccion_id || "N/A";

    // Solo se revierte si la simulación había dejado la solicitud en firma
    const estadoSolicitud = await prisma.$transaction(async (tx) => {
      const { count } = await tx.solicitudes_credito.updateMany({
        where: { numero_solicitud: id, estado: "PENDIENTE_FIRMADO" },
        data: { estado: "APROBADA", updated_at: now }
      });
      if (count === 0) {
        const actual = await tx.solicitudes_credito.findUnique({
          where: { numero_solicitud: id },
          select: { estado: true }
        });
        return actual?.estado ?? null;
      }
      await tx.solicitud_timeline.create({
        data: {
          solicitud_id: id,
          estado: "APROBADA",
          fecha: now,
          detalle: `Simulación de firma descartada por el administrador. Proceso: ${procesoId}. La solicitud puede reenviarse a firma.`,
          usuario_username: username
        }
      });
      return "APROBADA";
    });

    Log.info("descartar-simulacion: Simulación descartada", { solicitudId: id, procesoId, username, estadoSolicitud });

    return CustomResponse.success(
      { solicitud_id: id, estado_solicitud: estadoSolicitud, transaccion_id: procesoId },
      "Simulación descartada. La solicitud puede reenviarse a firma."
    );
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 500);
    Log.error("descartar-simulacion: Error catch", { error: err?.message || "Unknown" });

    return CustomResponse.error(
      err?.message || "Error al descartar la simulación",
      "Error al descartar la simulación."
    );
  }
});
