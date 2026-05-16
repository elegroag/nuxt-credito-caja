export interface GuardarNumeroSolicitudParams {
  linea_credito?: string;
  vigencia: number;
}

export interface GuardarSolicitudCreditoParams {
  numero_solicitud: string;
  owner_username: string;
  valor_solicitud: number;
  plazo_meses: number;
  tasa_interes: number;
  estado: string;
  producto_tipo?: string;
  numero_comprobante?: string;
  ha_tenido_credito?: boolean;
  detalle_modalidad?: string;
  tipo_credito?: string;
  moneda?: string;
  cuota_mensual?: number;
  rol_en_solicitud?: "T" | "S" | "C" | "E";
  fecha_radicado: Date;
}

export interface GuardarPayloadParams {
  solicitud_id: string;
  informacion_laboral?: any;
  ingresos_descuentos?: any;
  informacion_economica?: any;
  propiedades?: any;
  deudas?: any;
  referencias?: any;
  linea_credito?: any;
}

export interface GuardarSolicitanteParams {
  solicitud_id: string;
  tipo_persona?: "natural" | "juridica";
  tipo_documento: string;
  numero_documento: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  nit?: string;
  fecha_nacimiento?: Date;
  pais_nacimiento?: string;
  fecha_expedicion?: Date;
  genero?: "M" | "F" | "O";
  estado_civil?: string;
  nivel_educativo?: string;
  profesion?: string;
  email?: string;
  telefono_fijo?: string;
  telefono_movil?: string;
  direccion?: string;
  barrio?: string;
  ciudad?: string;
  pais_residencia?: string;
  tipo_vivienda?: string;
  vive_con_nucleo_familiar?: boolean;
  personas_a_cargo?: number;
  departamento?: string;
  codigo_categoria?: string;
  cargo?: string;
  salario?: number;
  antiguedad_meses?: number;
  tipo_contrato?: string;
  sector_economico?: string;
}

export interface GuardarTimelineParams {
  solicitud_id: string;
  estado: string;
  detalle?: string;
  usuario_username?: string;
  automatico?: boolean;
}

export interface GuardarFirmanteParams {
  solicitud_id: string;
  orden: number;
  tipo: string;
  nombre_completo: string;
  numero_documento: string;
  email: string;
  rol: string;
}
