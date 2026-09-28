import type { KiaiProcessDetail } from "~~/server/services/api-kiai";

export interface SolicitudFirmaWorkerData {
  numero_solicitud: string
  proceso_id: string
  firmantesCount: number
  accessToken?: string
}

export interface SolicitudFirmaWorkerResult {
  numero_solicitud: string
  proceso_id: string
  success: boolean
  message: string
  detalle?: KiaiProcessDetail
  error?: string
}
