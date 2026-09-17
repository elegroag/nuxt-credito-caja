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
    const perms = await rbacService().getPermissionsForRoles(roles);
    if (
      !roles.includes("administrator")
      && !perms.includes("system.admin")
      && !perms.includes("roles.manage")
      && !perms.includes("users.view")
    ) {
      setResponseStatus(event, 403);
      return CustomResponse.error("Sin permiso", "Acceso denegado");
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
