import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

// Helper para serializar BigInt y fechas
const _serializeData = (obj: Record<string, unknown> | unknown[] | unknown): Record<string, unknown> | unknown[] | unknown => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return (obj as unknown[]).map(_serializeData);
    }
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = _serializeData((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  return obj;
};

// Mapear documento de Prisma al formato DocumentoCargado
interface DocumentoPrisma {
  id: bigint;
  username: string;
  nombre_original: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  tipo_documento: string | null;
  saved_filename: string | null;
  tamano_bytes: bigint | null;
  tipo_mime: string | null;
  ruta_archivo: string | null;
  api_path: string | null;
  api_filename: string | null;
  solicitud_id: string | null;
  activo: boolean | null;
}

const mapDocumentoCargado = (doc: DocumentoPrisma): Record<string, unknown> => ({
  id: String(doc.id),
  nombre_original: doc.nombre_original,
  created_at: doc.created_at?.toISOString?.() || String(doc.created_at),
  documento_requerido_id: doc.tipo_documento,
  saved_filename: doc.saved_filename,
  tamano_bytes: doc.tamano_bytes ? doc.tamano_bytes.toString() : null,
  tipo_mime: doc.tipo_mime,
  ruta_archivo: doc.ruta_archivo,
  documento_uuid: doc.api_filename || doc.saved_filename,
  updated_at: doc.updated_at?.toISOString?.() || String(doc.updated_at),
  activo: doc.activo,
  solicitud_id: doc.solicitud_id
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
      where: { numero_solicitud: solicitudId }
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
        activo: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const documentosMapeados = documentos.map((doc) => mapDocumentoCargado(doc as DocumentoPrisma));

    return CustomResponse.success(
      { documentos: documentosMapeados, count: documentosMapeados.length },
      "Documentos listados exitosamente"
    );
  } catch (error: unknown) {
    const err = error as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    console.error("Error al listar documentos:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al listar documentos",
      "Error al listar documentos."
    );
  }
});
