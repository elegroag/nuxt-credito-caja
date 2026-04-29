import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus, sendStream } from "h3";
import { createReadStream } from "fs";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const documentoUuid = getRouterParam(event, "uuid");
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

    if (!documentoUuid) {
      setResponseStatus(event, 400);
      return {
        error: "UUID de documento no proporcionado",
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
        error: "No tienes permiso para descargar documentos de esta solicitud",
      };
    }

    const documento = await prisma.documentos_postulantes.findFirst({
      where: {
        solicitud_id: solicitudId,
        api_filename: documentoUuid,
        activo: true,
      },
    });

    if (!documento) {
      setResponseStatus(event, 404);
      return {
        error: "Documento no encontrado",
      };
    }

    if (!documento.ruta_archivo) {
      setResponseStatus(event, 404);
      return {
        error: "Ruta del documento no disponible",
      };
    }

    const filePath = documento.ruta_archivo;

    setResponseHeaders(event, {
      "Content-Type": documento.tipo_mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${documento.nombre_original}"`,
    });

    const fileStream = createReadStream(filePath);
    return sendStream(event, fileStream);
  } catch (error: any) {
    console.error("Error al descargar documento:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al descargar documento",
    };
  }
});
