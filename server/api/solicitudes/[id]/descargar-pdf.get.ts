import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { documentoStorage } from "~~/server/services/storage/documento-storage.service";

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

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
      include: {
        pdfs_generados: true,
      },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    if (!solicitud.pdfs_generados || !solicitud.pdfs_generados.path) {
      setResponseStatus(event, 404);
      return {
        error: "PDF no generado para esta solicitud",
      };
    }

    const pdfFilename = solicitud.pdfs_generados.filename;

    // Intentar obtener el PDF desde el storage
    let pdfContent = await documentoStorage.obtenerPdf(
      solicitudId,
      pdfFilename,
    );

    // Si no está en el storage, intentar leer desde la ruta guardada
    if (!pdfContent && solicitud.pdfs_generados.path) {
      try {
        const { readFile } = await import("fs/promises");
        const buffer = await readFile(solicitud.pdfs_generados.path);
        pdfContent = buffer.toString("base64");
      } catch (readError) {
        console.error("Error leyendo archivo desde ruta:", readError);
      }
    }

    if (!pdfContent) {
      setResponseStatus(event, 404);
      return {
        error: "No se pudo leer el contenido del PDF",
      };
    }

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(pdfContent, "base64");

    setResponseHeaders(event, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename}"`,
    });

    return pdfBuffer;
  } catch (error: any) {
    console.error("Error al descargar PDF:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error:
        error?.data?.error || error?.message || "Error al descargar el PDF",
    };
  }
});
