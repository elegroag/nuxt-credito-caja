import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const documentoId = getRouterParam(event, "documentoId");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    if (!solicitudId || !documentoId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Parámetros incompletos", "Error de validación");
    }

    // Obtener la solicitud para verificar permisos
    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    // Solo admin o el owner pueden eliminar
    const isAdmin =
      Array.isArray(session.user.roles) && session.user.roles.includes("administrator");
    if (!isAdmin && solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "No tienes permiso para eliminar documentos de esta solicitud",
        "Acceso denegado"
      );
    }

    // Buscar el documento por su id
    const documentoIdBigInt = BigInt(documentoId);

    const documento = await prisma.solicitud_documentos.findFirst({
      where: {
        id: documentoIdBigInt,
        solicitud_id: solicitudId
      }
    });

    if (!documento) {
      // Verificar si existe pero ya está inactivo (soft deleted previamente)
      const docInactivo = await prisma.solicitud_documentos.findFirst({
        where: { id: documentoIdBigInt, solicitud_id: solicitudId }
      });
      if (!docInactivo) {
        // Ya está eliminado — comportamiento idempotente
        return CustomResponse.success(
          { id: documentoId, yaEliminado: true },
          "Documento ya había sido eliminado"
        );
      }
      setResponseStatus(event, 404);
      return CustomResponse.error("Documento no encontrado", "Recurso no encontrado");
    }

    // Eliminar el archivo físico
    if (documento.ruta_archivo) {
      const filePath = join(process.cwd(), documento.ruta_archivo);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }

    // delete definitivo
    await prisma.solicitud_documentos.delete({
      where: { id: documento.id }
    });

    return CustomResponse.success({ id: documentoId }, "Documento eliminado exitosamente");
  } catch (error: unknown) {
    const err = error as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    console.error("Error al eliminar documento:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al eliminar documento",
      "Error al eliminar documento."
    );
  }
});
