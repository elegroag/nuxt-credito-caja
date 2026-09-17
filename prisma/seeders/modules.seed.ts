export type ModuleSeed = {
  key: string
  title: string
  href: string
  icon: string
  abbr?: string
  section: "General" | "Administración" | "Parametrización"
  ordering: number
  description?: string
  permissionKeys?: string[]
  requiredRoles?: string[]
  excludedRoles?: string[]
};

/** Menú canónico alineado al sidebar actual. */
export const modulesSeed: ModuleSeed[] = [
  {
    key: "dash.inicio",
    title: "Inicio",
    href: "/dash",
    icon: "i-lucide-home",
    abbr: "IN",
    section: "General",
    ordering: 10,
    description: "Panel principal"
  },
  {
    key: "dash.simulador",
    title: "Simulador",
    href: "/dash/simulador/lineas-credito",
    icon: "i-lucide-calculator",
    abbr: "SI",
    section: "General",
    ordering: 20,
    permissionKeys: ["simulador.view"],
    requiredRoles: ["user_trabajador", "administrator", "adviser", "user_empresa", "empleador"]
  },
  {
    key: "dash.contratos",
    title: "Contratos",
    href: "/dash/responsabilidades",
    icon: "i-lucide-file-signature",
    abbr: "CO",
    section: "General",
    ordering: 30,
    permissionKeys: ["responsabilidades.view"],
    requiredRoles: ["user_codeudor", "user_trabajador"]
  },
  {
    key: "dash.codeudores",
    title: "Mis codeudores",
    href: "/dash/codeudores",
    icon: "i-lucide-users",
    abbr: "MC",
    section: "General",
    ordering: 40,
    permissionKeys: ["codeudores.manage"],
    requiredRoles: ["user_trabajador", "administrator"]
  },
  {
    key: "dash.notify",
    title: "Notificaciones",
    href: "/dash/notify",
    icon: "i-lucide-bell",
    abbr: "NO",
    section: "General",
    ordering: 50
  },
  {
    key: "dash.perfil",
    title: "Perfil",
    href: "/dash/perfil",
    icon: "i-lucide-user",
    abbr: "PE",
    section: "General",
    ordering: 60
  },
  {
    key: "dash.oficinas",
    title: "Oficinas",
    href: "/dash/oficinas",
    icon: "i-lucide-map-pin",
    abbr: "OF",
    section: "General",
    ordering: 70
  },
  {
    key: "dash.terminos",
    title: "Terminos",
    href: "/dash/terminos",
    icon: "i-lucide-file-text",
    abbr: "TE",
    section: "General",
    ordering: 80
  },
  {
    key: "admin.firmas",
    title: "Gestión firmas",
    href: "/admin/firmas",
    icon: "i-lucide-share-2",
    abbr: "GF",
    section: "Administración",
    ordering: 10,
    permissionKeys: ["firmas.view"]
  },
  {
    key: "admin.solicitudes",
    title: "Solicitudes",
    href: "/admin/solicitudes",
    icon: "i-lucide-list",
    abbr: "SO",
    section: "Administración",
    ordering: 20,
    permissionKeys: ["solicitudes.view"]
  },
  {
    key: "admin.convenios",
    title: "Convenios",
    href: "/admin/convenios",
    icon: "i-lucide-building-2",
    abbr: "CV",
    section: "Administración",
    ordering: 25,
    permissionKeys: ["convenios.view"],
    excludedRoles: ["user_trabajador"]
  },
  {
    key: "admin.reportes",
    title: "Reportes",
    href: "/admin/reportes",
    icon: "i-lucide-bar-chart-3",
    abbr: "RE",
    section: "Administración",
    ordering: 30,
    permissionKeys: ["reportes.view"]
  },
  {
    key: "admin.users",
    title: "Usuarios",
    href: "/admin/users",
    icon: "i-lucide-users",
    abbr: "US",
    section: "Administración",
    ordering: 40,
    permissionKeys: ["users.view"]
  },
  {
    key: "admin.configuraciones",
    title: "Configuraciones",
    href: "/admin/configuraciones",
    icon: "i-lucide-settings",
    abbr: "CF",
    section: "Parametrización",
    ordering: 10,
    permissionKeys: ["configuraciones.view"]
  },
  {
    key: "admin.roles",
    title: "Roles",
    href: "/admin/roles",
    icon: "i-lucide-shield",
    abbr: "RL",
    section: "Parametrización",
    ordering: 15,
    permissionKeys: ["roles.manage"]
  },
  {
    key: "admin.permisos",
    title: "Permisos",
    href: "/admin/permisos",
    icon: "i-lucide-key-round",
    abbr: "PM",
    section: "Parametrización",
    ordering: 16,
    permissionKeys: ["permissions.manage"]
  },
  {
    key: "admin.modulos",
    title: "Módulos",
    href: "/admin/modulos",
    icon: "i-lucide-layout-list",
    abbr: "MD",
    section: "Parametrización",
    ordering: 17,
    permissionKeys: ["modules.manage"]
  },
  {
    key: "admin.contenido",
    title: "CMS",
    href: "/admin/contenido",
    icon: "i-lucide-file-text",
    abbr: "CM",
    section: "Parametrización",
    ordering: 20,
    permissionKeys: ["cms.view"]
  },
  {
    key: "admin.carrusel",
    title: "Carrusel",
    href: "/admin/carrusel",
    icon: "i-lucide-images",
    abbr: "CA",
    section: "Parametrización",
    ordering: 30,
    permissionKeys: ["carrusel.view"]
  }
];

