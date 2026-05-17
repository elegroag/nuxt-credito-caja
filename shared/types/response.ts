import type {
  DatoGeneralCredito,
  FondoCreditoSocial,
  TipoCreditoVigencia,
  TipoInversion
} from "./credito";
import type {
  BancoDesembolso,
  Categorias,
  Ciudades,
  CodigoTipoDocumento,
  Departamentos,
  EstadoCivil,
  FormaPago,
  FormaPagoTesoreria,
  GarantiaPago,
  MotivoRechazo,
  NivelEducativoParam,
  Ocupacion,
  OficinaCredito,
  Paises,
  PeriodoPago,
  SexoParam,
  SectorEconomico,
  TipoContrato,
  TipoDocumentoRequerido,
  TipoTercero,
  TipoViviendaParam
} from "./parametros";

export interface ParametrosData {
  bancos_desembolso: readonly BancoDesembolso[];
  codigos_tipo_documento: readonly CodigoTipoDocumento[];
  datos_generales_del_creditos: readonly DatoGeneralCredito[];
  estado_civiles: readonly EstadoCivil[];
  fondos_de_credito_social: readonly FondoCreditoSocial[];
  formas_de_pago: readonly FormaPago[];
  formas_de_pagos_tesoreria: readonly FormaPagoTesoreria[];
  garantia_de_pagos: readonly GarantiaPago[];
  motivos_de_rechazos: readonly MotivoRechazo[];
  nivel_educativos: readonly NivelEducativoParam[];
  ocupaciones: readonly Ocupacion[];
  oficinas_de_credito: readonly OficinaCredito[];
  periodos_de_pago: readonly PeriodoPago[];
  sectores_economicos: readonly SectorEconomico[];
  sexos: readonly SexoParam[];
  tipo_contrato: readonly TipoContrato[];
  tipo_vivienda: readonly TipoViviendaParam[];
  tipos_de_credito_en_vigencia: readonly TipoCreditoVigencia[];
  tipos_de_inversion: readonly TipoInversion[];
  tipos_de_terceros: readonly TipoTercero[];
  tipos_documentos_requeridos: readonly TipoDocumentoRequerido[];
  categorias: readonly Categorias[];
  ciudades: readonly Ciudades[];
  departamentos: readonly Departamentos[];
  paises: readonly Paises[];
}

export interface ParametrosResponse {
  data: ParametrosData;
  message: string;
  success: boolean;
}
