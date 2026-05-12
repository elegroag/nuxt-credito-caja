export interface EstadoSolicitudData {
  _id: string
  activo: boolean
  color: string
  descripcion: string
  id: string
  nombre: string
  orden: number
}

export type EstadoSolicitudInicio = string;

export interface SolicitudResumen {
  numero_solicitud: string
  detalle_modalidad: string | null
  valor_solicitud: number | string | null
  estado: string
  created_at: string
}

export interface InicioState {
  solicitudes: SolicitudResumen[]
  loadingSolicitudes: boolean
  solicitudesError: string
}
