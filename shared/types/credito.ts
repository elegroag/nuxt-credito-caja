export type TipoCreditoVigencia = {
  auxest: string;
  codcap: string;
  codcen: string;
  codcon: string;
  codcre: string;
  codint: string;
  codmor: string;
  codser: string;
  detalle: string;
  estado: string;
  estcre: number;
  girexc: number | null;
  modcre: string | null;
  modxml4: number;
  numcuo: number;
  pagseg: string;
  repdcr: string;
  tipcre: string;
  tipfin: string;
};

export type FondoCreditoSocial = {
  codcre: string;
  control: string;
  detalle: string;
};

export type TipoInversion = {
  detalle: string;
  tipinv: string;
};

export type DatoGeneralCredito = {
  asejur: string;
  audtra: string;
  auxcaj: string;
  auxcas: string | null;
  auxexc: string;
  auxfonreg: string;
  auxmay: string;
  auxpigsub: string;
  carasejur: string;
  cardiradm: string;
  carjefadm: string;
  carjefcre: string;
  carjeffin: string;
  cnt: string;
  codapl: string;
  codcen: string;
  codcop: string;
  codgardef: string;
  consecutivo: number;
  conta: string;
  control: string;
  cueban: string | null;
  cuomax: number | null;
  diradm: string;
  facfonreg: string;
  forpagdef: string;
  jefadm: string;
  jefcre: string;
  jeffin: string;
  marsubdef: string;
  nitfonreg: string;
  numdoctes: number | null;
  online: string;
  sofnumlic: string;
  subsi: string;
  valmax: number;
  valseg: number;
};
