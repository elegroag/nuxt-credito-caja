import type { EstadoSolicitudData } from "./inicio";

export type AuxiliarContable = {
  auxiliar: string;
  auxold: string | null;
  banco: string;
  centros: string;
  detalla: string;
  detalle: string;
  estado: string;
  tercero: string;
};

export type CentroCosto = {
  codcen: string;
  detalle: string;
};

export type DatoPeriodo = {
  ano: number;
  cierre: string;
  mes: number;
};

export type EmpresaSeguro = {
  codmes: string;
  codpag: string;
  codzon: string;
  digver: string;
  direccion: string;
  email: string | null;
  factor: string;
  fax: string | null;
  fecsis: string;
  nit: string;
  nota: string | null;
  razsoc: string;
  telefono: string;
  valmin: number | null;
};

export type FormaPago = {
  detalle: string;
  forpag: string;
};

export type FormaPagoTesoreria = {
  detalle: string;
  forpag: string;
  tipo: string;
};

export type GarantiaPago = {
  codgar: string;
  detalle: string;
};

export type MarcaReciboCaja = {
  auxdeb: string | null;
  codcop: string;
  detalle: string;
  imprime: string;
  marca: string;
  online: string;
  tipmov: string;
};

export type MotivoRechazo = {
  detalle: string;
  modrec: string;
};

export type OficinaAfiliacionUsuario = {
  numero: number;
  ofiafi: string;
  usuario: number;
};

export type OficinaCredito = {
  codcen: string;
  codzon: string;
  detalle: string;
  direccion: string;
  email: string;
  nomrep: string;
  ofiafi: string;
  telefono: string;
};

export type PeriodoPago = {
  detalle: string;
  numdia: number;
  perpag: string;
};

export type PeriodoPagoDesembolso = {
  codban: string;
  codcue: string;
  detalle: string;
};

export type TipoDistribucion = {
  coddis: string;
  detalle: string;
  recibo: string;
};

export type TipoTercero = {
  detalle: string;
  tipter: string;
};

export type TipoDocumentoRequerido = {
  detalle: string;
  tipdoc: string;
};

// Tipos adicionales para detalles de solicitudes
export type CodigoTipoDocumento = {
  coddoc: string;
  coddoc_circular: string;
  codrua: string;
  detdoc: string;
};

export type Ocupacion = {
  codocu: string;
  detalle: string;
};

export type TipoViviendaParam = {
  vivienda: string;
  detalle: string;
};

export type TipoContrato = {
  tipcon: string;
  detalle: string;
};

export type TipoContratoParam = {
  tipcon: string;
  detalle: string;
};

export type EstadoCivil = {
  detest: string;
  estciv: string;
  estciv_circular: string;
};

export type SexoParam = {
  codsex: string;
  codsex_circular: string;
  detsex: string;
};

export type NivelEducativoParam = {
  detalle: string;
  nivedu: string;
};

export type BancoDesembolso = {
  codban: string;
  codcue: string;
  detalle: string;
};

export type Categorias = {
  estado: string;
  detalle: string;
};

export type Departamentos = {
  coddep: string;
  detdep: string;
  codind: string;
};

export type Paises = {
  cod1: string;
  cod2: string;
  cod3: string;
  nombre: string;
};

export type Ciudades = {
  codciu: string;
  detciu: string;
  numpob: number;
  clarur: string;
};

// Interfaces para los parámetros según la estructura real de la API
export interface ParametroBase {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Cargo {
  codocu: string;
  detalle: string;
}

export interface ParametrosDetalles {
  tipos_identificacion: readonly CodigoTipoDocumento[];
  ciudades: readonly Ciudades[];
  cargos: readonly Cargo[];
  tipos_vivienda: readonly TipoViviendaParam[];
  tipos_contrato: readonly TipoContrato[];
  estados_solicitud: readonly EstadoSolicitudData[];
}

export type SectorEconomico = {
  sector: string;
  detalle: string;
};
