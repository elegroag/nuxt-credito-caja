export interface NavItem {
  label: string
  to: string
  abbr: string
  /** Nombre Iconify / Nuxt Icon, p. ej. `i-lucide-bell` */
  icon: string
  adminOnly?: boolean
  requiredPermissions?: string[]
  requiredRoles?: string[]
  excludedRoles?: string[]
  category?: "user" | "admin"
}

export interface HealthStatus {
  isConnected: boolean
  connectionError: string
  checkingConnection: boolean
  connectionMessage: string
  connectionStatusClass: string
}
