import "dotenv/config";
import type { KiaiRuntimeConfig } from "~~/server/services/api-kiai";

export function loadStandaloneKiaiConfig(): KiaiRuntimeConfig {
  const env = process.env.KIAI_ENV || "dev";
  const simulation = process.env.KIAI_SIMULATION;

  return {
    kiai: {
      env,
      // Sin KIAI_SIMULATION se simula solo en entorno dev
      simulation: simulation ? simulation === "true" : env === "dev",
      grant_type: process.env.KIAI_GRANT_TYPE || "client_credentials",
      api_url_pro: process.env.KIAI_API_URL_PRO || "",
      api_url_dev: process.env.KIAI_API_URL_DEV || "",
      client_id_pro: process.env.KIAI_CLIENT_ID_PRO || "",
      client_id_dev: process.env.KIAI_CLIENT_ID_DEV || "",
      secret_key_pro: process.env.KIAI_SECRET_KEY_PRO || "",
      secret_key_dev: process.env.KIAI_SECRET_KEY_DEV || ""
    }
  };
}
