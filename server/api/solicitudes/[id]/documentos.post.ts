import type { H3Event } from "h3";
import {
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
  readMultipartFormData,
} from "h3";
import prisma from "~~/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { CustomResponse } from "~~/server/utils/customResponse";

// Helper para serializar fechas y BigInt
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
      return CustomResponse.error(
        "No hay sesión activa",
        "Error de autenticación",
      );
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de solicitud no proporcionado",
        "Error de validación",
      );
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        "Solicitud no encontrada",
        "Recurso no encontrado",
      );
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "No tienes permiso para subir documentos a esta solicitud",
        "Acceso denegado",
      );
    }

    const formData = await readMultipartFormData(event);

    if (!formData) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "No se recibieron datos del formulario",
        "Error de validación",
      );
    }

    const file = formData.find((item) => item.name === "documento");
    const documentoRequeridoId = formData
      .find((item) => item.name === "documento_requerido_id")
      ?.data.toString();

    if (!file) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "No se recibió el archivo del documento",
        "Error de validación",
      );
    }

    if (!documentoRequeridoId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de documento requerido no proporcionado",
        "Error de validación",
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
    const nuevoDocumento = await prisma.documentos_postulantes.create({
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
        updated_at: new Date(),
      },
    });

    // Recargar lista de documentos para retornar al frontend
    const documentosActualizados = await prisma.documentos_postulantes.findMany(
      {
        where: {
          solicitud_id: solicitudId,
          activo: true,
        },
        orderBy: {
          created_at: "desc",
        },
      },
    );

    // Mapear documentos al formato esperado por el frontend
    const documentosMapeados = documentosActualizados.map(mapDocumentoCargado);

    return CustomResponse.success(
      { documentos: documentosMapeados },
      "Documento subido exitosamente",
    );
  } catch (error: any) {
    console.error("Error al subir documento:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      error?.data?.error || error?.message || "Error al subir documento",
      "Error al subir documento.",
    );
  }
});
