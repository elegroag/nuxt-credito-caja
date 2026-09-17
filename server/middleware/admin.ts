import rbacService from "~~/server/services/rbac.service";

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/admin")) {
    return;
  }

  // Lectura liviana de roles para formularios de usuarios (no el CRUD RBAC)
  if (event.path === "/api/admin/roles" || event.path === "/api/admin/roles/") {
    return;
  }

  const session = await requireUserSession(event);
  const roles = session.user.roles || [];
  const rbac = rbacService();

  // Sesión Nitro es liviana: permisos y reglas siempre desde BD
  const permissions = await rbac.getPermissionsForRoles(roles);
  const rules = await rbac.getRouteAccessRules();

  const allowed = rbac.canAccessPath(event.path, roles, permissions, rules);
  if (!allowed) {
    throw createError({
      statusCode: 403,
      message: "Unauthorized"
    });
  }

  return;
});
