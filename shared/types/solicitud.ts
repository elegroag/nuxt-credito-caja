import type { Moneda, ProductoTipo, RolEnSolicitud } from "./enums";

export interface Solicitud {
  numero_solicitud: string;
  numero_comprobante: string;
  valor_solicitud: number;
  categoria: string;
  rol_en_solicitud: RolEnSolicitud;
  valor_solicitado: number;
  cuota_mensual: number;
  plazo_meses: number;
  moneda: Moneda;
  tipcre?: string;
  modxml4?: number;
  detalle_modalidad?: string;
  fecha_radicado: string;
  producto_tipo: ProductoTipo;
  ha_tenido_credito: boolean;
}
