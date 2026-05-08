import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus, readBody } from "h3";
import prisma from "~~/lib/prisma";

// Estados permitidos para el usuario
const ESTADOS_PERMITIDOS = [
  "DOCUMENTOS_CARGADOS",
  "POSTULADO",
  "ENVIADO_VALIDACION",
];

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return {
        error: "No hay sesión activa",
      };
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    const body = await readBody(event);
    const { estado } = body;

    if (!estado) {
      setResponseStatus(event, 400);
      return {
        error: "Estado no proporcionado",
      };
    }

    // Validar que el estado esté permitido
    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      setResponseStatus(event, 403);
      return {
        error: "Estado no permitido para este usuario",
      };
    }

    // Verificar que la solicitud existe y pertenece al usuario
    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return {
        error: "No tienes permiso para modificar esta solicitud",
      };
    }

    // Actualizar el estado de la solicitud
    const solicitudActualizada = await prisma.solicitudes_credito.update({
      where: { numero_solicitud: solicitudId },
      data: {
        estado,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: "Estado actualizado exitosamente",
      data: {
        solicitud_id: solicitudId,
        estado: solicitudActualizada.estado,
        updated_at: solicitudActualizada.updated_at,
      },
    };
  } catch (error: any) {
    console.error("Error al cambiar estado:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al cambiar el estado",
    };
  }
});
