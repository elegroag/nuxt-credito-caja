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
  TipoContrato,
  TipoDocumentoRequerido,
  TipoTercero,
  TipoViviendaParam
} from "./parametros";

export interface ParametrosData {
  bancos_desembolso: BancoDesembolso[];
  codigos_tipo_documento: CodigoTipoDocumento[];
  datos_generales_del_creditos: DatoGeneralCredito[];
  estado_civiles: EstadoCivil[];
  fondos_de_credito_social: FondoCreditoSocial[];
  formas_de_pago: FormaPago[];
  formas_de_pagos_tesoreria: FormaPagoTesoreria[];
  garantia_de_pagos: GarantiaPago[];
  motivos_de_rechazos: MotivoRechazo[];
  nivel_educativos: NivelEducativoParam[];
  ocupaciones: Ocupacion[];
  oficinas_de_credito: OficinaCredito[];
  periodos_de_pago: PeriodoPago[];
  sexos: SexoParam[];
  tipo_contrato: TipoContrato[];
  tipo_vivienda: TipoViviendaParam[];
  tipos_de_credito_en_vigencia: TipoCreditoVigencia[];
  tipos_de_inversion: TipoInversion[];
  tipos_de_terceros: TipoTercero[];
  tipos_documentos_requeridos: TipoDocumentoRequerido[];
  categorias: Categorias[];
  ciudades: Ciudades[];
  departamentos: Departamentos[];
  paises: Paises[];
}

export interface ParametrosResponse {
  data: ParametrosData;
  message: string;
  success: boolean;
}
