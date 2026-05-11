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
        pdfs_generados: true,
      },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error("No tienes permiso para ver esta solicitud", "Acceso denegado");
    }

    const existeEnStorage = await documentoStorage.existePdf(
      solicitudId,
      solicitud.pdfs_generados?.filename
    );

    let existeEnRuta = false;
    if (solicitud.pdfs_generados?.path && !existeEnStorage) {
      try {
        const { access } = await import("fs/promises");
        await access(solicitud.pdfs_generados.path);
        existeEnRuta = true;
      } catch {
        existeEnRuta = false;
      }
    }

    const tienePdf = existeEnStorage || existeEnRuta;

    return CustomResponse.success(
      {
        solicitud_id: solicitudId,
        tiene_pdf: tienePdf,
        pdf_generado: solicitud.pdfs_generados
          ? {
              filename: solicitud.pdfs_generados.filename,
              generado_en: solicitud.pdfs_generados.generado_en,
              archivo_existe: tienePdf,
              path: solicitud.pdfs_generados.path,
            }
          : null,
      },
      tienePdf ? "PDF disponible" : "PDF no generado",
    );
  } catch (error: any) {
    console.error("Error al verificar estado del PDF:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al verificar el estado del PDF",
      "Error al verificar PDF.",
    );
  }
});
