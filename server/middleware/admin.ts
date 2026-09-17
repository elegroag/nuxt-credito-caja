import rbacService from "~~/server/services/rbac.service";

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/admin")) {
    return;
  }

  // Roles de sistema (lectura) permitido con users.view — no bloquear aquí
  if (event.path.startsWith("/api/admin/roles")) {
    return;
  }

  const session = await requireUserSession(event);
  const roles = session.user.roles || [];
  const rbac = rbacService();

  let permissions = (session.user as { permissions?: string[] }).permissions || [];
  if (!permissions.length) {
    permissions = await rbac.getPermissionsForRoles(roles);
  }

  const rules
    = (session.user as { routeAccess?: Array<{ path_prefix: string, permission_key: string, ordering: number }> }).routeAccess
      || (await rbac.getRouteAccessRules());

  const allowed = rbac.canAccessPath(event.path, roles, permissions, rules);
  if (!allowed) {
    throw createError({
      statusCode: 403,
      message: "Unauthorized"
    });
  }

  return;
});
