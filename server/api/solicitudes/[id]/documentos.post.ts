import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus, readMultipartFormData } from "h3";
import prisma from "~~/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
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
        "No tienes permiso para subir documentos a esta solicitud",
        "Acceso denegado"
      );
    }

    const formData = await readMultipartFormData(event);

    if (!formData) {
      setResponseStatus(event, 400);
      return CustomResponse.error("No se recibieron datos del formulario", "Error de validación");
    }

    const file = formData.find((item) => item.name === "documento");
    const documentoRequeridoId = formData
      .find((item) => item.name === "documento_requerido_id")
      ?.data.toString();

    if (!file) {
      setResponseStatus(event, 400);
      return CustomResponse.error("No se recibió el archivo del documento", "Error de validación");
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

    // Extraer la extensión real del archivo (ej: .jpg, .png, .pdf)
    const uuidFilename = crypto.randomUUID();
    const extension = (() => {
      if (filename && filename.includes(".")) {
        const ext = filename.split(".").pop()?.toLowerCase();
        // Mapear extensiones comunes a formatos válidos
        if (ext && ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx"].includes(ext)) {
          return ext;
        }
      }
      // Por defecto extraer del mime type
      return mimeType.split("/").pop() || "bin";
    })();
    const savedFilename = `${uuidFilename}.${extension}`;

    // Crear directorio de storage si no existe
    const uploadDir = join(process.cwd(), "storage", "uploads", solicitudId);
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, savedFilename);

    // Guardar archivo físico
    await writeFile(filePath, fileBuffer);

    // Crear registro en base de datos
    await prisma.solicitud_documentos.create({
      data: {
        solicitud_id: solicitudId,
        documento_uuid: uuidFilename,
        documento_requerido_id: documentoRequeridoId,
        nombre_original: filename,
        saved_filename: savedFilename,
        tipo_mime: mimeType,
        tamano_bytes: fileBuffer.length,
        ruta_archivo: `/storage/uploads/${solicitudId}/${savedFilename}`,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Recargar lista de documentos para retornar al frontend
    const documentosActualizados = await prisma.solicitud_documentos.findMany({
      where: {
        solicitud_id: solicitudId,
        activo: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    // Mapear documentos al formato esperado por el frontend
    const documentosMapeados = documentosActualizados.map((doc) =>
      mapDocumentoCargado(doc as unknown as SolicitudDocumentos)
    );

    return CustomResponse.success(
      { documentos: documentosMapeados },
      "Documento subido exitosamente"
    );
  } catch (error: unknown) {
    const err = error as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    console.error("Error al subir documento:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al subir documento",
      "Error al subir documento."
    );
  }
});