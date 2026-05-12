export interface Perfil {
  username: string
  email: string
  full_name: string
  phone: string
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
}

export interface PasswordData {
  password_actual: string
  nueva_password: string
  confirmar_password: string
}
