import type { CiudadOption } from "./componentes";

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
  form: any;
  ciudades?: CiudadOption[];
  tiposDocumento?: any[];
  sexos?: any[];
  nivelesEducativos?: any[];
  tiposVivienda?: any[];
  ocupaciones?: any[];
  estadoCiviles?: any[];
}
