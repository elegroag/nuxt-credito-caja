import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import apiFlaskPdf from "~~/server/services/api-flaskpdf";

// Helper para serializar datos antes de enviar a Flask PDF
const serializeForPdf = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeForPdf);
    }
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeForPdf(obj[key]);
    }
    return result;
  }
  return obj;
};

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
        solicitud_solicitante: true,
      },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    const flaskPdf = apiFlaskPdf();

    // Extraer y estructurar datos para Flask PDF
    const { solicitud_solicitante, pdfs_generados, ...solicitudData } =
      solicitud;

    const payload = {
      solicitud_id: solicitudId,
      solicitud: serializeForPdf(solicitudData),
      solicitante: serializeForPdf(solicitud_solicitante?.[0] || null),
      encabezado: {
        titulo: "SOLICITUD DE CRÉDITO",
        subtitulo: solicitudData.numero_solicitud || solicitudId,
        fecha: new Date().toLocaleDateString("es-CO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
      laboral: {
        empresa: "",
        cargo: solicitud_solicitante?.[0]?.cargo || "",
        antiguedad: "",
        tipo_contrato: "",
      },
    };

    console.log("Generando PDF para solicitud:", solicitudId);

    const response = await flaskPdf.generatePdf<any>(payload);

    console.log("Respuesta de Flask PDF:", response);

    if (!response.success) {
      setResponseStatus(event, 500);
      return {
        error: response.message || "Error al generar el PDF",
      };
    }

    const pdfData = response.data as any;

    if (solicitud.pdfs_generados) {
      await prisma.pdfs_generados.update({
        where: { solicitud_id: solicitudId },
        data: {
          path: pdfData.path,
          filename: pdfData.filename,
          generado_en: pdfData,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.pdfs_generados.create({
        data: {
          solicitud_id: solicitudId,
          path: pdfData.path,
          filename: pdfData.filename,
          generado_en: pdfData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return {
      success: true,
      message: "PDF generado exitosamente",
      data: {
        solicitud_id: solicitudId,
        filename: pdfData.filename,
        path: pdfData.path,
      },
    };
  } catch (error: any) {
    console.error("Error al generar PDF:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al generar el PDF",
    };
  }
});
