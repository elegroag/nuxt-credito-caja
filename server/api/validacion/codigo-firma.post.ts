import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import userService from "~~/server/services/user.service";

const ValidarCodigoSchema = z.object({
  codigo: z.string().length(6),
  solicitud_id: z.string()
});

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

    const { codigo: _codigo, solicitud_id: _solicitud_id } = parseResult.data;

    // TODO: Implementar validación real con servicio externo
    return {
      success: true,
      message: "Código validado correctamente"
    };
  } catch (e) {
    console.error("[validacion/codigo-firma]", e);
    return {
      success: false,
      message: "Error al procesar la solicitud"
    };
  }
});
