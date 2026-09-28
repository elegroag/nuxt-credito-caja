/**
 * Estados de un proceso de firma en KIAI (procesos_firma.estado)
 */

export type BadgeColorFirma = "primary" | "neutral" | "accent" | "destructive" | "muted";

/** Estados en los que el proceso sigue abierto y puede cancelarse */
export const ESTADOS_FIRMA_ABIERTOS = ["DRAFT", "PENDING", "IN_PROGRESS"];

const ETIQUETAS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Completado",
  DECLINED: "Rechazado",
  EXPIRED: "Vencido",
  CANCELLED: "Cancelado"
};

const ICONOS: Record<string, string> = {
  DRAFT: "i-lucide-file-pen",
  PENDING: "i-lucide-clock",
  IN_PROGRESS: "i-lucide-clock",
  COMPLETED: "i-lucide-check-circle",
  DECLINED: "i-lucide-x-circle",
  EXPIRED: "i-lucide-alert-circle",
  CANCELLED: "i-lucide-ban"
};

const BADGE_COLORS: Record<string, BadgeColorFirma> = {
  PENDING: "accent",
  IN_PROGRESS: "accent",
  COMPLETED: "primary",
  DECLINED: "destructive",
  EXPIRED: "muted",
  CANCELLED: "muted"
};

export const getEstadoFirmaLabel = (estado: string): string => ETIQUETAS[estado] || "Desconocido";

export const getEstadoFirmaIcon = (estado: string): string => ICONOS[estado] || "i-lucide-help-circle";

export const getEstadoFirmaBadgeColor = (estado: string): BadgeColorFirma => BADGE_COLORS[estado] || "neutral";
