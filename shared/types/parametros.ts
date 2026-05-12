export type AuxiliarContable = {
  auxiliar: string
  auxold: string | null
  banco: string
  centros: string
  detalla: string
  detalle: string
  estado: string
  tercero: string
};

export type CentroCosto = {
  codcen: string
  detalle: string
};

export type DatoPeriodo = {
  ano: number
  cierre: string
  mes: number
};

export type DatoGeneralCredito = {
  asejur: string
  audtra: string
  auxcaj: string
  auxcas: string | null
  auxexc: string
  auxfonreg: string
  auxmay: string
  auxpigsub: string
  carasejur: string
  cardiradm: string
  carjefadm: string
  carjefcre: string
  carjeffin: string
  cnt: string
  codapl: string
  codcen: string
  codcop: string
  codgardef: string
  consecutivo: number
  conta: string
  control: string
  cueban: string | null
  cuomax: number | null
  diradm: string
  facfonreg: string
  forpagdef: string
  jefadm: string
  jefcre: string
  jeffin: string
  marsubdef: string
  nitfonreg: string
  numdoctes: number | null
  online: string
  sofnumlic: string
  subsi: string
  valmax: number
  valseg: number
};

export type EmpresaSeguro = {
  codmes: string
  codpag: string
  codzon: string
  digver: string
  direccion: string
  email: string | null
  factor: string
  fax: string | null
  fecsis: string
  nit: string
  nota: string | null
  razsoc: string
  telefono: string
  valmin: number | null
};

export type FondoCreditoSocial = {
  codcre: string
  control: string
  detalle: string
};

export type FormaPago = {
  detalle: string
  forpag: string
};

export type FormaPagoTesoreria = {
  detalle: string
  forpag: string
  tipo: string
};

export type GarantiaPago = {
  codgar: string
  detalle: string
};

export type MarcaReciboCaja = {
  auxdeb: string | null
  codcop: string
  detalle: string
  imprime: string
  marca: string
  online: string
  tipmov: string
};

export type MotivoRechazo = {
  detalle: string
  modrec: string
};

export type OficinaAfiliacionUsuario = {
  numero: number
  ofiafi: string
  usuario: number
};

export type OficinaCredito = {
  codcen: string
  codzon: string
  detalle: string
  direccion: string
  email: string
  nomrep: string
  ofiafi: string
  telefono: string
};

export type PeriodoPago = {
  detalle: string
  numdia: number
  perpag: string
};

export type PeriodoPagoDesembolso = {
  codban: string
  codcue: string
  detalle: string
};

export type TipoCreditoVigencia = {
  auxest: string
  codcap: string
  codcen: string
  codcon: string
  codcre: string
  codint: string
  codmor: string
  codser: string
  detalle: string
  estado: string
  estcre: number
  girexc: number | null
  modcre: string | null
  modxml4: number
  numcuo: number
  pagseg: string
  repdcr: string
  tipcre: string
  tipfin: string
};

export type TipoDistribucion = {
  coddis: string
  detalle: string
  recibo: string
};

export type TipoInversion = {
  detalle: string
  tipinv: string
};

export type TipoTercero = {
  detalle: string
  tipter: string
};

export type TipoDocumentoRequerido = {
  detalle: string
  tipdoc: string
};

// Tipos adicionales para detalles de solicitudes
export type CodigoTipoDocumento = {
  coddoc: string
  coddoc_circular: string
  codrua: string
  detdoc: string
};

export type Ocupacion = {
  codocu: string
  detalle: string
};

export type TipoViviendaParam = {
  vivienda: string
  detalle: string
};

export type TipoContrato = {
  tipcon: string
  detalle: string
};

export type EstadoCivil = {
  detest: string
  estciv: string
  estciv_circular: string
};

export type SexoParam = {
  codsex: string
  codsex_circular: string
  detsex: string
};

export type NivelEducativoParam = {
  detalle: string
  nivedu: string
};

export type BancoDesembolso = {
  codban: string
  codcue: string
  detalle: string
};

export type ParametrosResponse = {
  data: {
    auxiliares_contables: AuxiliarContable[]
    bancos_desembolso: BancoDesembolso[]
    centros_de_costos: CentroCosto[]
    codigos_tipo_documento: CodigoTipoDocumento[]
    datos_de_periodos: DatoPeriodo[]
    datos_generales_del_creditos: DatoGeneralCredito[]
    empresa_de_seguros: EmpresaSeguro[]
    estado_civiles: EstadoCivil[]
    fondos_de_credito_social: FondoCreditoSocial[]
    formas_de_pago: FormaPago[]
    formas_de_pagos_tesoreria: FormaPagoTesoreria[]
    garantia_de_pagos: GarantiaPago[]
    marcas_de_recibos_de_caja: MarcaReciboCaja[]
    motivos_de_rechazos: MotivoRechazo[]
    nivel_educativos: NivelEducativoParam[]
    ocupaciones: Ocupacion[]
    oficinas_de_afiliacion_por_usuario: OficinaAfiliacionUsuario[]
    oficinas_de_credito: OficinaCredito[]
    periodos_de_pago: PeriodoPago[]
    periodos_de_pago_desembolsos: PeriodoPagoDesembolso[]
    sexos: SexoParam[]
    tipo_contrato: TipoContrato[]
    tipo_vivienda: TipoViviendaParam[]
    tipos_de_credito_en_vigencia: TipoCreditoVigencia[]
    tipos_de_distribucion: TipoDistribucion[]
    tipos_de_inversion: TipoInversion[]
    tipos_de_terceros: TipoTercero[]
    tipos_documentos_requeridos: TipoDocumentoRequerido[]
  }
  message: string
  success: boolean
};
