import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const documentoId = getRouterParam(event, "documentoId");
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

    if (!documentoId) {
      setResponseStatus(event, 400);
      return {
        error: "ID de documento no proporcionado",
      };
    }

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
        error: "No tienes permiso para eliminar documentos de esta solicitud",
      };
    }

    const documento = await prisma.documentos_postulantes.findFirst({
      where: {
        id: BigInt(documentoId),
        solicitud_id: solicitudId,
      },
    });

    if (!documento) {
      setResponseStatus(event, 404);
      return {
        error: "Documento no encontrado",
      };
    }

    await prisma.documentos_postulantes.delete({
      where: { id: BigInt(documentoId) },
    });

    return {
      success: true,
      message: "Documento eliminado exitosamente",
    };
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al eliminar documento",
    };
  }
});
