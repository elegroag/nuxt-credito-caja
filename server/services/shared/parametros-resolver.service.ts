/**
 * parametros-resolver.service.ts
 *
 * Resuelve códigos de catálogo a sus valores de detalle (texto legible).
 * Recibimos los catálogos ya cargados desde datosApiSisuwebService.
 *
 * RESPONSABILIDAD: traducción de códigos -> texto para presentación/PDF.
 * No hace fetching, no accede a DB, no construye payloads.
 */

import type {
  Ciudades,
  Paises,
  Ocupacion,
  SectorEconomico,
  CodigoTipoDocumento,
  TipoViviendaParam,
  TipoContratoParam,
  NivelEducativoParam,
  SexoParam,
  EstadoCivil
} from "~~/shared/types/parametros";

export interface ParametrosCatalogos {
  ciudades: readonly Ciudades[];
  paises: readonly Paises[];
  ocupaciones: readonly Ocupacion[];
  sectores_economicos: readonly SectorEconomico[];
  codigos_tipo_documento: readonly CodigoTipoDocumento[];
  tipo_vivienda: readonly TipoViviendaParam[];
  tipo_contrato: readonly TipoContratoParam[];
  nivel_educativos: readonly NivelEducativoParam[];
  sexos: readonly SexoParam[];
  estado_civiles: readonly EstadoCivil[];
}

const parametrosResolver = () => {
  let catalogos: ParametrosCatalogos | null = null;

  /**
   * Inicializa el resolver con los catálogos cargados.
   * Debe llamarse antes de usar cualquier resolve*.
   */
  const init = (catalogosParam: ParametrosCatalogos) => {
    catalogos = catalogosParam;
  };

  // ---- Resolvedores ----

  const resolveCiudad = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.ciudades.find((c) => c.codciu === codigo)?.detciu ?? codigo;
  };

  const resolvePais = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.paises.find((p) => p.cod1 === codigo)?.nombre ?? codigo;
  };

  const resolveOcupacion = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.ocupaciones.find((o) => o.codocu === codigo)?.detalle ?? codigo;
  };

  const resolveSectorEconomico = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.sectores_economicos.find((s) => s.sector === codigo)?.detalle ?? codigo;
  };

  const resolveTipoDocumento = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return (
      catalogos.codigos_tipo_documento.find((d) => d.coddoc === codigo)?.detdoc ?? codigo
    );
  };

  const resolveTipoVivienda = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.tipo_vivienda.find((v) => v.vivienda === codigo)?.detalle ?? codigo;
  };

  const resolveTipoContrato = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.tipo_contrato.find((t) => t.tipcon === codigo)?.detalle ?? codigo;
  };

  const resolveNivelEducativo = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return (
      catalogos.nivel_educativos.find((n) => n.nivedu === codigo)?.detalle ?? codigo
    );
  };

  const resolveSexo = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.sexos.find((s) => s.codsex === codigo)?.detsex ?? codigo;
  };

  const resolveEstadoCivil = (codigo?: string | null): string => {
    if (!catalogos || !codigo) return codigo ?? "";
    return catalogos.estado_civiles.find((e) => e.estciv === codigo)?.detest ?? codigo;
  };

  return {
    init,
    resolveCiudad,
    resolvePais,
    resolveOcupacion,
    resolveSectorEconomico,
    resolveTipoDocumento,
    resolveTipoVivienda,
    resolveTipoContrato,
    resolveNivelEducativo,
    resolveSexo,
    resolveEstadoCivil
  };
};

export default parametrosResolver;