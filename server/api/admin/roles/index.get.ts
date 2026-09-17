import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import rbacService from "~~/server/services/rbac.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);
    if (!session?.user?.id) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const roles = (session.user as { roles?: string[] }).roles || [];
    if (
      !roles.includes("administrator")
      && !(session.user as { permissions?: string[] }).permissions?.includes("system.admin")
      && !(session.user as { permissions?: string[] }).permissions?.includes("roles.manage")
    ) {
      // Permitir lectura de roles sistema a admin users UI; fallback: cualquier autenticado admin-only check soft
      const perms
        = (session.user as { permissions?: string[] }).permissions
          || (await rbacService().getPermissionsForRoles(roles));
      if (!perms.includes("users.view") && !perms.includes("system.admin") && !roles.includes("administrator")) {
        setResponseStatus(event, 403);
        return CustomResponse.error("Sin permiso", "Acceso denegado");
      }
    }

    const data = await rbacService().listSystemRoles();
    const serialized = data.map((r) => ({
      id: Number(r.id),
      nombre: r.nombre,
      etiqueta: r.etiqueta,
      descripcion: r.descripcion,
      color: r.color,
      orden: r.orden
    }));

    return CustomResponse.success(serialized, "Roles de sistema obtenidos.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      err?.message || "Error al listar roles",
      "Error al listar roles."
    );
  }
});
