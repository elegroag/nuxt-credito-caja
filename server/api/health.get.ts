import { defineEventHandler } from "h3";

// frontend/server/api/auth/perfil.get.ts
export default defineEventHandler(async (event) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "Sistema de Creditos Comfaca",
    version: "1.0.0",
  };
});
