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

    // Verificar que el usuario sea el dueño
    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return {
        error: "No tienes permiso para ver esta solicitud",
      };
    }

    // Verificar si existe el PDF en el storage
    const existeEnStorage = await documentoStorage.existePdf(
      solicitudId,
      solicitud.pdfs_generados?.filename
    );

    // Verificar si existe en la ruta guardada
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

    return {
      success: true,
      data: {
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
      message: tienePdf ? "PDF disponible" : "PDF no generado",
    };
  } catch (error: any) {
    console.error("Error al verificar estado del PDF:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error:
        error?.data?.error ||
        error?.message ||
        "Error al verificar el estado del PDF",
    };
  }
});
