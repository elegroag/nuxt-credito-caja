/**
 * pdf-payload.service.ts
 *
 * Construye el payload completo que se envía a Flask PDF.
 * Recibe datos crudos de Prisma y un ParametrosResolver ya inicializado.
 *
 * RESPONSABILIDAD: transformar datos crudos → estructura de payload para Flask PDF.
 * No hace fetching, no llama APIs externas, no guarda en storage.
 */

import type { Prisma } from "~~/lib/prisma";
import type { ParametrosCatalogos } from "../shared/parametros-resolver.service";

type SolicitudDB = Prisma.solicitudes_creditoGetPayload<{
  include: {
    solicitud_solicitante: true;
    firmantes_solicitud: { orderBy: { orden: "asc" } };
    solicitud_payload: { orderBy: { created_at: "desc" }; take: 1 };
  };
}>;

type FirmanteDB = SolicitudDB["firmantes_solicitud"][number];
type PayloadData = {
  informacion_laboral?: Record<string, unknown>;
  ingresos_descuentos?: Record<string, unknown>;
  informacion_economica?: Record<string, unknown>;
  propiedades?: unknown[];
  deudas?: unknown[];
  referencias?: { familiares?: unknown[]; personales?: unknown[] };
};

// ---------- Helper: serializeForPdf ----------

export const serializeForPdf = (
  obj: Record<string, unknown> | unknown[] | unknown
): Record<string, unknown> | unknown[] | unknown => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return (obj as unknown[]).map(serializeForPdf);
    }
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = serializeForPdf((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  return obj;
};

// ---------- Resolvedores (lambdas locales para no exponer el servicio) ----------

const makeResolvers = (catalogos: ParametrosCatalogos | null) => ({
  resolveCiudad: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.ciudades.find((c) => c.codciu === codigo)?.detciu ?? codigo;
  },
  resolvePais: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.paises.find((p) => p.cod1 === codigo)?.nombre ?? codigo;
  },
  resolveOcupacion: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.ocupaciones.find((o) => o.codocu === codigo)?.detalle ?? codigo;
  },
  resolveTipoDocumento: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.codigos_tipo_documento.find((d) => d.coddoc === codigo)?.detdoc ?? codigo;
  },
  resolveTipoContrato: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.tipo_contrato.find((t) => t.tipcon === codigo)?.detalle ?? codigo;
  },
  resolveTipoVivienda: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.tipo_vivienda.find((v) => v.vivienda === codigo)?.detalle ?? codigo;
  },
  resolveNivelEducativo: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.nivel_educativos.find((n) => n.nivedu === codigo)?.detalle ?? codigo;
  },
  resolveSexo: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.sexos.find((s) => s.codsex === codigo)?.detsex ?? codigo;
  },
  resolveEstadoCivil: (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.estado_civiles.find((e) => e.estciv === codigo)?.detest ?? codigo;
  }
});

// ---------- Servicio principal ----------

