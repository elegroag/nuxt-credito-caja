import type { H3Event } from "h3";
import rbacService from "~~/server/services/rbac.service";

export type RbacManagePermission =
  | "roles.manage"
  | "permissions.manage"
  | "modules.manage"
  | "system.admin";

/** Exige sesión + uno de los permisos RBAC (o administrator / system.admin). */
export async function requireRbacManage(
  event: H3Event,
  required: RbacManagePermission | RbacManagePermission[]
) {
  const session = await requireUserSession(event);
  const roles = session.user.roles || [];
  const rbac = rbacService();
  const permissions = await rbac.getPermissionsForRoles(roles);
  const needed = Array.isArray(required) ? required : [required];

  const allowed
    = roles.includes("administrator")
      || permissions.includes("system.admin")
      || needed.some(p => permissions.includes(p));

  if (!allowed) {
    throw createError({ statusCode: 403, message: "Sin permiso para gestionar RBAC" });
  }

  return { session, roles, permissions };
}
