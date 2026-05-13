export type Moneda = "COP";

export type RolEnSolicitud = "T" | "S" | "C" | "E";

export type TipoIdentificacion = "CC" | "CE";

export type ProductoTipo = string;

export type Sexo = "M" | "F";

export type NivelEducativo =
  | "primaria"
  | "bachillerato"
  | "tecnico"
  | "universitario"
  | "posgrado"
  | "ninguno";

export type TipoVivienda = string | "N" | "F" | "P" | "A" | "H";

export type TiempoServicioUnidad = "meses" | "anios";

export type TipoBien = "vivienda" | "vehiculo";

export type EstadoSolicitud =
  | "POSTULADO"
  | "DOCUMENTOS_CARGADOS"
  | "ENVIADO_VALIDACION"
  | "PENDIENTE_FIRMADO"
  | "FIRMADO"
  | "ENVIADO_PENDIENTE_APROBACION"
  | "APROBADO"
  | "DESEMBOLSADO"
  | "FINALIZADO"
  | "RECHAZADO"
  | "DESISTE";

export const ESTADOS_SOLICITUD = [
  "POSTULADO",
  "DOCUMENTOS_CARGADOS",
  "ENVIADO_VALIDACION",
  "PENDIENTE_FIRMADO",
  "FIRMADO",
  "ENVIADO_PENDIENTE_APROBACION",
  "APROBADO",
  "DESEMBOLSADO",
  "FINALIZADO",
  "RECHAZADO",
  "DESISTE"
] as const;

export type SelectOptionValue = string | number | boolean;

export interface SelectOption {
  label: string;
  value: SelectOptionValue;
  description?: string;
}
