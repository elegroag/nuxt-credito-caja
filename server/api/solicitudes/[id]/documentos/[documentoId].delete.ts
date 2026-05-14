import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const documentoId = getRouterParam(event, "documentoId");
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

    if (!documentoId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de documento no proporcionado",
        "Error de validación"
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
        "No tienes permiso para eliminar documentos de esta solicitud",
        "Acceso denegado"
      );
    }

    const documento = await prisma.documentos_postulantes.findFirst({
      where: {
        id: BigInt(documentoId),
        solicitud_id: solicitudId
      }
    });

    if (!documento) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        "Documento no encontrado",
        "Recurso no encontrado"
      );
    }

    await prisma.documentos_postulantes.delete({
      where: { id: documento.id }
    });

    return CustomResponse.ok(null, "Documento eliminado exitosamente");
  } catch (error: any) {
    console.error("Error al eliminar documento:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al eliminar documento",
      "Error al eliminar documento."
    );
  }
});
