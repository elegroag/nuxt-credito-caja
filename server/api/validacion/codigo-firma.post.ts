import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import userService from "~~/server/services/user.service";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";

const ValidarCodigoSchema = z.object({
  codigo: z.string().length(6)
});

interface FirmaDigitalKeysCreate {
  keypublic?: string;
  keyprivate?: string;
  passowrd?: string;
  certificado?: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parseResult = ValidarCodigoSchema.safeParse(body);

    if (!parseResult.success) {
      return {
        success: false,
        message: "Código inválido o faltante"
      };
    }

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

    const { codigo: password } = parseResult.data;

    const datosApi = datosApiSisuwebService();
    const data = (await datosApi.createFirmaDigital({
      documento: prismaUser.numero_documento,
      coddoc: prismaUser.tipo_documento,
      password
    })) as FirmaDigitalKeysCreate;

    return CustomResponse.success(
      {
        certificado: data?.certificado || null,
        keypublic: data?.keypublic || null,
        keyprivate: data?.keyprivate || null,
        passowrd: data?.passowrd || null
      },
      "Datos obtenidos exitosamente."
    );
  } catch (e) {
    console.error("[validacion/codigo-firma]", e);
    return {
      success: false,
      message: "Error al procesar la solicitud"
    };
  }
});
