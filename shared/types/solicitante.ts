import type { In } from "vue-router/dist/index-D_VEAp3P.js";
import type { CiudadOption } from "./componentes";
import type {
  CodigoTipoDocumento,
  EstadoCivil,
  NivelEducativoParam,
  Ocupacion,
  SectorEconomico,
  SexoParam,
  TipoViviendaParam
} from "./parametros";
import type { InformacionLaboral, SolicitudCreditoPayload } from "./payload";

export interface SolicitanteBasic {
  email: string;
  nombres_apellidos: string;
  numero_documento: string;
  telefono_movil?: string;
  tipo_documento: string;
  fecha_nacimiento?: string;
  genero?: string;
  codigo_categoria: string;
  cargo?: string;
  nivel_educativo?: string;
  nombres: string;
  apellidos: string;
  nit: string;
  razon_social: string;
  direccion?: string;
  pais_residencia?: string;
  personas_a_cargo?: number;
  tipo_vivienda?: string;
  ciudad?: string;
}

export interface Solicitante extends SolicitanteBasic {
  tipo_persona: string;
  estado_civil: string;
  profesion: string;
  telefono?: string;
  celular: string;
  barrio: string;
  departamento: string;
  vive_con_nucleo_familiar?: boolean;
  fecha_vinculacion?: string;
  salario: number;
  antiguedad_meses?: number;
  tipo_contrato?: string;
  sector_economico?: string;
}

export interface SolicitanteBackend extends Solicitante {
  id: number;
  solicitud_id: string;
  tipo_documento: string;
  fecha_nacimiento: string;
  pais_nacimiento?: string;
  fecha_expedicion?: string;
  genero: string;
  telefono_fijo?: string;
}

export interface SolicitanteProps {
  form: SolicitudCreditoPayload;
  ciudades?: readonly CiudadOption[];
  tiposDocumento?: readonly CodigoTipoDocumento[];
  sexos?: readonly SexoParam[];
  nivelesEducativos?: readonly NivelEducativoParam[];
  tiposVivienda?: readonly TipoViviendaParam[];
  ocupaciones?: readonly Ocupacion[];
  estadoCiviles?: readonly EstadoCivil[];
  sectoresEconomicos?: readonly SectorEconomico[];
  errors?: Record<string, string>;
}
