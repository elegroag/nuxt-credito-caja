/**
 * Configuración de autenticación
 * Define las páginas y rutas que requieren o excluyen autenticación.
 * Los permisos por ruta viven en BD (route_permissions); este archivo
 * mantiene exclusiones y helpers de cliente con fallback.
 */

import type { RouteAccessRule } from "~~/shared/types/users-session";
import { canAccessPathWithRules as evaluatePathAccess } from "~~/shared/utils/rbac-rules";

export const AUTH_EXCLUDED_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify"
] as const;

export const AUTH_REQUIRED_PAGES = [
  "/dash",
  "/dashboard",
  "/profile",
  "/settings",
  "/admin",
  "/verify-email"
] as const;

export const AUTH_REQUIRED_PATTERNS = [
  "/dash/",
  "/dashboard/",
  "/profile/",
  "/settings/",
  "/admin/",
  "/solicitudes/",
  "/creditos/",
  "/documentos/"
] as const;

/** @deprecated Preferir routeAccess de sesión (BD). Fallback legacy por roles. */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin/users": ["administrator"],
  "/admin/roles": ["administrator"],
  "/admin/firmas": ["administrator", "adviser"],
  "/admin/convenios": ["administrator", "adviser"],
  "/admin/solicitudes": ["administrator", "adviser"],
  "/admin/reportes": ["administrator"],
  "/admin/configuraciones": ["administrator"],
  "/admin/contenido": ["administrator"],
  "/admin/carrusel": ["administrator"]
};

export const isAuthExcludedRoute = (path: string): boolean => {
  return AUTH_EXCLUDED_PAGES.some(page => path.startsWith(page));
};

export const isAuthRequiredRoute = (path: string): boolean => {
  return AUTH_REQUIRED_PAGES.some(page => path.startsWith(page))
    || AUTH_REQUIRED_PATTERNS.some(pattern => path.startsWith(pattern));
};

export const canAccessPathWithRules = (
  path: string,
  userRoles: string[],
  permissions: string[] = [],
  rules: RouteAccessRule[] = []
): boolean => {
  if (rules.length > 0) {
    return evaluatePathAccess(path, userRoles, permissions, rules);
  }

  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes("administrator") || permissions.includes("system.admin")) {
    return true;
  }

  const normalized = path.split("?")[0] || path;
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (normalized.startsWith(route)) {
      return allowedRoles.some(role => userRoles.includes(role));
    }
  }
  return true;
};

/** Compat: firma antigua usada por middleware. */
export const hasPermissionForRoute = (
  path: string,
  userRoles: string[],
  permissions: string[] = [],
  rules: RouteAccessRule[] = []
): boolean => {
  return canAccessPathWithRules(path, userRoles, permissions, rules);
};

export const shouldApplyAuthMiddleware = (path: string): boolean => {
  if (isAuthExcludedRoute(path)) return false;
  if (isAuthRequiredRoute(path)) return true;
  return true;
};
