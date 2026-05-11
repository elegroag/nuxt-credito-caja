import { defineEventHandler } from "h3";
import { CustomResponse } from "~~/server/utils/customResponse";

// Retorna los datos del usuario autenticado actual
export default defineEventHandler(async (event) => {
  // El middleware global ya verificó la sesión e injectó el usuario
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "No autenticado",
    });
  }
  return CustomResponse.success({ user }, "Usuario autenticado");
});
