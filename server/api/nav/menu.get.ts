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

    // Preferir permisos frescos desde BD (sesión Nitro puede estar desactualizada)
    const roles = (session.user as { roles?: string[] }).roles || [];
    const rbac = rbacService();
    const permissions = await rbac.getPermissionsForRoles(roles);

    const menu = await rbac.getMenuForUser(roles, permissions);

    return CustomResponse.success(menu, "Menú obtenido.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      err?.message || "Error al obtener menú",
      "Error al obtener menú."
    );
  }
});
