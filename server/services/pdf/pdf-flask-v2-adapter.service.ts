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

const fillFechaVinculacion = (solicitante: Dict, payload: Dict): void => {
  if (asString(solicitante.fecha_vinculacion)) return;
  const trabajador = asDict(payload.trabajador);
  const afiliacion = asString(trabajador.fecha_afiliacion);
  if (afiliacion) {
    solicitante.fecha_vinculacion = afiliacion;
  }
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

  applyAliases(out);
  return out;
};

const pdfFlaskV2AdapterService = () => ({
  adaptPayloadForFlaskV2
});

export default pdfFlaskV2AdapterService;
