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

    const id = Number(getRouterParam(event, "id"));
    if (!Number.isFinite(id)) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID inválido", "Solicitud inválida");
    }

    const service = codeudorService();
    const data = await service.reenviarCodigo(id, {
      id: Number(session.user.id),
      roles: (session.user as { roles?: string[] }).roles || [],
      full_name: session.user.full_name,
      username: session.user.username
    });

    return CustomResponse.success(data, "Código reenviado al correo del codeudor.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      err?.message || "Error al reenviar código",
      "Error al reenviar código."
    );
  }
});
