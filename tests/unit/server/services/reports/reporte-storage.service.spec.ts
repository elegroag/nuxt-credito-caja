import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import ExcelJS from "exceljs";
import excelGeneratorService from "~~/server/services/reports/excel-generator.service";
import reporteStorageService, {
  isReporteFilenameValid,
  resolveReporteTempPath
} from "~~/server/services/reports/reporte-storage.service";
import type { ReporteSolicitanteRow } from "~~/shared/types/reports/solicitantes-reporte";

const TEST_FILENAME = "test-solicitantes-reporte.xlsx";
const TEST_FILENAME_2 = "test-solicitantes-reporte-2.xlsx";

const createRow = (): ReporteSolicitanteRow => ({
  numero_solicitud: "000001-202603-01",
  fecha_radicado: "2026-03-18T00:00:00.000Z",
  estado_solicitud: "Postulado",
  tipo_persona: "natural",
  tipo_documento: "CC",
  numero_documento: "123456789",
  nombres: "Juan",
  apellidos: "Pérez",
  fecha_nacimiento: "1990-01-01T00:00:00.000Z",
  fecha_expedicion: "2008-01-01T00:00:00.000Z",
  genero: "M",
  estado_civil: "Soltero",
  nivel_educativo: "Universitario",
  profesion: "Ingeniero",
  email: "juan@example.com",
  telefono_fijo: "6081234567",
  telefono_movil: "3001234567",
  direccion: "Calle 1 # 2-3",
  barrio: "Centro",
  ciudad: "Florencia",
  departamento: "Caquetá",
  salario: 2500000,
  antiguedad_meses: 36,
  tipo_contrato: "Indefinido",
  empresa_sector: "Servicios"
});

const tempDir = resolveReporteTempPath();
const testFilePath = path.join(tempDir, TEST_FILENAME);
const testFilePath2 = path.join(tempDir, TEST_FILENAME_2);

afterEach(async () => {
  for (const file of [testFilePath, testFilePath2]) {
    try {
      await fs.unlink(file);
    } catch {
      // archivo de prueba no existía
    }
  }
});

describe("isReporteFilenameValid", () => {
  it("acepta nombres xlsx seguros", () => {
    expect(isReporteFilenameValid("solicitantes-2026-07-03.xlsx")).toBe(true);
  });

  it("rechaza path traversal y extensiones inválidas", () => {
    expect(isReporteFilenameValid("../secret.xlsx")).toBe(false);
    expect(isReporteFilenameValid("reporte.pdf")).toBe(false);
    expect(isReporteFilenameValid("")).toBe(false);
  });
});

describe("resolveReporteTempPath", () => {
  it("resuelve la ruta por defecto a storage/temp", () => {
    const resolved = resolveReporteTempPath();
    expect(resolved).toBe(path.resolve(process.cwd(), "storage/temp"));
  });
});

describe("reporteStorageService", () => {
  it("crea el directorio storage/temp si no existe", async () => {
    const service = reporteStorageService();
    await service.ensureTempDir();

    const stat = await fs.stat(service.tempPath);
    expect(stat.isDirectory()).toBe(true);
    expect(service.tempPath).toBe(tempDir);
  });

  it("guarda el reporte Excel en storage/temp", async () => {
    const excelService = excelGeneratorService();
    const storageService = reporteStorageService();
    const buffer = await excelService.generarExcelSolicitantes([createRow()]);

    const saved = await storageService.guardarReporteExcel(buffer, TEST_FILENAME);

    expect(saved.filename).toBe(TEST_FILENAME);
    expect(saved.path).toBe(testFilePath);
    expect(saved.path).toContain("storage/temp");

    const exists = await storageService.existeReporte(TEST_FILENAME);
    expect(exists).toBe(true);

    const stored = await storageService.leerReporte(TEST_FILENAME);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.equals(buffer)).toBe(true);
  });

  it("el archivo guardado es un XLSX válido con datos del reporte", async () => {
    const excelService = excelGeneratorService();
    const storageService = reporteStorageService();
    const buffer = await excelService.generarExcelSolicitantes([createRow()]);

    await storageService.guardarReporteExcel(buffer, TEST_FILENAME);

    const stored = await storageService.leerReporte(TEST_FILENAME);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(stored);

    const worksheet = workbook.getWorksheet("Solicitantes");
    expect(worksheet).toBeDefined();
    expect(worksheet?.rowCount).toBe(2);
    expect(worksheet?.getRow(2).getCell(6).value).toBe("123456789");
    expect(worksheet?.getRow(2).getCell(7).value).toBe("Juan");
  });

  it("lista los reportes guardados en storage/temp ordenados por fecha", async () => {
    const excelService = excelGeneratorService();
    const storageService = reporteStorageService();
    const buffer = await excelService.generarExcelSolicitantes([createRow()]);

    await storageService.guardarReporteExcel(buffer, TEST_FILENAME);
    await new Promise(resolve => setTimeout(resolve, 5));
    await storageService.guardarReporteExcel(buffer, TEST_FILENAME_2);

    const archivos = await storageService.listarReportes();
    const ours = archivos.filter(item =>
      [TEST_FILENAME, TEST_FILENAME_2].includes(item.filename)
    );

    expect(ours).toHaveLength(2);
    expect(ours[0]?.filename).toBe(TEST_FILENAME_2);
    expect(ours[0]?.size_bytes).toBeGreaterThan(0);
    expect(ours[0]?.created_at).toBeTruthy();
  });
});

describe("flujo generar y persistir reporte de solicitantes", () => {
  it("genera el Excel y lo deja guardado en ./storage/temp/", async () => {
    const excelService = excelGeneratorService();
    const storageService = reporteStorageService();
    const rows = [createRow(), { ...createRow(), numero_documento: "987654321", nombres: "María" }];

    const buffer = await excelService.generarExcelSolicitantes(rows);
    const { path: savedPath, filename } = await storageService.guardarReporteExcel(
      buffer,
      TEST_FILENAME
    );

    expect(filename).toBe(TEST_FILENAME);
    expect(savedPath.startsWith(tempDir)).toBe(true);

    const fileStat = await fs.stat(savedPath);
    expect(fileStat.isFile()).toBe(true);
    expect(fileStat.size).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await fs.readFile(savedPath));
    const worksheet = workbook.getWorksheet("Solicitantes");

    expect(worksheet?.rowCount).toBe(3);
  });
});
