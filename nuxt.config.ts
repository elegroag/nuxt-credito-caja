// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3000, // Puerto deseado
    host: process.env.NUXT_HOST || "localhost",
  },
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "nuxt-auth-utils",
  ],
  alias: {
    "@": fileURLToPath(new URL("./app", import.meta.url)),
    "~": fileURLToPath(new URL("./app", import.meta.url)),
    ".prisma/client/index-browser":
      "./node_modules/.prisma/client/index-browser.js",
  },

  devtools: {
    enabled: true,
  },

  css: ["@/assets/css/main.css"],

  // @ts-ignore
  ui: {
    theme: {
      colors: ["primary", "secondary", "accent", "destructive", "muted"],
    },
  },

  app: {
    head: {
      title: "Comfaca Creditos En Línea",
      meta: [
        {
          name: "description",
          content: "Solicita tu crédito online de manera rápida y segura.",
        },
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Sistema de créditos en línea Caja de Compensación Familiar del Caquetá",
        },
      ],
    },
  },

  routeRules: {
    "/": { prerender: true },
    "/dash/**": { isr: false },
  },

  compatibilityDate: "2025-01-15",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  vite: {
    resolve: {
      alias: {
        ".prisma/client/index-browser":
          "./node_modules/.prisma/client/index-browser.js",
        "@": fileURLToPath(new URL("./app", import.meta.url)),
        "~": fileURLToPath(new URL("./app", import.meta.url)),
      },
    },
    optimizeDeps: {
      include: [
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "lucide-vue-next",
        "@heroicons/vue/24/outline",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "radix-vue",
        "zod",
      ],
    },
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
  },

  experimental: {
    serverAppConfig: false,
  },

  nitro: {
    prerender: {
      routes: ["/"],
      ignore: ["/dashboard", "/dashboard/**"],
      // Habilitar el crawling para descubrir enlaces automáticamente
      crawlLinks: true,
    },
  },

  runtimeConfig: {
    database: {
      env: env.DATABASE_ENV || "dev",
      url_pro: env.DATABASE_URL_PRO || "",
      url_dev: env.DATABASE_URL_DEV || "",
    },
    storage: {
      documentsPath: resolve(
        __dirname,
        env.STORAGE_DOCUMENTS_PATH || "storage/",
      ),
      logs: resolve(__dirname, env.STORAGE_LOGS_PATH || "storage/"),
      uploads: resolve(__dirname, env.STORAGE_UPLOADS_PATH || "storage/"),
    },
    apiSISU: {
      env: env.API_SISU_ENV || "dev",
      url_pro: env.API_SISU_URL_PRO || "http://127.0.0.1:5000",
      url_dev: env.API_SISU_URL_DEV || "http://127.0.0.1:5001",
      client_id: env.API_SISU_CLIENT_ID || "",
      password: env.API_SISU_PASSWORD || "",
      type_auth: env.API_SISU_TYPE_AUTH || "Bearer",
      basic_user: env.API_SISU_BASIC_USER || "",
      basic_password: env.API_SISU_BASIC_PASSWORD || "",
    },
    apiFIRMA: {
      env: env.API_FIRMA_ENV || "dev",
      url_pro: env.API_FIRMA_URL_PRO || "",
      url_dev: env.API_FIRMA_URL_DEV || "",
      type_auth: env.API_FIRMA_TYPE_AUTH || "Bearer",
      basic_user: env.API_FIRMA_BASIC_USER || "",
      basic_password: env.API_FIRMA_BASIC_PASSWORD || "",
      client_id: env.API_FIRMA_CLIENT_ID || "",
      password: env.API_FIRMA_PASSWORD || "",
    },
    apiFLASKPDF: {
      env: env.API_FLASKPDF_ENV || "dev",
      basic_user: env.API_FLASKPDF_USER || "",
      basic_password: env.API_FLASKPDF_PASSWORD || "",
      url_pro: env.API_FLASKPDF_URL_PRO || "",
      url_dev: env.API_FLASKPDF_URL_DEV || "",
    },
    backendBaseUrl:
      env.NUXT_BACKEND_BASE_URL + ":" + env.NUXT_BACKEND_BASE_PORT,
    jwtSecret: env.NUXT_JWT_SECRET || "",
  },
  auth: {
    session: {
      maxAge: 60 * 60 * 8, // 8 horas
    },
  },
});
