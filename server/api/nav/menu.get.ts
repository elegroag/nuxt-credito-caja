import type { H3Event } from "h3";
import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import rbacService from "~~/server/services/rbac.service";
import userService from "~~/server/services/user.service";
import jwtManager from "~~/shared/utils/jwt";
import { CustomResponse } from "~~/server/utils/customResponse";

/**
 * Menú filtrado por el usuario del JWT Bearer (fuente de verdad del cliente).
 * Fallback a cookie Nitro si no hay token.
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const jwt = jwtManager();
    const token = jwt.extractBearerToken(getHeader(event, "Authorization"));

    let roles: string[] = [];

    if (token) {
      const payload = await jwt.verifyJwt(token);
      const user = await userService().findById(Number(payload.sub));
      if (!user) {
        setResponseStatus(event, 401);
        return CustomResponse.error("Usuario no encontrado", "Error de autenticación");
      }
      roles = (user.roles as string[]) || [];
    } else {
      const session = await getUserSession(event).catch(() => null);
      if (!session?.user?.id) {
        setResponseStatus(event, 401);
        return CustomResponse.error("No hay sesión activa", "Error de autenticación");
      }
      roles = (session.user as { roles?: string[] }).roles || [];
    }

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