const pdfPayloadService = () => {
  const buildPayload = (
    solicitud: SolicitudDB,
    catalogos: ParametrosCatalogos | null,
    informacionLaboral: Record<string, unknown>,
    ingresosDescuentos: Record<string, unknown>,
    informacionEconomica: Record<string, unknown>,
    propiedades: unknown[],
    deudas: unknown[],
    referencias: { familiares: unknown[]; personales: unknown[] }
  ): Record<string, unknown> => {
    const r = makeResolvers(catalogos);

    const { solicitud_solicitante, firmantes_solicitud, solicitud_payload, ...solicitudData } =
      solicitud;
    const sol = solicitud_solicitante?.[0];
    const _rawPayload = solicitud_payload?.[0] as PayloadData | undefined;

    // ---- helper: split full name ----
    const firstName = (full: string | null | undefined) =>
      (full ?? "").split(" ")[0] || "";
    const lastNames = (full: string | null | undefined) =>
      (full ?? "").split(" ").slice(1).join(" ") || "";

    return {
      solicitud_id: solicitud.numero_solicitud,
      solicitud: {
        fecha_radicado: solicitudData.fecha_radicado,
        numero_solicitud: solicitudData.numero_solicitud,
        valor_solicitud: parseFloat(solicitudData.valor_solicitud?.toString() || "0").toFixed(2),
        plazo_meses: solicitudData.plazo_meses,
        numero_comprobante: solicitudData.numero_comprobante,
        rol_en_solicitud: solicitudData.rol_en_solicitud || "T",
        categoria: sol?.codigo_categoria || "B",
        producto_tipo: solicitudData.producto_tipo || "",
        ha_tenido_credito_comfaca: solicitudData.ha_tenido_credito || false,
        tipo_credito: solicitudData.tipo_credito || "01"
      },
      solicitante: {
        fecha_vinculacion: sol?.created_at?.toISOString().split("T")[0] || "",
        tipo_documento: r.resolveTipoDocumento(sol?.tipo_documento),
        numero_documento: sol?.numero_documento || "",
        fecha_nacimiento: sol?.fecha_nacimiento?.toISOString().split("T")[0] || "",
        pais_nacimiento: r.resolvePais(sol?.pais_residencia),
        nombre_completo:
          sol?.tipo_persona === "juridica"
            ? sol?.razon_social || ""
            : `${sol?.nombres || ""} ${sol?.apellidos || ""}`.trim(),
        fecha_expedicion_documento: sol?.fecha_expedicion?.toISOString().split("T")[0] || null,
        profesion_ocupacion: r.resolveOcupacion(sol?.cargo),
        sexo: r.resolveSexo(sol?.genero),
        nivel_educativo: r.resolveNivelEducativo(sol?.nivel_educativo),
        barrio_residencia: sol?.barrio || "",
        ciudad_residencia: r.resolveCiudad(sol?.ciudad) || sol?.ciudad || "",
        pais_residencia: r.resolvePais(sol?.pais_residencia),
        telefono_fijo: sol?.telefono_fijo || "",
        telefono_movil: sol?.telefono_movil || "",
        email: sol?.email || "",
        tipo_vivienda: r.resolveTipoVivienda(sol?.tipo_vivienda),
        vive_con_nucleo_familiar: sol?.vive_con_nucleo_familiar || false,
        personas_a_cargo: sol?.personas_a_cargo || 0,
        direccion_residencia: sol?.direccion || ""
      },
      laboral: {
        cargo: r.resolveOcupacion(sol?.cargo) || (informacionLaboral.cargo as string) || "",
        empresa_nit: sol?.nit || (informacionLaboral.empresa_nit as string) || "",
        fecha_ingreso:
          (informacionLaboral.fecha_ingreso as string) ||
          sol?.created_at?.toISOString().split("T")[0] ||
          "",
        tipo_contrato: r.resolveTipoContrato(
          (sol?.tipo_contrato || informacionLaboral.tipo_contrato) as string
        ),
        empresa_ciudad:
          r.resolveCiudad((informacionLaboral.empresa_ciudad as string) || sol?.ciudad) ||
          (informacionLaboral.empresa_ciudad as string) ||
          sol?.ciudad ||
          "",
        tiempo_servicio: informacionLaboral.tiempo_servicio || sol?.antiguedad_meses || 0,
        empresa_telefono: (informacionLaboral.empresa_telefono as string) || "",
        empresa_direccion: (informacionLaboral.empresa_direccion as string) || "",
        empresa_razon_social:
          sol?.razon_social || (informacionLaboral.empresa_razon_social as string) || "",
        nombre_pagador: informacionLaboral.nombre_pagador ?? null,
        tiempo_servicio_unidad: (informacionLaboral.tiempo_servicio_unidad as string) || "meses"
      },
      economica: {
        otros: informacionEconomica.otros || 0,
        moneda: (informacionEconomica.moneda as string) || "COP",
        descripcion: informacionEconomica.descripcion ?? null,
        total_gastos: informacionEconomica.total_gastos || 0,
        total_activos: informacionEconomica.total_activos || 0,
        total_pasivos: informacionEconomica.total_pasivos || 0,
        arrendamientos: informacionEconomica.arrendamientos || 0,
        gastos_descripcion: informacionEconomica.gastos_descripcion ?? null
      },
      ingresos: {
        moneda: (ingresosDescuentos.moneda as string) || "COP",
        comisiones: ingresosDescuentos.comisiones || 0,
        horas_extras: ingresosDescuentos.horas_extras || 0,
        otros_ingresos: ingresosDescuentos.otros_ingresos || 0,
        total_ingresos:
          ingresosDescuentos.total_ingresos || sol?.salario?.toNumber() || 0,
        total_neto_recibido: ingresosDescuentos.total_neto_recibido || 0,
        salario_basico_mensual:
          ingresosDescuentos.salario_basico_mensual || sol?.salario?.toNumber() || 0
      },
      descuentos: {
        judiciales: ingresosDescuentos.judiciales || 0,
        salud_pension: ingresosDescuentos.salud_pension || 0,
        otras_libranzas: ingresosDescuentos.otras_libranzas || 0,
        total_descuentos: ingresosDescuentos.total_descuentos || 0,
        libranzas_comfaca: ingresosDescuentos.libranzas_comfaca || 0,
        otras_deducciones: ingresosDescuentos.otras_deducciones || 0,
        subsidio_transporte: ingresosDescuentos.subsidio_transporte || 0,
        total_neto_recibido: ingresosDescuentos.total_neto_recibido || 0
      },
      conyuge: [],
      referencias: {
        familiares: referencias.familiares || [],
        personales: referencias.personales || []
      },
      deudas: Array.isArray(deudas) ? deudas : [],
      propiedades: Array.isArray(propiedades) ? propiedades : [],
      firmantes: (firmantes_solicitud || []).map((f: FirmanteDB) => ({
        tipo: f.tipo,
        rol: f.rol,
        nombre_completo: f.nombre_completo,
        numero_documento: f.numero_documento,
        email: f.email,
        orden: f.orden
      })),
      convenio: {
        representante_documento: (informacionLaboral.representante_documento as string) || "",
        representante_nombre: (informacionLaboral.representante_nombre as string) || "",
        fecha_vencimiento: (informacionLaboral.fecha_vencimiento as string) || "",
        fecha_convenio: (informacionLaboral.fecha_convenio as string) || "",
        nit: (() => {
          const raw = sol?.nit ?? informacionLaboral.nit;
          const str =
            typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw : "0";
          return parseInt(str, 10) || null;
        })(),
        razon_social:
          sol?.razon_social || (informacionLaboral.razon_social as string) || "",
        estado: (informacionLaboral.estado as string) || "Activo"
      },
      proceso_firmado: {
        proveedor: "CAJA DE COMPENSACIÓN FAMILIAR DEL CAQUETÁ",
        estado: "POSTULADO",
        transaccion_id: "0",
        fecha_inicio: new Date().toLocaleString("es-CO")
      },
      encabezado: {
        fecha_radicado:
          solicitudData.fecha_radicado?.toISOString() || new Date().toISOString(),
        solicitud_id: solicitud.numero_solicitud
      },
      pdf_metadata: {
        fecha_generacion: new Date().toLocaleString("es-CO"),
        solicitud_id: solicitud.numero_solicitud,
        version: "2.0"
      },
      trabajador: {
        cedula: sol?.numero_documento || "",
        tipo_documento: r.resolveTipoDocumento(sol?.tipo_documento),
        primer_apellido: firstName(sol?.apellidos),
        segundo_apellido: lastNames(sol?.apellidos),
        primer_nombre: firstName(sol?.nombres),
        segundo_nombre: lastNames(sol?.nombres),
        direccion: sol?.direccion || "",
        ciudad_codigo: sol?.ciudad || "",
        telefono: sol?.telefono_movil || sol?.telefono_fijo || "",
        email: sol?.email || "",
        salario: sol?.salario?.toNumber() || 0,
        fecha_salario: new Date().toISOString().split("T")[0],
        sexo: r.resolveSexo(sol?.genero),
        estado_civil: r.resolveEstadoCivil(sol?.estado_civil),
        fecha_nacimiento: sol?.fecha_nacimiento?.toISOString().split("T")[0] || "",
        ciudad_nacimiento: r.resolveCiudad(sol?.ciudad),
        nivel_educativo: r.resolveNivelEducativo(sol?.nivel_educativo),
        codigo_categoria: sol?.codigo_categoria || "",
        empresa: {
          nit: sol?.nit || "",
          razon_social: sol?.razon_social || "",
          direccion: (informacionLaboral.empresa_direccion as string) || "",
          telefono: (informacionLaboral.empresa_telefono as string) || "",
          ciudad_codigo:
            (informacionLaboral.empresa_ciudad as string) || sol?.ciudad || "",
          representante_legal: (informacionLaboral.representante_nombre as string) || "",
          representante_cedula: (informacionLaboral.representante_documento as string) || "",
          estado: "A"
        },
        estado: "A",
        fecha_afiliacion: sol?.created_at?.toISOString().split("T")[0] || "",
        cargo: r.resolveOcupacion(sol?.cargo),
        tipo_contrato: r.resolveTipoContrato(sol?.tipo_contrato || ""),
        personas_a_cargo: sol?.personas_a_cargo || 0,
        antiguedad_meses: sol?.antiguedad_meses || 0
      }
    };
  };

  return { buildPayload };
};

export default pdfPayloadService;