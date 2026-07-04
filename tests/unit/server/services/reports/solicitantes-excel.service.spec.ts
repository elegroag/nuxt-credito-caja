import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  filenameReporteSolicitantes,
  generarReporteSolicitantesExcel
} from "~~/server/services/reports/solicitantes-excel.service";

const obtenerMock = vi.hoisted(() => vi.fn());
const generarExcelMock = vi.hoisted(() => vi.fn());
const guardarMock = vi.hoisted(() => vi.fn());

vi.mock("~~/server/services/reports/solicitantes-reporte.service", () => ({
  default: () => ({
    obtenerSolicitantesReporte: obtenerMock
  })
}));

vi.mock("~~/server/services/reports/excel-generator.service", () => ({
  default: () => ({
    generarExcelSolicitantes: generarExcelMock
  })
}));

vi.mock("~~/server/services/reports/reporte-storage.service", () => ({
  default: () => ({
    guardarReporteExcel: guardarMock
  })
}));

describe("generarReporteSolicitantesExcel", () => {
  beforeEach(() => {
    obtenerMock.mockReset();
    generarExcelMock.mockReset();
    guardarMock.mockReset();
  });

  it("consulta datos actuales, genera Excel y actualiza storage/temp", async () => {
    const buffer = Buffer.from("xlsx-data");
    const filtros = { tipo_documento: "CC" };

    obtenerMock.mockResolvedValue([{ numero_documento: "123" }]);
    generarExcelMock.mockResolvedValue(buffer);
    guardarMock.mockResolvedValue({
      path: "/tmp/solicitantes-2026-07-03.xlsx",
      filename: "solicitantes-2026-07-03.xlsx"
    });

    const result = await generarReporteSolicitantesExcel(filtros);

    expect(obtenerMock).toHaveBeenCalledWith(filtros);
    expect(generarExcelMock).toHaveBeenCalledWith([{ numero_documento: "123" }]);
    expect(guardarMock).toHaveBeenCalledWith(
      buffer,
      expect.stringMatching(/^solicitantes-\d{4}-\d{2}-\d{2}\.xlsx$/)
    );
    expect(result.buffer).toBe(buffer);
    expect(result.total).toBe(1);
    expect(result.filename).toBe(filenameReporteSolicitantes());
  });
});
