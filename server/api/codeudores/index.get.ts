import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import codeudorService from "~~/server/services/codeudor.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);
    if (!session?.user?.id) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const query = getQuery(event);
    const titularUserId = query.titular_user_id
      ? Number(query.titular_user_id)
      : undefined;

    const service = codeudorService();
    const data = await service.listarPorTitular(
      {
        id: Number(session.user.id),
        roles: (session.user as { roles?: string[] }).roles || []
      },
      Number.isFinite(titularUserId) ? titularUserId : undefined
    );

    return CustomResponse.success(data, "Codeudores obtenidos.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      err?.message || "Error al listar codeudores",
      "Error al listar codeudores."
    );
  }
});
