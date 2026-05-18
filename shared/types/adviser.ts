import type { Trabajador } from './trabajador'

// Puntos de asesoría del asesor
export interface PuntoAsesoria {
  numero: string
  oficina_afiliacion: string
  estado: string
  code_oficina: string
  nombre_usuario: string
  email: string
}

// Respuesta de autenticación del asesor
export interface AdviserAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    username: string
    roles: string[]
    permissions: string[]
    email: string
    tipo_documento: string
    numero_documento: string
    nombres: string
    apellidos: string
    asesor?: {
      full_name: string
      email: string
      celular: string
      codigo_funcionario: string
      estado: string
      tipo_funcionario: string
    }
    trabajador?: Trabajador
    puntos_asesorias?: PuntoAsesoria[]
  }
}

// Respuesta de la API que incluye data
export interface ApiResponse<T> {
  data: T
  success: boolean
  message: string
  timestamp: string
}
