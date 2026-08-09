import prisma from "~~/lib/prisma";
import type { Prisma } from "~~/lib/prisma";
import type {
  ReporteSolicitanteRow,
  ReporteSolicitantesFiltros
} from "~~/shared/types/reports/solicitantes-reporte";
import { REPORTE_SOLICITANTES_MAX_ROWS } from "~~/shared/types/reports/solicitantes-reporte";

interface DecimalLike {
  toNumber: () => number
}

interface SolicitudReporteRelacion {
  numero_solicitud: string
  fecha_radicado: Date | null
  estado: string
}

interface SolicitanteReporteRecord {
  solicitud_id: string
  tipo_persona: string
  tipo_documento: string
  numero_documento: string
  nombres: string | null
  apellidos: string | null
  razon_social: string | null
  fecha_nacimiento: Date | null
  fecha_expedicion: Date | null
  genero: string | null
  estado_civil: string | null
  nivel_educativo: string | null
  profesion: string | null
  email: string | null
  telefono_fijo: string | null
  telefono_movil: string | null
  direccion: string | null
  barrio: string | null
  ciudad: string | null
  departamento: string | null
  salario: DecimalLike | number | string | null
  antiguedad_meses: number | null
  tipo_contrato: string | null
  sector_economico: string | null
  solicitudes_credito: SolicitudReporteRelacion
}

const isPresent = (value?: string): value is string => Boolean(value && value.trim() !== "");

const toIsoDate = (date: Date | null): string => date?.toISOString() || "";

const toStringValue = (value: string | null | undefined): string => value || "";

const toNumberOrNull = (value: DecimalLike | number | string | null): number | null => {
  if (value === null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return value.toNumber();
};

const parseDateRange = (value: string, endOfDay = false): Date => {
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? new Date(value) : date;
};

const resolveNombreSolicitante = (solicitante: SolicitanteReporteRecord): {
  nombres: string
  apellidos: string
} => {
  if (solicitante.tipo_persona === "juridica") {
    return {
      nombres: toStringValue(solicitante.razon_social) || toStringValue(solicitante.nombres),
      apellidos: ""
    };
  }

  return {
    nombres: toStringValue(solicitante.nombres),
    apellidos: toStringValue(solicitante.apellidos)
  };
};

export const mapSolicitanteReporteRow = (
  solicitante: SolicitanteReporteRecord
): ReporteSolicitanteRow => {
  const { nombres, apellidos } = resolveNombreSolicitante(solicitante);

  return {
    numero_solicitud: solicitante.solicitudes_credito.numero_solicitud || solicitante.solicitud_id,
    fecha_radicado: toIsoDate(solicitante.solicitudes_credito.fecha_radicado),
    estado_solicitud: solicitante.solicitudes_credito.estado,
    tipo_persona: solicitante.tipo_persona,
    tipo_documento: solicitante.tipo_documento,
    numero_documento: solicitante.numero_documento,
    nombres,
    apellidos,
    fecha_nacimiento: toIsoDate(solicitante.fecha_nacimiento),
    fecha_expedicion: toIsoDate(solicitante.fecha_expedicion),
    genero: toStringValue(solicitante.genero),
    estado_civil: toStringValue(solicitante.estado_civil),
    nivel_educativo: toStringValue(solicitante.nivel_educativo),
    profesion: toStringValue(solicitante.profesion),
    email: toStringValue(solicitante.email),
    telefono_fijo: toStringValue(solicitante.telefono_fijo),
    telefono_movil: toStringValue(solicitante.telefono_movil),
    direccion: toStringValue(solicitante.direccion),
    barrio: toStringValue(solicitante.barrio),
    ciudad: toStringValue(solicitante.ciudad),
    departamento: toStringValue(solicitante.departamento),
    salario: toNumberOrNull(solicitante.salario),
    antiguedad_meses: solicitante.antiguedad_meses,
    tipo_contrato: toStringValue(solicitante.tipo_contrato),
    empresa_sector: toStringValue(solicitante.sector_economico)
  };
};

const buildWhere = (
  filtros: ReporteSolicitantesFiltros
): Prisma.solicitud_solicitanteWhereInput => {
  const where: Prisma.solicitud_solicitanteWhereInput = {};
  const solicitudWhere: Prisma.solicitudes_creditoWhereInput = {};

  if (isPresent(filtros.tipo_documento)) {
    where.tipo_documento = filtros.tipo_documento;
  }

  if (isPresent(filtros.estado_solicitud)) {
    solicitudWhere.estado = filtros.estado_solicitud;
  }

  if (isPresent(filtros.fecha_desde) || isPresent(filtros.fecha_hasta)) {
    solicitudWhere.fecha_radicado = {};

    if (isPresent(filtros.fecha_desde)) {
      solicitudWhere.fecha_radicado.gte = parseDateRange(filtros.fecha_desde);
    }

    if (isPresent(filtros.fecha_hasta)) {
      solicitudWhere.fecha_radicado.lte = parseDateRange(filtros.fecha_hasta, true);
    }
  }

  if (Object.keys(solicitudWhere).length > 0) {
    where.solicitudes_credito = {
      is: solicitudWhere
    };
  }

  return where;
};

const SOLICITANTE_REPORTE_SELECT = {
  solicitud_id: true,
  tipo_persona: true,
  tipo_documento: true,
  numero_documento: true,
  nombres: true,
  apellidos: true,
  razon_social: true,
  fecha_nacimiento: true,
  fecha_expedicion: true,
  genero: true,
  estado_civil: true,
  nivel_educativo: true,
  profesion: true,
  email: true,
  telefono_fijo: true,
  telefono_movil: true,
  direccion: true,
  barrio: true,
  ciudad: true,
  departamento: true,
  salario: true,
  antiguedad_meses: true,
  tipo_contrato: true,
  sector_economico: true,
  solicitudes_credito: {
    select: {
      numero_solicitud: true,
      fecha_radicado: true,
      estado: true
    }
  }
} as const;

/** Máximo de filas crudas a escanear para completar el cupo de únicos. */
const REPORTE_SOLICITANTES_MAX_SCAN = REPORTE_SOLICITANTES_MAX_ROWS * 5;

const solicitantesReporteService = () => {
  const obtenerSolicitantesReporte = async (
    filtros: ReporteSolicitantesFiltros
  ): Promise<ReporteSolicitanteRow[]> => {
    const where = buildWhere(filtros);
    const uniqueRows = new Map<string, ReporteSolicitanteRow>();
    let skip = 0;

    while (
      uniqueRows.size < REPORTE_SOLICITANTES_MAX_ROWS
      && skip < REPORTE_SOLICITANTES_MAX_SCAN
    ) {
      const take = Math.min(
        REPORTE_SOLICITANTES_MAX_ROWS,
        REPORTE_SOLICITANTES_MAX_SCAN - skip
      );

      const batch = await prisma.solicitud_solicitante.findMany({
        where,
        skip,
        take,
        orderBy: {
          created_at: "desc"
        },
        select: SOLICITANTE_REPORTE_SELECT
      });

      if (batch.length === 0) break;

      for (const solicitante of batch as SolicitanteReporteRecord[]) {
        if (uniqueRows.has(solicitante.numero_documento)) continue;

        uniqueRows.set(
          solicitante.numero_documento,
          mapSolicitanteReporteRow(solicitante)
        );

        if (uniqueRows.size >= REPORTE_SOLICITANTES_MAX_ROWS) break;
      }

      skip += batch.length;
      if (batch.length < take) break;
    }

    return Array.from(uniqueRows.values());
  };

  return {
    obtenerSolicitantesReporte
  };
};

export default solicitantesReporteService;
