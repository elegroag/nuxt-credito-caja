/**
 * pdf-flask-v2-adapter.service.ts
 *
 * Normaliza el payload construido por pdf-payload.service al contrato de
 * checkboxes/códigos esperado por templates_creditos_v2 (Flask PDF v2).
 *
 * Se aplica justo antes del POST a creditos/v2/generate-pdf.
 */

import type { ParametrosCatalogos } from "../shared/parametros-resolver.service";

type Dict = Record<string, unknown>;

const asDict = (value: unknown): Dict =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Dict) : {};

const asString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

/** SISU nivedu → slug Flask v2 */
const NIVEL_BY_CODE: Record<string, string> = {
  "1": "primaria",
  "2": "primaria",
  "6": "primaria",
  "15": "primaria",
  "3": "bachillerato",
  "4": "bachillerato",
  "7": "bachillerato",
  "8": "bachillerato",
  "5": "tecnico",
  "10": "tecnico",
  "11": "universitario",
  "12": "posgrado",
  "13": "ninguno",
  "14": "ninguno"
};

const NIVEL_SLUGS = new Set([
  "primaria",
  "bachillerato",
  "tecnico",
  "universitario",
  "posgrado",
  "ninguno"
]);

const mapSexo = (raw: unknown): string => {
  const v = asString(raw);
  if (!v) return "";
  const n = normalizeKey(v);
  if (v === "M" || v === "F") return v;
  if (n === "M" || n.startsWith("MASCUL")) return "M";
  if (n === "F" || n.startsWith("FEMEN")) return "F";
  return v;
};

const mapTipoDocumento = (
  raw: unknown,
  catalogos?: ParametrosCatalogos | null
): string => {
  const v = asString(raw);
  if (!v) return "";
  const upper = v.toUpperCase();
  if (upper === "CC" || upper === "CE") return upper;

  if (catalogos?.codigos_tipo_documento?.length) {
    const byCoddoc = catalogos.codigos_tipo_documento.find((d) => d.coddoc === v);
    if (byCoddoc?.codrua === "CC" || byCoddoc?.codrua === "CE") {
      return byCoddoc.codrua;
    }
    const byDet = catalogos.codigos_tipo_documento.find(
      (d) => normalizeKey(d.detdoc) === normalizeKey(v)
    );
    if (byDet?.codrua === "CC" || byDet?.codrua === "CE") {
      return byDet.codrua;
    }
  }

  const n = normalizeKey(v);
  if (v === "1" || n.includes("CIUDADANIA") || n === "CC") return "CC";
  if (n.includes("EXTRANJER") || n === "CE") return "CE";
  return v;
};

const mapNivelEducativo = (raw: unknown): string => {
  const v = asString(raw);
  if (!v) return "";
  const lower = v.toLowerCase();
  if (NIVEL_SLUGS.has(lower)) return lower;
  if (NIVEL_BY_CODE[v]) return NIVEL_BY_CODE[v];

  const n = normalizeKey(v);
  if (n.includes("POSGRADO") || n.includes("MAESTR")) return "posgrado";
  if (n.includes("UNIVERSIT")) return "universitario";
  if (n.includes("TECNICO") || n.includes("TEGNOLOG") || n.includes("TECNOLOG")) {
    return "tecnico";
  }
  if (n.includes("BACHILLER") || n.includes("SECUNDARIA") || n.includes("MEDIA")) {
    return "bachillerato";
  }
  if (
    n.includes("PRIMARIA")
    || n.includes("BASICA")
    || n.includes("PREESCOLAR")
    || n.includes("INFANCIA")
  ) {
    return "primaria";
  }
  if (n.includes("NINGUNO") || n.includes("NO DISPONIBLE")) return "ninguno";
  return v;
};

const mapTipoVivienda = (raw: unknown): string => {
  const v = asString(raw);
  if (!v) return "";
  const lower = v.toLowerCase();
  if (lower === "propia" || lower === "familiar" || lower === "arrendada") {
    return lower;
  }
  if (v === "P") return "propia";
  if (v === "F") return "familiar";
  if (v === "A") return "arrendada";

  const n = normalizeKey(v);
  if (n.includes("PROPIA")) return "propia";
  if (n.includes("FAMILIAR")) return "familiar";
  if (n.includes("ARREND")) return "arrendada";
  return v;
};

