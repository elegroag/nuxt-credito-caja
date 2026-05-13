import type { DocumentoCargado, Firmante } from "./documento";
import type { EstadoSolicitud } from "./enums";
import type { SolicitudCreditoPayload } from "./payload";

import type { SolicitanteBackend, SolicitanteBasic } from "./solicitante";

export interface TimelineItem {
  estado: EstadoSolicitud;
  fecha: string;
  detalle: string;
}

export interface PdfsGenerados {
  filename: string;
  path: string;
  generado_en: string;
}

export interface PdfGenerado {
  filename: string;
  path: string;
  generado_en: string;
}

export interface TimelineEntry {
  estado: EstadoSolicitud;
  fecha: string;
  detalle: string;
}

export interface SolicitudCredito {
  id: string;
  created_at: string;
  updated_at: string;
  cuota_mensual: number;
  valor_solicitud: number;
  detalle_modalidad: string;
  tipo_credito: string;
  estado: EstadoSolicitud;
  monto_solicitado: number;
  plazo_meses: number;
  numero_solicitud: string;
  fecha_postulacion?: string;
  fecha_radicado?: string;
  tasa_interes?: number;
  descripcion_solicitud?: string;
  solicitante: SolicitanteBasic;
  documentos: DocumentoCargado[];
  firmantes?: Firmante[];
  payload: SolicitudCreditoPayload;
  timeline: TimelineItem[];
  pdfs_generados?: PdfsGenerados[];
}

export interface SolicitudCreditoResponse extends Omit<SolicitudCredito, "solicitante"> {
  solicitante: SolicitanteBackend;
}
