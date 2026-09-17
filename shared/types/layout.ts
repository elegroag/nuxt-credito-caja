export type NavSection = "General" | "Administración" | "Parametrización" | string;

export interface NavItem {
  label: string
  to: string
  abbr: string
  /** Nombre Iconify / Nuxt Icon, p. ej. `i-lucide-bell` */
  icon: string
  section?: NavSection
  key?: string
  ordering?: number
  adminOnly?: boolean
  requiredPermissions?: string[]
  requiredRoles?: string[]
  excludedRoles?: string[]
  /** @deprecated Preferir `section` desde API de menú */
  category?: "user" | "admin"
}

export interface NavSectionGroup {
  name: string
  items: NavItem[]
}

export interface HealthStatus {
  isConnected: boolean
  connectionError: string
  checkingConnection: boolean
  connectionMessage: string
  connectionStatusClass: string
}
