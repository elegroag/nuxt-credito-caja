import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

// Helper para serializar BigInt y fechas
const serializeData = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeData);
    }
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeData(obj[key]);
    }
    return result;
  }
  return obj;
};

// Mapear documento de Prisma al formato DocumentoCargado
const mapDocumentoCargado = (doc: any): any => ({
  id: String(doc.id),
  nombre_original: doc.nombre_original,
  created_at: doc.created_at?.toISOString?.() || String(doc.created_at),
  documento_requerido_id: doc.tipo_documento,
  saved_filename: doc.saved_filename,
  tamano_bytes: doc.tamano_bytes,
  tipo_mime: doc.tipo_mime,
  ruta_archivo: doc.ruta_archivo,
  documento_uuid: doc.api_filename || doc.saved_filename,
  updated_at: doc.updated_at?.toISOString?.() || String(doc.updated_at),
  activo: doc.activo,
  solicitud_id: doc.solicitud_id,
});

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
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error("No tienes permiso para ver los documentos de esta solicitud", "Acceso denegado");
    }

    const documentos = await prisma.documentos_postulantes.findMany({
      where: {
        solicitud_id: solicitudId,
        activo: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const documentosMapeados = documentos.map(mapDocumentoCargado);

    return CustomResponse.success(
      { documentos: documentosMapeados, count: documentosMapeados.length },
      "Documentos listados exitosamente",
    );
  } catch (error: any) {
    console.error("Error al listar documentos:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al listar documentos",
      "Error al listar documentos.",
    );
  }
});
