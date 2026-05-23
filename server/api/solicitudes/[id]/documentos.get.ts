import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

// Tipado basado en el modelo Prisma solicitud_documentos
interface SolicitudDocumentos {
  id: bigint;
  documento_uuid: string;
  solicitud_id: string;
  documento_requerido_id: string;
  nombre_original: string;
  saved_filename: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  ruta_archivo: string | null;
  activo: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}

// Mapear documento al formato de respuesta
const mapDocumentoCargado = (doc: SolicitudDocumentos): Record<string, unknown> => ({
  id: String(doc.id),
  documento_uuid: doc.documento_uuid,
  solicitud_id: doc.solicitud_id,
  documento_requerido_id: doc.documento_requerido_id,
  nombre_original: doc.nombre_original,
  saved_filename: doc.saved_filename,
  tipo_mime: doc.tipo_mime,
  tamano_bytes: doc.tamano_bytes != null ? String(doc.tamano_bytes) : null,
  ruta_archivo: doc.ruta_archivo,
  activo: doc.activo,
  created_at: doc.created_at?.toISOString() || null,
  updated_at: doc.updated_at?.toISOString() || null
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
      return CustomResponse.error(
        "No tienes permiso para ver los documentos de esta solicitud",
        "Acceso denegado"
      );
    }

    const documentos = await prisma.solicitud_documentos.findMany({
      where: {
        solicitud_id: solicitudId,
        activo: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const documentosMapeados = documentos.map((doc) =>
      mapDocumentoCargado(doc as unknown as SolicitudDocumentos)
    );

    return CustomResponse.success(
      { documentos: documentosMapeados, count: documentosMapeados.length },
      "Documentos listados exitosamente"
    );
  } catch (error: unknown) {
    const err = error as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    console.error("Error al listar documentos:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al listar documentos",
      "Error al listar documentos."
    );
  }
});