import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import userService from "~~/server/services/user.service";
import { CustomResponse } from "~~/server/utils/customResponse";

interface FirmaDigitalKeys {
  keypublic: string;
  keyprivate: string;
  passowrd: string;
  tiene_firma: boolean;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);
    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }
    const userSrv = userService();

    const prismaUser = await userSrv.findByUsername(session?.user?.username);

    if (!prismaUser) {
      return { user: null, isValid: false };
    }

    const datosApi = datosApiSisuwebService();
    const data = (await datosApi.dataFirmaDigitalKeys({
      documento: prismaUser.numero_documento,
      coddoc: prismaUser.tipo_documento
    })) as FirmaDigitalKeys;

    const tieneFirma = data?.tiene_firma || false;

    return CustomResponse.success({ tieneFirma }, "Tipos de documento obtenidos exitosamente.");
  } catch (e: unknown) {
    const err = e as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener tipos de documento."
    );
  }
});
