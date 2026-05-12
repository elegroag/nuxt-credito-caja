export interface UserSession {
  id: string
  username: string
  name: string
  email: string
  roles: string[]
  trabajador?: {
    nit: string
    estado: string
    sucursal: string
    phone: string
    email: string
  } | null
  adviser?: {
    estado: string
    phone: string
    email: string
    codigo_funcionario: string
    tipo_funcionario: string
  } | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterPayload {
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  confirmar_password: string
  username: string
  password: string
}

export interface RecoveryPayload {
  email: string
  phone: string
}

export interface JwtPayload {
  sub: number
  email: string
  roles: string[]
  iat?: number
  exp?: number
}
