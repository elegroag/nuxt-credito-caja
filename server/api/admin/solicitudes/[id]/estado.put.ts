import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readValidatedBody, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import notificationService from "~~/server/services/notification.service";
import { z } from "zod";

// Schema de validación para cambiar estado
const cambiarEstadoSchema = z.object({
  estado: z.string().min(1, "El estado es requerido"),
  descripcion: z.string().optional()
});

// Mensajes legibles por estado para el cuerpo de la notificación al solicitante
const MENSAJE_POR_ESTADO: Record<string, string> = {
  APROBADA: "Tu solicitud de crédito ha sido aprobada.",
  DESESTIMADA: "Tu solicitud de crédito ha sido desestimada por falta de requisitos.",
  RECHAZADA: "Tu solicitud de crédito ha sido rechazada.",
  CANCELADA: "Tu solicitud de crédito ha sido cancelada.",
  DESISTE: "Has desistido de continuar con tu solicitud de crédito."
};

// Títulos legibles por estado (campo `titulo` de la notificación)
const TITULO_POR_ESTADO: Record<string, string> = {
  APROBADA: "Solicitud aprobada",
  DESESTIMADA: "Solicitud desestimada",
  RECHAZADA: "Solicitud rechazada",
  CANCELADA: "Solicitud cancelada",
  DESISTE: "Has desistido de la solicitud"
};

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const payload = await readValidatedBody(event, cambiarEstadoSchema.parse);

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    const session = await getUserSession(event).catch(() => null);
    const adminUsername = session?.user?.username || "sistema";

    const solicitudActualizada = await prisma.solicitudes_credito.update({
      where: { numero_solicitud: id },
      data: {
        estado: payload.estado
      }
    });

    // Registrar entrada en el timeline de la solicitud
    const detalleTimeline = payload.descripcion
      ? `${MENSAJE_POR_ESTADO[payload.estado] || `Estado cambiado a ${payload.estado}.`} ${payload.descripcion}`
      : MENSAJE_POR_ESTADO[payload.estado] || `Estado cambiado a ${payload.estado}.`;

    try {
      await prisma.solicitud_timeline.create({
        data: {
          solicitud_id: id,
          estado: payload.estado,
          fecha: new Date(),
          detalle: detalleTimeline,
          usuario_username: adminUsername,
          automatico: false
        }
      });
    } catch (timelineErr) {
      console.error("estado.put: No se pudo crear entrada en timeline:", timelineErr);
    }

    // Crear notificación para el solicitante (owner de la solicitud)
    try {
      const notifSrv = notificationService();
      const estadoAnterior = solicitud.estado;
      const estadoNombre = MENSAJE_POR_ESTADO[payload.estado]
        ? payload.estado.charAt(0) + payload.estado.slice(1).toLowerCase()
        : payload.estado;

      await notifSrv.createNotification({
        owner_username: solicitud.owner_username,
        type: "solicitud.estado.actualizado",
        data: {
          titulo: TITULO_POR_ESTADO[payload.estado] || "Actualización de tu solicitud",
          solicitud_id: id,
          estado_anterior: estadoAnterior,
          estado_nuevo: payload.estado,
          estado_nuevo_nombre: estadoNombre,
          mensaje: detalleTimeline,
          descripcion_admin: payload.descripcion || null,
          actualizado_por: adminUsername
        }
      });
    } catch (notifErr) {
      console.error("estado.put: No se pudo crear la notificación al solicitante:", notifErr);
    }

    return CustomResponse.success(
      {
        numero_solicitud: solicitudActualizada.numero_solicitud,
        estado: solicitudActualizada.estado
      },
      "Estado actualizado exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al actualizar estado."
    );
  }
});
