import type { H3Event } from "h3";
import { createError } from "h3";

export const requireAdministrator = (event: H3Event) => {
  const user = event.context.user as { roles?: unknown } | undefined;
  const roles = user?.roles;

  if (!Array.isArray(roles) || !roles.includes("administrator")) {
    throw createError({
      statusCode: 403,
      statusMessage: "No autorizado",
      message: "Solo usuarios administradores pueden acceder a reportes"
    });
  }
};
