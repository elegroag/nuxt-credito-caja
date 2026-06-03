import type { Moneda, TipoBien, TiempoServicioUnidad } from "./enums";
import type { Solicitante } from "./solicitante";
import type { LineaCredito } from "./linea-credito";
import type { Solicitud } from "./solicitud";

export interface Conyuge {
  identificacion: string;
  nombres_apellidos: string;
  ingresos_laborales: number;
  trabaja: boolean;
  moneda?: Moneda;
  telefono_movil: string;
  empresa?: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  };
}

export interface InformacionLaboral {
  empresa_razon_social?: string;
  empresa_nit?: string;
  empresa_telefono?: string;
  empresa_direccion?: string;
  empresa_ciudad?: string;
  cargo?: string;
  fecha_ingreso?: string;
  tipo_contrato?: string;
  nombre_pagador?: string;
  tiempo_servicio?: number;
  tiempo_servicio_unidad?: TiempoServicioUnidad;
}

export interface IngresosDescuentos {
  moneda: Moneda;
  salario_basico_mensual: number;
  subsidio_transporte: number;
  horas_extras: number;
  comisiones: number;
  otros_ingresos: number;
  total_ingresos: number;
  salud_pension: number;
  libranzas_comfaca: number;
  otras_libranzas: number;
  judiciales: number;
  otras_deducciones: number;
  total_descuentos: number;
  total_neto_recibido: number;
}

export interface Deuda {
  acreedor_nombre: string;
  concepto: string;
  valor_cuota: number;
  saldo_obligacion: number;
}

export interface Propiedad {
  tipo_bien: TipoBien;
  descripcion: string;
  ciudad: string;
  matricula_inmobiliaria?: string;
  modelo_o_matricula?: string;
  valor_comercial: number;
}

export interface InformacionEconomica {
  moneda: Moneda;
  arrendamientos: number;
  otros: number;
  descripcion: string;
  total_gastos: number;
  gastos_descripcion: string;
  total_activos: number;
  total_pasivos: number;
}

export interface Referencia {
  nombre_apellidos: string;
  celular: string;
}

export interface Referencias {
  familiares: Referencia[];
  personales: Referencia[];
}

export interface SolicitudCreditoPayload {
  solicitud: Solicitud;
  linea_credito: LineaCredito;
  solicitante: Solicitante;
  conyuge?: Conyuge;
  informacion_laboral: InformacionLaboral;
  ingresos_descuentos: IngresosDescuentos;
  informacion_economica: InformacionEconomica;
  propiedades: Array<Propiedad>;
  deudas: Array<Deuda>;
  referencias: Referencias;
}
