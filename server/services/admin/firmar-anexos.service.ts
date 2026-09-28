import { mkdir, unlink, writeFile } from "fs/promises";
import { join, resolve, sep } from "path";
import prisma from "~~/lib/prisma";
import { loggerService } from "~~/server/utils/logger.service";
import type { FirmarAnexo } from "~~/shared/types/firmar-anexos";
import { validarAnexo } from "../firma/firmar-anexos.validator";
import type { ArchivoAnexo } from "../firma/firmar-anexos.validator";

const Log = loggerService();

const ANEXOS_DIR = "storage/anexos";

type AnexoRow = Awaited<ReturnType<typeof prisma.firmar_anexos.findFirstOrThrow>>;

type ResultadoAnexo<T> = { success: true, data: T } | { success: false, status: number, message: string };

const mapAnexo = (a: AnexoRow): FirmarAnexo => ({
  id: String(a.id),
  solicitud_id: a.solicitud_id,
  tipo_anexo: a.tipo_anexo,
  nombre_original: a.nombre_original,
  tamano_bytes: a.tamano_bytes,
  orden: a.orden,
  username: a.username,
  created_at: a.created_at?.toISOString() ?? null
});

const parseId = (anexoId: string): bigint | null => (/^\d+$/.test(anexoId) ? BigInt(anexoId) : null);

class FirmarAnexosService {
  async listar(solicitudId: string): Promise<FirmarAnexo[]> {
    const anexos = await prisma.firmar_anexos.findMany({
      where: { solicitud_id: solicitudId, activo: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }]
    });
    return anexos.map(mapAnexo);
  }

  async crear(
    solicitudId: string,
    username: string,
    tipo: unknown,
    archivo?: ArchivoAnexo | null
  ): Promise<ResultadoAnexo<FirmarAnexo>> {
    const validacion = validarAnexo(tipo, archivo);
    if (!validacion.ok) return { success: false, status: 400, message: validacion.message };

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
      select: { numero_solicitud: true }
    });
    if (!solicitud) return { success: false, status: 404, message: "Solicitud no encontrada" };

    const savedFilename = `${crypto.randomUUID()}.pdf`;
    const rutaRelativa = `${ANEXOS_DIR}/${solicitud.numero_solicitud}/${savedFilename}`;
    const destino = this.rutaAbsoluta(rutaRelativa);
    if (!destino) return { success: false, status: 400, message: "Ruta de anexo inválida" };

    await mkdir(join(process.cwd(), ANEXOS_DIR, solicitud.numero_solicitud), { recursive: true });
    await writeFile(destino, archivo!.data);

    let anexo: AnexoRow;
    try {
      const ultimo = await prisma.firmar_anexos.aggregate({
        where: { solicitud_id: solicitudId, activo: true },
        _max: { orden: true }
      });
      const now = new Date();
      anexo = await prisma.firmar_anexos.create({
        data: {
          solicitud_id: solicitudId,
          username,
          tipo_anexo: validacion.tipo,
          // El nombre subido por el asesor no se conserva: el anexo se identifica solo por su UUID
          nombre_original: savedFilename,
          saved_filename: savedFilename,
          tipo_mime: "application/pdf",
          tamano_bytes: archivo!.data.length,
          ruta_archivo: rutaRelativa,
          orden: (ultimo._max.orden ?? 0) + 1,
          activo: true,
          created_at: now,
          updated_at: now
        }
      });
    } catch (error) {
      await unlink(destino).catch(() => undefined);
      throw error;
    }

    Log.info("FirmarAnexos.crear: Anexo registrado", { solicitudId, anexoId: String(anexo.id), tipo: validacion.tipo, username });
    return { success: true, data: mapAnexo(anexo) };
  }

  async eliminar(solicitudId: string, anexoId: string): Promise<ResultadoAnexo<null>> {
    const id = parseId(anexoId);
    if (id === null) return { success: false, status: 400, message: "ID de anexo inválido" };

    const { count } = await prisma.firmar_anexos.updateMany({
      where: { id, solicitud_id: solicitudId, activo: true },
      data: { activo: false, updated_at: new Date() }
    });
    if (count === 0) return { success: false, status: 404, message: "Anexo no encontrado" };

    Log.info("FirmarAnexos.eliminar: Anexo dado de baja", { solicitudId, anexoId });
    return { success: true, data: null };
  }

  /** Anexo activo con la ruta absoluta de su archivo, o null si no existe */
  async obtenerArchivo(solicitudId: string, anexoId: string) {
    const id = parseId(anexoId);
    if (id === null) return null;

    const anexo = await prisma.firmar_anexos.findFirst({
      where: { id, solicitud_id: solicitudId, activo: true }
    });
    if (!anexo?.ruta_archivo) return null;

    const ruta = this.rutaAbsoluta(anexo.ruta_archivo);
    return ruta
      ? { anexo: mapAnexo(anexo), ruta, savedFilename: anexo.saved_filename, tipoMime: anexo.tipo_mime || "application/pdf" }
      : null;
  }

  /** Resuelve la ruta y garantiza que quede dentro de storage/anexos */
  private rutaAbsoluta(rutaRelativa: string): string | null {
    const base = resolve(process.cwd(), ANEXOS_DIR);
    const ruta = resolve(process.cwd(), rutaRelativa);
    return ruta.startsWith(base + sep) ? ruta : null;
  }
}

export const firmarAnexosService = new FirmarAnexosService();
export default firmarAnexosService;
