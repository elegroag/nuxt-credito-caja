/**
 * pdf-storage.service.ts
 *
 * Guarda el PDF en storage y persiste el registro en la tabla pdfs_generados.
 *
 * RESPONSABILIDAD: almacenamiento del archivo PDF + registro en DB.
 * No construye payloads, no llama APIs externas.
 */

import type { Prisma } from "~~/lib/prisma";
import prisma from "~~/lib/prisma";
import { documentoStorage } from "~~/server/services/storage/documento-storage.service";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

interface PdfResult {
  path: string;
  filename: string;
  storagePath: string;
}

interface PdfResponseData {
  api_path?: string;
  path?: string;
  api_filename?: string;
  filename?: string;
  api_content?: string;
  content?: string;
}

const pdfStorageService = () => {
  /**
   * Guarda el PDF en storage y actualiza/crea el registro en pdfs_generados.
   * Retorna las rutas reales donde se guardó el archivo.
   */
  const guardar = async (
    solicitudId: string,
    pdfData: PdfResponseData
  ): Promise<PdfResult> => {
    const pdfPath = String(pdfData.api_path || pdfData.path || "");
    const pdfFilename = String(pdfData.api_filename || pdfData.filename || "");
    const pdfContent = String(pdfData.api_content || pdfData.content || "");

    // Guardar en storage si hay contenido base64
    let storagePath = pdfPath;
    if (pdfContent) {
      try {
        storagePath = await documentoStorage.guardarPdf(solicitudId, pdfContent, pdfFilename);
        await Log.info("PDF guardado en storage exitosamente", {
          solicitudId,
          storagePath,
          filename: pdfFilename
        });
      } catch (storageError) {
        await Log.error("Error al guardar PDF en storage", storageError as Error, {
          solicitudId,
          filename: pdfFilename
        });
      }
    }

    // Persistir o actualizar el registro en DB
    const existing = await prisma.pdfs_generados.findUnique({
      where: { solicitud_id: solicitudId }
    });

    if (existing) {
      await prisma.pdfs_generados.update({
        where: { solicitud_id: solicitudId },
        data: {
          path: storagePath,
          filename: pdfFilename,
          generado_en: pdfData as unknown as Prisma.InputJsonValue,
          updated_at: new Date()
        }
      });
    } else {
      await prisma.pdfs_generados.create({
        data: {
          solicitud_id: solicitudId,
          path: storagePath,
          filename: pdfFilename,
          generado_en: pdfData as unknown as Prisma.InputJsonValue,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    return { path: pdfPath, filename: pdfFilename, storagePath };
  };

  return { guardar };
};

export default pdfStorageService;