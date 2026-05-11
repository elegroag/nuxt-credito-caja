import { promises as fs } from "fs";
import path from "path";
import { useRuntimeConfig } from "#imports";

interface PdfGenerado {
  url?: string;
  content?: string;
  path?: string;
  nombre?: string;
}

class DocumentoStorage {
  private storagePath: string;

  constructor() {
    const config = useRuntimeConfig();
    this.storagePath = config.storage?.documentsPath || "./storage/documents";
  }

  /**
   * Inicializa el directorio de storage
   */
  async inicializarStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error("Error al inicializar storage:", error);
    }
  }

  /**
   * Guarda un documento PDF en el storage
   */
  async guardarPdf(
    solicitudId: string,
    contenido: string | Buffer,
    nombre?: string,
  ): Promise<string> {
    await this.inicializarStorage();

    const nombreArchivo = nombre || `solicitud_${solicitudId}.pdf`;
    const rutaArchivo = path.join(this.storagePath, nombreArchivo);

    if (typeof contenido === "string") {
      await fs.writeFile(rutaArchivo, contenido, "base64");
    } else {
      await fs.writeFile(rutaArchivo, contenido);
    }

    return rutaArchivo;
  }

  /**
   * Obtiene un documento PDF del storage
   */
  async obtenerPdf(
    solicitudId: string,
    nombre?: string,
  ): Promise<string | null> {
    await this.inicializarStorage();

    const nombreArchivo = nombre || `solicitud_${solicitudId}.pdf`;
    const rutaArchivo = path.join(this.storagePath, nombreArchivo);

    try {
      const contenido = await fs.readFile(rutaArchivo);
      return contenido.toString("base64");
    } catch (error) {
      console.error("Error al obtener PDF:", error);
      return null;
    }
  }

  /**
   * Elimina un documento PDF del storage
   */
  async eliminarPdf(solicitudId: string, nombre?: string): Promise<boolean> {
    await this.inicializarStorage();

    const nombreArchivo = nombre || `solicitud_${solicitudId}.pdf`;
    const rutaArchivo = path.join(this.storagePath, nombreArchivo);

    try {
      await fs.unlink(rutaArchivo);
      return true;
    } catch (error) {
      console.error("Error al eliminar PDF:", error);
      return false;
    }
  }

  /**
   * Verifica si un documento PDF existe en el storage
   */
  async existePdf(solicitudId: string, nombre?: string): Promise<boolean> {
    await this.inicializarStorage();

    const nombreArchivo = nombre || `solicitud_${solicitudId}.pdf`;
    const rutaArchivo = path.join(this.storagePath, nombreArchivo);

    try {
      await fs.access(rutaArchivo);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el contenido del PDF desde pdf_generado
   * Soporta diferentes formatos: URL, contenido base64, o ruta de archivo
   */
  async obtenerContenidoDesdePdfGenerado(
    pdfGenerado: PdfGenerado,
  ): Promise<string | null> {
    if (!pdfGenerado) {
      return null;
    }

    // Si tiene contenido en base64
    if (pdfGenerado.content) {
      return pdfGenerado.content;
    }

    // Si tiene una ruta de archivo local
    if (pdfGenerado.path) {
      try {
        const contenido = await fs.readFile(pdfGenerado.path);
        return contenido.toString("base64");
      } catch (error) {
        console.error("Error al leer archivo desde ruta:", error);
        return null;
      }
    }

    // Si tiene una URL, descargar el documento
    if (pdfGenerado.url) {
      try {
        const { ofetch } = await import("ofetch");
        const respuesta = await ofetch(pdfGenerado.url, {
          responseType: "arrayBuffer",
        });
        return Buffer.from(respuesta).toString("base64");
      } catch (error) {
        console.error("Error al descargar documento desde URL:", error);
        return null;
      }
    }

    return null;
  }

  /**
   * Guarda el PDF generado de una solicitud en el storage
   */
  async guardarPdfDeSolicitud(
    solicitudId: string,
    pdfGenerado: PdfGenerado,
  ): Promise<string | null> {
    const contenido = await this.obtenerContenidoDesdePdfGenerado(pdfGenerado);

    if (!contenido) {
      return null;
    }

    const nombreArchivo = pdfGenerado.nombre || `solicitud_${solicitudId}.pdf`;
    return await this.guardarPdf(solicitudId, contenido, nombreArchivo);
  }

  /**
   * Genera una URL pública para acceder al documento
   */
  generarUrlPublica(solicitudId: string, nombre?: string): string {
    const config = useRuntimeConfig();
    const baseUrl = config.public?.apiUrl || "";
    const nombreArchivo = nombre || `solicitud_${solicitudId}.pdf`;
    return `${baseUrl}/api/storage/pdfs/${nombreArchivo}`;
  }
}

export const documentoStorage = new DocumentoStorage();
export default documentoStorage;
