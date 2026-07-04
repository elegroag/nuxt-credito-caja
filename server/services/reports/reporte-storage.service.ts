import { promises as fs } from "fs";
import path from "path";
import type { ReporteArchivoItem } from "~~/shared/types/reports/solicitantes-reporte";

const DEFAULT_TEMP_PATH = "storage/temp";
const XLSX_EXTENSION = ".xlsx";

export const isReporteFilenameValid = (filename: string): boolean => {
  const safeName = path.basename(filename);
  return safeName === filename
    && safeName.length > 0
    && safeName.endsWith(XLSX_EXTENSION)
    && !safeName.includes("..");
};

export const resolveReporteTempPath = (basePath?: string): string => {
  const raw = basePath || process.env.STORAGE_TEMP_PATH || DEFAULT_TEMP_PATH;
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
};

const reporteStorageService = (basePath?: string) => {
  const tempPath = resolveReporteTempPath(basePath);

  const ensureTempDir = async (): Promise<void> => {
    await fs.mkdir(tempPath, { recursive: true });
  };

  const guardarReporteExcel = async (
    buffer: Buffer,
    filename: string
  ): Promise<{ path: string; filename: string }> => {
    await ensureTempDir();

    const safeName = path.basename(filename);
    const filePath = path.join(tempPath, safeName);

    await fs.writeFile(filePath, buffer);

    return {
      path: filePath,
      filename: safeName
    };
  };

  const existeReporte = async (filename: string): Promise<boolean> => {
    const safeName = path.basename(filename);
    const filePath = path.join(tempPath, safeName);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  };

  const leerReporte = async (filename: string): Promise<Buffer> => {
    if (!isReporteFilenameValid(filename)) {
      throw new Error("Nombre de archivo no válido");
    }

    const safeName = path.basename(filename);
    const filePath = path.join(tempPath, safeName);
    return await fs.readFile(filePath);
  };

  const listarReportes = async (): Promise<ReporteArchivoItem[]> => {
    await ensureTempDir();

    const entries = await fs.readdir(tempPath, { withFileTypes: true });
    const files = entries.filter(
      entry => entry.isFile() && isReporteFilenameValid(entry.name)
    );

    const items = await Promise.all(
      files.map(async (entry) => {
        const filePath = path.join(tempPath, entry.name);
        const stat = await fs.stat(filePath);

        return {
          filename: entry.name,
          size_bytes: stat.size,
          created_at: stat.mtime.toISOString()
        };
      })
    );

    return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  };

  const resolverRutaReporte = (filename: string): string => {
    if (!isReporteFilenameValid(filename)) {
      throw new Error("Nombre de archivo no válido");
    }

    return path.join(tempPath, path.basename(filename));
  };

  return {
    tempPath,
    ensureTempDir,
    guardarReporteExcel,
    existeReporte,
    leerReporte,
    listarReportes,
    resolverRutaReporte
  };
};

export default reporteStorageService;
