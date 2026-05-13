import type { TipoInversion } from "./credito";
import type { NivelEducativo, Sexo, TipoVivienda } from "./enums";
import type {
  Ciudades,
  CodigoTipoDocumento,
  EstadoCivil,
  Ocupacion,
  TipoContrato
} from "./parametros";

export interface WizardStep {
  key: string;
  title: string;
  short: string;
}

export interface WizardState {
  step: number;
  successModalOpen: boolean;
}

export interface WizardProps {
  parametros?: {
    steps: WizardStep[];
    ciudades: Ciudades[];
    ocupaciones: Ocupacion[];
    tipo_contrato: TipoContrato[];
    sexos: Sexo[];
    estado_civiles: EstadoCivil[];
    codigos_tipo_documento: CodigoTipoDocumento[];
    tipo_vivienda: TipoVivienda[];
    nivel_educativos: NivelEducativo[];
    tipos_de_inversion: TipoInversion[];
  };
  initialStep?: string;
}