const mapRolEnSolicitud = (raw: unknown): string => {
  const v = asString(raw);
  if (!v) return "solicitante";
  const lower = v.toLowerCase();
  if (lower === "solicitante" || lower === "codeudor") return lower;
  if (v === "C") return "codeudor";
  // T, S, E y demás → solicitante (titular / solicitante)
  return "solicitante";
};

/** tipcre SISU → opción de "Producto solicitado" (A-E); sin mapeo, Flask marca "Otros" */
const PRODUCTO_TIPO_POR_TIPCRE: Record<string, string> = {
  "02": "A",
  "03": "A",
  "014": "B",
  "06": "C",
  "07": "C",
  "08": "C",
  "01": "D",
  "04": "D",
  "09": "D",
  "05": "E",
  "13": "E"
};

const mapProductoTipo = (raw: unknown): string => {
  const v = asString(raw);
  if (!v) return "";
  const upper = v.toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(upper)) return upper;
  return PRODUCTO_TIPO_POR_TIPCRE[v] ?? v;
};

const ensurePhoneKeys = (solicitante: Dict): void => {
  if (solicitante.telefono_fijo === undefined || solicitante.telefono_fijo === null) {
    solicitante.telefono_fijo = "";
  } else {
    solicitante.telefono_fijo = asString(solicitante.telefono_fijo);
  }
  if (solicitante.telefono_movil === undefined || solicitante.telefono_movil === null) {
    solicitante.telefono_movil = "";
  } else {
    solicitante.telefono_movil = asString(solicitante.telefono_movil);
  }
};

export type DateParts = {
  day: string
  month: string
  year: string
  /** Alias ES (mismo valor que day/month/year) */
  dia: string
  mes: string
  anio: string
};

const emptyDateParts = (): DateParts => ({
  day: "",
  month: "",
  year: "",
  dia: "",
  mes: "",
  anio: ""
});

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Parsea ISO, YYYY-MM-DD o fechas locales es-CO y retorna Date en UTC calendar.
 */
