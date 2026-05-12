export interface LoginData {
  username: string;
  password: string;
}

export interface RegistroData {
  tipo_documento: string; // Mantenemos como string porque los valores son '1', '3', '4', etc.
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  username: string;
  password: string;
  confirmar_password: string;
}

export interface VerifyForm {
  codigo: string;
  coddoc?: string | null;
  documento?: string | null;
}
