import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import codeudorService from "~~/server/services/codeudor.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);
    if (!session?.user?.id) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const roles = (session.user as { roles?: string[] }).roles || [];
    const puedeVer = roles.some(role =>
      ["user_codeudor", "user_trabajador", "administrator"].includes(role)
    );
    if (!puedeVer) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "No tiene permiso para consultar responsabilidades contractuales",
        "Acceso denegado"
      );
    }

    const userSrv = (await import("~~/server/services/user.service")).default();
    const dbUser = await userSrv.findById(Number(session.user.id));
    const numeroDocumento
      = dbUser?.numero_documento
      || (session.user as { numero_documento?: string | null }).numero_documento;

    const service = codeudorService();
    const data = await service.listarResponsabilidades(numeroDocumento);

    return CustomResponse.success(data, "Responsabilidades obtenidas.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      err?.message || "Error al obtener responsabilidades",
      "Error al obtener responsabilidades."
    );
  }
});