export const parseDateValue = (raw: unknown): Date | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Dict;
    const day = asString(o.day || o.dia);
    const month = asString(o.month || o.mes);
    const year = asString(o.year || o.anio);
    if (day && month && year) {
      const d = new Date(`${year}-${pad2(Number(month))}-${pad2(Number(day))}T00:00:00.000Z`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  const v = asString(raw);
  if (!v) return null;

  // ISO / YYYY-MM-DD
  const iso = Date.parse(v.includes("T") || v.includes("Z") ? v : `${v}T00:00:00.000Z`);
  if (!Number.isNaN(iso)) return new Date(iso);

  // dd/mm/yyyy o d/m/yyyy (con o sin hora local)
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const d = new Date(`${m[3]}-${pad2(Number(m[2]))}-${pad2(Number(m[1]))}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
};

export const toDateParts = (raw: unknown): DateParts => {
  const d = parseDateValue(raw);
  if (!d) return emptyDateParts();
  const day = pad2(d.getUTCDate());
  const month = pad2(d.getUTCMonth() + 1);
  const year = String(d.getUTCFullYear());
  return { day, month, year, dia: day, mes: month, anio: year };
};

/** Normaliza a YYYY-MM-DD para filtros Flask format_date */
export const toIsoDate = (raw: unknown): string => {
  const d = parseDateValue(raw);
  if (!d) return "";
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

/** fecha_vinculacion proviene únicamente de laboral.fecha_ingreso */
const fillFechaVinculacion = (solicitante: Dict, payload: Dict): void => {
  const laboral = asDict(payload.laboral);
  solicitante.fecha_vinculacion = parseDateValue(laboral.fecha_ingreso) ? laboral.fecha_ingreso : "";
};

/** Fechas enviadas a Flask como string YYYY-MM-DD (format_date / date_parts) */
const ISO_DATE_PATHS: Array<{ section: string, key: string }> = [
  { section: "solicitante", key: "fecha_vinculacion" },
  { section: "solicitante", key: "fecha_expedicion_documento" },
  { section: "solicitante", key: "fecha_nacimiento" },
  { section: "laboral", key: "fecha_ingreso" },
  { section: "solicitud", key: "fecha_radicado" },
  { section: "encabezado", key: "fecha_radicado" },
  { section: "trabajador", key: "fecha_nacimiento" },
  { section: "trabajador", key: "fecha_afiliacion" },
  { section: "trabajador", key: "fecha_salario" },
  { section: "pdf_metadata", key: "fecha_generacion" },
  { section: "proceso_firmado", key: "fecha_inicio" }
];

const applyDateShapes = (payload: Dict): void => {
  for (const { section, key } of ISO_DATE_PATHS) {
    const block = asDict(payload[section]);
    if (!Object.keys(block).length && payload[section] === undefined) continue;
    if (block[key] === undefined) continue;
    block[key] = toIsoDate(block[key]);
    payload[section] = block;
  }

  // laboral.mes / laboral.anio (cabecera del bloque laboral)
  const laboral = asDict(payload.laboral);
  const parts = toDateParts(laboral.fecha_ingreso);
  if (parts.month && !asString(laboral.mes)) laboral.mes = parts.month;
  if (parts.year && !asString(laboral.anio)) laboral.anio = parts.year;
  payload.laboral = laboral;
};

const applyAliases = (payload: Dict): void => {
  const laboral = asDict(payload.laboral);
  if (!asString(laboral.nombramiento_o_pagador) && asString(laboral.nombre_pagador)) {
    laboral.nombramiento_o_pagador = laboral.nombre_pagador;
  }
  payload.laboral = laboral;

  const ingresos = asDict(payload.ingresos);
  if (ingresos.total_neto === undefined && ingresos.total_neto_recibido !== undefined) {
    ingresos.total_neto = ingresos.total_neto_recibido;
  }
  payload.ingresos = ingresos;

  const economica = asDict(payload.economica);
  if (economica.otros_ingresos === undefined && economica.otros !== undefined) {
    economica.otros_ingresos = economica.otros;
  }
  if (
    economica.descripcion_ingresos === undefined
    && economica.descripcion !== undefined
  ) {
    economica.descripcion_ingresos = economica.descripcion;
  }
  if (
    economica.descripcion_gastos === undefined
    && economica.gastos_descripcion !== undefined
  ) {
    economica.descripcion_gastos = economica.gastos_descripcion;
  }
  payload.economica = economica;

  const descuentos = asDict(payload.descuentos);
  if (descuentos.total_gastos === undefined && descuentos.total_descuentos !== undefined) {
    descuentos.total_gastos = descuentos.total_descuentos;
  }
  payload.descuentos = descuentos;
};

/**
 * Devuelve una copia del payload adaptada al contrato Flask PDF v2.
 */
export const adaptPayloadForFlaskV2 = (
  payload: Record<string, unknown>,
  catalogos?: ParametrosCatalogos | null
): Record<string, unknown> => {
  const out: Dict = structuredClone(payload);

  const solicitud = asDict(out.solicitud);
  solicitud.rol_en_solicitud = mapRolEnSolicitud(solicitud.rol_en_solicitud);
  solicitud.producto_tipo = mapProductoTipo(solicitud.producto_tipo);
  out.solicitud = solicitud;

  const solicitante = asDict(out.solicitante);
  solicitante.sexo = mapSexo(solicitante.sexo);
  solicitante.tipo_documento = mapTipoDocumento(solicitante.tipo_documento, catalogos);
  solicitante.nivel_educativo = mapNivelEducativo(solicitante.nivel_educativo);
  solicitante.tipo_vivienda = mapTipoVivienda(solicitante.tipo_vivienda);
  ensurePhoneKeys(solicitante);
  fillFechaVinculacion(solicitante, out);
  out.solicitante = solicitante;

  // trabajador: mismos códigos de checkbox si existen
  const trabajador = asDict(out.trabajador);
  if (Object.keys(trabajador).length) {
    if (trabajador.sexo !== undefined) {
      trabajador.sexo = mapSexo(trabajador.sexo);
    }
    if (trabajador.tipo_documento !== undefined) {
      trabajador.tipo_documento = mapTipoDocumento(trabajador.tipo_documento, catalogos);
    }
    if (trabajador.nivel_educativo !== undefined) {
      trabajador.nivel_educativo = mapNivelEducativo(trabajador.nivel_educativo);
    }
    out.trabajador = trabajador;
  }

  const codeudor = asDict(out.codeudor);
  if (codeudor.tipo_documento !== undefined) {
    codeudor.tipo_documento = mapTipoDocumento(codeudor.tipo_documento, catalogos);
    out.codeudor = codeudor;
  }

  applyAliases(out);
  applyDateShapes(out);
  return out;
};

const pdfFlaskV2AdapterService = () => ({
  adaptPayloadForFlaskV2
});

export default pdfFlaskV2AdapterService;
