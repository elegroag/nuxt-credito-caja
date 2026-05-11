import type { H3Event } from "h3";
import { defineEventHandler } from "h3";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  await clearUserSession(event);
  return CustomResponse.ok(null, "Sesión cerrada correctamente");
});
