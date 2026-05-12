/**
 * Configuración de autenticación
 * Define las páginas y rutas que requieren o excluyen autenticación
 */

// Páginas que no requieren autenticación
export const AUTH_EXCLUDED_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password"
] as const;

// Páginas que siempre requieren autenticación
export const AUTH_REQUIRED_PAGES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/admin",
  "/verify-email"
] as const;

// Patrones de rutas que requieren autenticación
export const AUTH_REQUIRED_PATTERNS = [
  "/dashboard/",
  "/profile/",
  "/settings/",
  "/admin/",
  "/solicitudes/",
  "/creditos/",
  "/documentos/"
] as const;

// Configuración de permisos por ruta
export const ROUTE_PERMISSIONS = {
  // Rutas de administrador
  "/admin/users": ["administrator"],
  "/admin/users/": ["administrator"],
  "/admin/roles": ["administrator"],
  "/admin/roles/": ["administrator"],

  // Rutas de firmas (admin y adviser)
  "/admin/firmas": ["administrator", "adviser"],
  "/admin/firmas/": ["administrator", "adviser"],

  // Rutas de convenios (admin, adviser y trabajador)
  "/admin/convenios": ["administrator", "adviser", "user_trabajador"],
  "/admin/convenios/": ["administrator", "adviser", "user_trabajador"],

  // Rutas de solicitudes administrativas (admin y adviser)
  "/admin/solicitudes": ["administrator", "adviser"],
  "/admin/solicitudes/": ["administrator", "adviser"],

  // Rutas de aplicaciones (todos los roles autenticados)
  "/admin/applications": ["administrator", "adviser", "user_trabajador", "user_empresa"],
  "/admin/applications/": ["administrator", "adviser", "user_trabajador", "user_empresa"]
} as const;

// Función para verificar si una ruta debe excluirse de autenticación
export const isAuthExcludedRoute = (path: string): boolean => {
  return AUTH_EXCLUDED_PAGES.some(page => path.startsWith(page));
};

// Función para verificar si una ruta requiere autenticación
export const isAuthRequiredRoute = (path: string): boolean => {
  return AUTH_REQUIRED_PAGES.some(page => path.startsWith(page))
    || AUTH_REQUIRED_PATTERNS.some(pattern => path.startsWith(pattern));
};

// Función para verificar permisos específicos para una ruta
export const hasPermissionForRoute = (path: string, userRoles: string[]): boolean => {
  // Si no hay roles definidos, denegar acceso
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Los administradores tienen acceso a todo
  if (userRoles.includes("administrator")) {
    return true;
  }

  // Verificar permisos específicos por ruta
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path.startsWith(route)) {
      return allowedRoles.some(role => userRoles.includes(role));
    }
  }

  // Si no hay restricción específica, permitir acceso a usuarios autenticados
  return true;
};

// Función principal para determinar si se debe aplicar middleware de auth
export const shouldApplyAuthMiddleware = (path: string): boolean => {
  // Si está en página excluida, no aplicar
  if (isAuthExcludedRoute(path)) {
    return false;
  }

  // Si está en página requerida o coincide con patrón, aplicar
  if (isAuthRequiredRoute(path)) {
    return true;
  }

  // Por defecto, aplicar middleware a todas las páginas excepto las excluidas
  return true;
};
