// auth.d.ts
declare module "#auth-utils" {
  // Cookie Nitro: solo datos livianos (sin permissions/routeAccess).
  interface User {
    id: string
    email: string
    name: string
    roles: string[]
    username: string
    /** Solo en respuestas login/verify al cliente; no persistir en cookie. */
    permissions?: string[]
    /** Solo en respuestas login/verify al cliente; no persistir en cookie. */
    routeAccess?: Array<{
      path_prefix: string
      permission_key: string
      ordering: number
    }>
    numero_documento?: string
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

  interface UserSession {
    loggedInAt: Date
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface SecureSessionData extends Record<string, never> {}
}

export {};