/** Reglas de ruta (páginas y API admin) → permiso requerido. */
export const routePermissionsSeed: Array<{ path_prefix: string, permissionKey: string, ordering: number }> = [
  { path_prefix: "/admin/users", permissionKey: "users.view", ordering: 10 },
  { path_prefix: "/api/admin/users", permissionKey: "users.view", ordering: 11 },
  { path_prefix: "/admin/firmas", permissionKey: "firmas.view", ordering: 20 },
  { path_prefix: "/api/admin/firmas", permissionKey: "firmas.view", ordering: 21 },
  { path_prefix: "/admin/solicitudes", permissionKey: "solicitudes.view", ordering: 30 },
  { path_prefix: "/api/admin/solicitudes", permissionKey: "solicitudes.view", ordering: 31 },
  { path_prefix: "/admin/convenios", permissionKey: "convenios.view", ordering: 40 },
  { path_prefix: "/api/admin/convenios", permissionKey: "convenios.view", ordering: 41 },
  { path_prefix: "/admin/reportes", permissionKey: "reportes.view", ordering: 50 },
  { path_prefix: "/api/admin/reportes", permissionKey: "reportes.view", ordering: 51 },
  { path_prefix: "/admin/configuraciones", permissionKey: "configuraciones.view", ordering: 60 },
  { path_prefix: "/api/admin/configurations", permissionKey: "configuraciones.view", ordering: 61 },
  { path_prefix: "/admin/roles", permissionKey: "roles.manage", ordering: 62 },
  { path_prefix: "/admin/permisos", permissionKey: "permissions.manage", ordering: 63 },
  { path_prefix: "/admin/modulos", permissionKey: "modules.manage", ordering: 64 },
  { path_prefix: "/api/admin/rbac/roles", permissionKey: "roles.manage", ordering: 65 },
  { path_prefix: "/api/admin/rbac/permissions", permissionKey: "permissions.manage", ordering: 66 },
  { path_prefix: "/api/admin/rbac/modules", permissionKey: "modules.manage", ordering: 67 },
  { path_prefix: "/api/admin/rbac", permissionKey: "roles.manage", ordering: 68 },
  { path_prefix: "/admin/contenido", permissionKey: "cms.view", ordering: 70 },
  { path_prefix: "/api/admin/cms", permissionKey: "cms.view", ordering: 71 },
  { path_prefix: "/admin/carrusel", permissionKey: "carrusel.view", ordering: 80 },
  { path_prefix: "/api/admin/carrusel", permissionKey: "carrusel.view", ordering: 81 },
  { path_prefix: "/admin", permissionKey: "system.admin", ordering: 100 },
  { path_prefix: "/api/admin", permissionKey: "system.admin", ordering: 101 }
];
