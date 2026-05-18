import type { H3Event } from "h3";
import {
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
  readMultipartFormData
} from "h3";
import prisma from "~~/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { CustomResponse } from "~~/server/utils/customResponse";

// Helper para serializar fechas y BigInt
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
interface DocumentoCargado {
  id: string;
  nombre_original: string;
  created_at: string;
  documento_requerido_id: string;
  saved_filename: string;
  tamano_bytes: number;
  tipo_mime: string;
  ruta_archivo: string;
  documento_uuid: string;
  updated_at: string;
  activo: boolean;
  solicitud_id: string;
}

const mapDocumentoCargado = (doc: Record<string, unknown>): DocumentoCargado => ({
  id: String(doc.id),
  nombre_original: doc.nombre_original as string,
  created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at),
  documento_requerido_id: doc.tipo_documento as string,
  saved_filename: doc.saved_filename as string,
  tamano_bytes: doc.tamano_bytes as number,
  tipo_mime: doc.tipo_mime as string,
  ruta_archivo: doc.ruta_archivo as string,
  documento_uuid: (doc.api_filename || doc.saved_filename) as string,
  updated_at: doc.updated_at instanceof Date ? doc.updated_at.toISOString() : String(doc.updated_at),
  activo: doc.activo as boolean,
  solicitud_id: doc.solicitud_id as string
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error(
        "No hay sesión activa",
        "Error de autenticación"
      );
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de solicitud no proporcionado",
        "Error de validación"
      );
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        "Solicitud no encontrada",
        "Recurso no encontrado"
      );
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "No tienes permiso para subir documentos a esta solicitud",
        "Acceso denegado"
      );
    }

    const formData = await readMultipartFormData(event);

    if (!formData) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "No se recibieron datos del formulario",
        "Error de validación"
      );
    }

    const file = formData.find(item => item.name === "documento");
    const documentoRequeridoId = formData
      .find(item => item.name === "documento_requerido_id")
      ?.data.toString();

    if (!file) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "No se recibió el archivo del documento",
        "Error de validación"
      );
    }

    if (!documentoRequeridoId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de documento requerido no proporcionado",
        "Error de validación"
      );
    }

    const filename = file.filename || "documento.pdf";
    const fileBuffer = file.data;
    const mimeType = file.type || "application/pdf";

    // Crear directorio de storage si no existe
    const uploadDir = join(process.cwd(), "storage", "uploads", solicitudId);
    await mkdir(uploadDir, { recursive: true });

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${filename}`;
    const filePath = join(uploadDir, uniqueFilename);

    // Guardar archivo físico
    await writeFile(filePath, fileBuffer);

    // Crear registro en base de datos
    await prisma.documentos_postulantes.create({
      data: {
        username: session.user.username,
        solicitud_id: solicitudId,
        tipo_documento: documentoRequeridoId,
        nombre_original: filename,
        saved_filename: uniqueFilename,
        tipo_mime: mimeType,
        tamano_bytes: fileBuffer.length,
        ruta_archivo: `/storage/uploads/${solicitudId}/${uniqueFilename}`,
        api_path: `/api/solicitudes/${solicitudId}/documentos`,
        api_filename: uniqueFilename,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Recargar lista de documentos para retornar al frontend
    const documentosActualizados = await prisma.documentos_postulantes.findMany(
      {
        where: {
          solicitud_id: solicitudId,
          activo: true
        },
        orderBy: {
          created_at: "desc"
        }
      }
    );

    // Mapear documentos al formato esperado por el frontend
    const documentosMapeados = documentosActualizados.map(mapDocumentoCargado);

    return CustomResponse.success(
      { documentos: documentosMapeados },
      "Documento subido exitosamente"
    );
  } catch (error: unknown) {
    const err = error as unknown as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    console.error("Error al subir documento:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al subir documento",
      "Error al subir documento."
    );
  }
});
