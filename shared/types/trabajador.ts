export type Empresa = {
  ciudad_codigo: string;
  direccion: string;
  nit: string;
  razon_social: string;
  telefono: string;
};

export type Trabajador = {
  cargo: string;
  cedula: string;
  cedtra?: string;
  ciudad_codigo: string;
  ciudad_nacimiento: string;
  direccion: string;
  email: string;
  empresa: Empresa;
  estado: string;
  estado_civil: string;
  fecha_afiliacion: string;
  fecha_nacimiento: string;
  fecha_salario: string;
  nivel_educativo: string;
  primer_apellido: string;
  primer_nombre: string;
  salario: number;
  segundo_apellido: string;
  segundo_nombre: string;
  sexo: string;
  telefono: string;
  tipo_documento: string;
  codigo_categoria?: string;
  tipo_vivienda?: string;
  tipo_contrato?: string;
  personas_a_cargo?: number;
  antiguedad_meses?: number;
};

export type ConvenioActivo = {
  id: string | number;
  nit: string | number;
  razon_social: string;
  fecha_convenio?: string | null;
  fecha_vencimiento?: string | null;
  estado?: string | null;
  representante_nombre?: string | null;
  representante_documento?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  departamento?: string | null;
  sector_economico?: string | null;
  tipo_empresa?: string | null;
};
