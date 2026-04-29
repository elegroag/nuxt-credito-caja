import type { H3Event } from "h3";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  await clearUserSession(event);
  return {
    success: true,
    message: "Sesión cerrada correctamente",
  };
});
