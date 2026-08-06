import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import excelGeneratorService, {
  REPORTE_SOLICITANTES_COLUMNS
} from "~~/server/services/reports/excel-generator.service";
import type { ReporteSolicitanteRow } from "~~/shared/types/reports/solicitantes-reporte";

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

const loadWorkbook = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

describe("excelGeneratorService.generarExcelSolicitantes", () => {
  it("genera un libro con hoja, encabezados y filas", async () => {
    const service = excelGeneratorService();
    const buffer = await service.generarExcelSolicitantes([createRow()]);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet("Solicitantes");

    expect(worksheet).toBeDefined();
    expect(worksheet?.rowCount).toBe(2);
    expect(worksheet?.getRow(1).getCell(1).value).toBe(REPORTE_SOLICITANTES_COLUMNS[0].header);
    expect(worksheet?.getRow(2).getCell(1).value).toBe("000001-202603-01");
  });

  it("aplica formato de fecha y moneda", async () => {
    const service = excelGeneratorService();
    const buffer = await service.generarExcelSolicitantes([createRow()]);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet("Solicitantes");

    expect(worksheet?.getColumn(2).numFmt).toBe("dd/mm/yyyy");
    expect(worksheet?.getColumn(22).numFmt).toBe("$#,##0");
    expect(worksheet?.getColumn(23).numFmt).toBe("0");
  });

  it("genera un libro solo con encabezados cuando no hay filas", async () => {
    const service = excelGeneratorService();
    const buffer = await service.generarExcelSolicitantes([]);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet("Solicitantes");

    expect(worksheet?.rowCount).toBe(1);
    expect(worksheet?.getRow(1).cellCount).toBe(REPORTE_SOLICITANTES_COLUMNS.length);
  });
});
