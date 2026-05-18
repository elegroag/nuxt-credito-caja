import { defineEventHandler } from "h3";
import configurationsService from "~~/server/services/configurations.service";

export default defineEventHandler(async (_event) => {
  let isOnline = true;

  try {
    const statusOnline = await configurationsService().getConfigurationByKey("status_online");
    isOnline = statusOnline !== "false";
  } catch (error) {
    console.warn("[health] No se pudo obtener status_online de configuraciones:", error);
  }

  return {
    status: isOnline ? "ok" : "maintenance",
    timestamp: new Date().toISOString(),
    app: "Sistema de Creditos Comfaca",
    isOnline,
    version: "1.0.0"
  };
});