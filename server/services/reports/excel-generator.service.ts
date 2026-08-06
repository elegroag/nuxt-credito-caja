import ExcelJS from "exceljs";
import type { ReporteSolicitanteRow } from "~~/shared/types/reports/solicitantes-reporte";

interface ExcelColumn {
  header: string
  key: keyof ReporteSolicitanteRow
  width: number
  type?: "currency" | "date" | "number"
}

export const REPORTE_SOLICITANTES_COLUMNS: ExcelColumn[] = [
  { header: "Número Solicitud", key: "numero_solicitud", width: 22 },
  { header: "Fecha Radicado", key: "fecha_radicado", width: 18, type: "date" },
  { header: "Estado Solicitud", key: "estado_solicitud", width: 24 },
  { header: "Tipo Persona", key: "tipo_persona", width: 16 },
  { header: "Tipo Documento", key: "tipo_documento", width: 18 },
  { header: "Número Documento", key: "numero_documento", width: 22 },
  { header: "Nombres", key: "nombres", width: 28 },
  { header: "Apellidos", key: "apellidos", width: 28 },
  { header: "Fecha Nacimiento", key: "fecha_nacimiento", width: 20, type: "date" },
  { header: "Fecha Expedición Doc", key: "fecha_expedicion", width: 22, type: "date" },
  { header: "Género", key: "genero", width: 12 },
  { header: "Estado Civil", key: "estado_civil", width: 18 },
  { header: "Nivel Educativo", key: "nivel_educativo", width: 22 },
  { header: "Profesión", key: "profesion", width: 28 },
  { header: "Email", key: "email", width: 34 },
  { header: "Teléfono Fijo", key: "telefono_fijo", width: 18 },
  { header: "Teléfono Móvil", key: "telefono_movil", width: 18 },
  { header: "Dirección", key: "direccion", width: 36 },
  { header: "Barrio", key: "barrio", width: 22 },
  { header: "Ciudad", key: "ciudad", width: 22 },
  { header: "Departamento", key: "departamento", width: 22 },
  { header: "Salario", key: "salario", width: 18, type: "currency" },
  { header: "Antigüedad (meses)", key: "antiguedad_meses", width: 22, type: "number" },
  { header: "Tipo Contrato", key: "tipo_contrato", width: 22 },
  { header: "Sector Económico", key: "empresa_sector", width: 24 }
];

const toDateOrNull = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCellValue = (
  row: ReporteSolicitanteRow,
  column: ExcelColumn
): string | number | Date | null => {
  const value = row[column.key];

  if (column.type === "date") {
    return toDateOrNull(String(value || ""));
  }

  if (column.type === "currency" || column.type === "number") {
    return typeof value === "number" ? value : null;
  }

  return value === null || value === undefined ? "" : String(value);
};

const excelGeneratorService = () => {
  const generarExcelSolicitantes = async (
    rows: ReporteSolicitanteRow[]
  ): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Comfaca Créditos";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Solicitantes", {
      views: [{ state: "frozen", ySplit: 1 }]
    });

    worksheet.columns = REPORTE_SOLICITANTES_COLUMNS.map(column => ({
      header: column.header,
      key: column.key,
      width: column.width
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

    rows.forEach((row) => {
      worksheet.addRow(
        REPORTE_SOLICITANTES_COLUMNS.reduce<Record<string, string | number | Date | null>>(
          (acc, column) => {
            acc[column.key] = getCellValue(row, column);
            return acc;
          },
          {}
        )
      );
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } }
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    worksheet.autoFilter = {
      from: "A1",
      to: `${worksheet.getColumn(REPORTE_SOLICITANTES_COLUMNS.length).letter}1`
    };

    REPORTE_SOLICITANTES_COLUMNS.forEach((column, index) => {
      const excelColumn = worksheet.getColumn(index + 1);
      if (column.type === "date") {
        excelColumn.numFmt = "dd/mm/yyyy";
      }
      if (column.type === "currency") {
        excelColumn.numFmt = "$#,##0";
      }
      if (column.type === "number") {
        excelColumn.numFmt = "0";
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  };

  return {
    generarExcelSolicitantes
  };
};

export default excelGeneratorService;
