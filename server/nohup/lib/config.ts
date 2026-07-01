import "dotenv/config";
import type { ApiFirmaRuntimeConfig } from "~~/server/services/api-firmaplus";

export function loadStandaloneFirmaConfig(): ApiFirmaRuntimeConfig {
  return {
    apiFIRMA: {
      env: process.env.API_FIRMA_ENV || "dev",
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
