import type { Trabajador } from "./trabajador";
import type { PuntoAsesoria } from "./adviser";

export type SessionUser = {
  username: string
  roles: string[]
  permissions: string[]
  email: string
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  adviser_number?: string
  asesor?: {
    full_name: string
    email: string
    celular: string
    codigo_funcionario: string
    estado: string
    tipo_funcionario: string
  }
  trabajador?: Trabajador | null
  selected_punto?: PuntoAsesoria | null
};

export type SessionData = {
  accessToken: string
  tokenType: string
  user: SessionUser | null
};
