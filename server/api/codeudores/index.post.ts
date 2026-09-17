import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import codeudorService from "~~/server/services/codeudor.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);
    if (!session?.user?.id) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const service = codeudorService();
    const payload = await readValidatedBody(event, service.validateCreate);
    const data = await service.crearVinculo(
      {
        id: Number(session.user.id),
        roles: (session.user as { roles?: string[] }).roles || [],
        full_name: session.user.full_name,
        username: session.user.username
      },
      payload
    );

    return CustomResponse.success(
      data,
      "Codeudor registrado. Se envió un código a su correo para autorización."
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(
      err?.message || "Error al registrar codeudor",
      "Error al registrar codeudor."
    );
  }
});
