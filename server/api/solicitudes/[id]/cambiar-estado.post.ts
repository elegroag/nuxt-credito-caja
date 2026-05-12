import type { H3Event } from "h3";
import {
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
  readBody
} from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

// Estados permitidos para el usuario
const ESTADOS_PERMITIDOS = [
  "DOCUMENTOS_CARGADOS",
  "POSTULADO",
  "ENVIADO_VALIDACION"
];

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error(
        "No hay sesión activa",
        "Error de autenticación"
      );
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de solicitud no proporcionado",
        "Error de validación"
      );
    }

    const body = await readBody(event);
    const { estado } = body;

    if (!estado) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "Estado no proporcionado",
        "Error de validación"
      );
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "Estado no permitido para este usuario",
        "Acceso denegado"
      );
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        "Solicitud no encontrada",
        "Recurso no encontrado"
      );
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "No tienes permiso para modificar esta solicitud",
        "Acceso denegado"
      );
    }

    const solicitudActualizada = await prisma.solicitudes_credito.update({
      where: { numero_solicitud: solicitudId },
      data: {
        estado,
        updated_at: new Date()
      }
    });

    return CustomResponse.success(
      {
        solicitud_id: solicitudId,
        estado: solicitudActualizada.estado,
        updated_at: solicitudActualizada.updated_at
      },
      "Estado actualizado exitosamente"
    );
  } catch (error: any) {
    console.error("Error al cambiar estado:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al cambiar el estado",
      "Error al cambiar estado."
    );
  }
});
