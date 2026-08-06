import excelGeneratorService from "~~/server/services/reports/excel-generator.service";
import reporteStorageService from "~~/server/services/reports/reporte-storage.service";
import solicitantesReporteService from "~~/server/services/reports/solicitantes-reporte.service";
import type { ReporteSolicitantesFiltros } from "~~/shared/types/reports/solicitantes-reporte";

export const filenameReporteSolicitantes = () => {
  const date = new Date().toISOString().slice(0, 10);
  return `solicitantes-${date}.xlsx`;
};

export interface ReporteSolicitantesGenerado {
  buffer: Buffer
  filename: string
  total: number
}

/**
 * Siempre consulta datos actuales en BD, genera el Excel y actualiza storage/temp.
 */
export const generarReporteSolicitantesExcel = async (
  filtros: ReporteSolicitantesFiltros = {}
): Promise<ReporteSolicitantesGenerado> => {
  const reporteService = solicitantesReporteService();
  const excelService = excelGeneratorService();
  const storageService = reporteStorageService();

  const rows = await reporteService.obtenerSolicitantesReporte(filtros);
  const buffer = await excelService.generarExcelSolicitantes(rows);
  const filename = filenameReporteSolicitantes();

  await storageService.guardarReporteExcel(buffer, filename);

  return {
    buffer,
    filename,
    total: rows.length
  };
};
