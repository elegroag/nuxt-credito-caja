import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { documentoStorage } from "~~/server/services/storage/documento-storage.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
      include: {
        pdfs_generados: true
      }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    if (!solicitud.pdfs_generados || !solicitud.pdfs_generados.path) {
      setResponseStatus(event, 404);
      return CustomResponse.error("PDF no generado para esta solicitud", "Recurso no disponible");
    }

    const pdfFilename = solicitud.pdfs_generados.filename;

    let pdfContent = await documentoStorage.obtenerPdf(solicitudId, pdfFilename);

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
      return CustomResponse.error("No se pudo leer el contenido del PDF", "Error al obtener archivo");
    }

    const pdfBuffer = Buffer.from(pdfContent, "base64");

    setResponseHeaders(event, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename}"`
    });

    return pdfBuffer;
  } catch (error: any) {
    console.error("Error al descargar PDF:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al descargar el PDF",
      "Error al descargar PDF."
    );
  }
});
