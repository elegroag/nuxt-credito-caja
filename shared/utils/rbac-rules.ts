import type { RouteAccessRule } from "~~/shared/types/users-session";

/** Reglas puras de visibilidad de ítems de menú (testeable sin BD). */
export const isMenuItemVisible = (
  roles: string[],
  permissions: string[],
  opts: {
    requiredRoles?: string[]
    excludedRoles?: string[]
    requiredPermissions?: string[]
  }
): boolean => {
  const requiredRoles = opts.requiredRoles || [];
  const excludedRoles = opts.excludedRoles || [];
  const requiredPermissions = opts.requiredPermissions || [];
  const isAdmin = roles.includes("administrator") || permissions.includes("system.admin");

  // Admin ve todo el menú (incl. ítems con excluded_roles como Convenios)
  if (isAdmin) return true;

  if (excludedRoles.some(r => roles.includes(r))) return false;
  if (requiredRoles.length > 0 && !requiredRoles.some(r => roles.includes(r))) return false;
  if (
    requiredPermissions.length > 0
    && !requiredPermissions.every(p => permissions.includes(p))
  ) {
    return false;
  }
  return true;
};

/** Longest-prefix match de route_permissions (testeable sin BD). */
export const canAccessPathWithRules = (
  path: string,
  roles: string[],
  permissions: string[],
  rules: RouteAccessRule[]
): boolean => {
  if (!roles?.length) return false;
  if (roles.includes("administrator") || permissions.includes("system.admin")) {
    return true;
  }

  const normalized = path.split("?")[0] || path;
  let best: RouteAccessRule | null = null;
  for (const rule of rules) {
    if (!normalized.startsWith(rule.path_prefix)) continue;
    if (
      !best
      || rule.path_prefix.length > best.path_prefix.length
      || (rule.path_prefix.length === best.path_prefix.length && rule.ordering < best.ordering)
    ) {
      best = rule;
    }
  }

  if (!best) return true;
  return permissions.includes(best.permission_key);
};
