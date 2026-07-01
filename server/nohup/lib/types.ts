export interface SolicitudFirmaWorkerData {
  numero_solicitud: string
  firmantesCount: number
}

export interface SolicitudFirmaWorkerResult {
  numero_solicitud: string
  success: boolean
  code: string
  message: string
  data?: {
    NroSolicitud?: string
    Fecha?: string
    Link?: string
  }
  error?: string
}
