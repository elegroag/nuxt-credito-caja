import "dotenv/config";
import type { ApiFirmaRuntimeConfig } from "~~/server/services/api-firmaplus";

export function loadStandaloneFirmaConfig(): ApiFirmaRuntimeConfig {
  const env = process.env.API_FIRMA_ENV || "dev";
  const simulation = process.env.API_FIRMA_SIMULATION;

  return {
    apiFIRMA: {
      env,
      // Sin API_FIRMA_SIMULATION se simula solo en entorno dev
      simulation: simulation ? simulation === "true" : env === "dev",
      url_pro: process.env.API_FIRMA_URL_PRO || "",
      url_dev: process.env.API_FIRMA_URL_DEV || "",
      type_auth: process.env.API_FIRMA_TYPE_AUTH || "Bearer",
      basic_user: process.env.API_FIRMA_BASIC_USER || "",
      basic_password: process.env.API_FIRMA_BASIC_PASSWORD || "",
      client_id: process.env.API_FIRMA_CLIENT_ID || null,
      password: process.env.API_FIRMA_PASSWORD || null
    }
  };
}
