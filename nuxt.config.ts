// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "nuxt-auth-utils",
    "@nuxt/test-utils/module",
    "@vee-validate/nuxt"
  ],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      title: "Comfaca Creditos En Línea",
      meta: [
        {
          name: "description",
          content: "Solicita tu crédito online de manera rápida y segura."
        },
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Sistema de créditos en línea Caja de Compensación Familiar del Caquetá"
        }
      ]
    }
  },

  css: ["@/assets/css/main.css"],

  ui: {
    theme: {
      colors: ["primary", "secondary", "accent", "destructive", "muted"]
    }
  },

  runtimeConfig: {
    public: {
      environment: env.NODE_ENV || "development"
    },
    database: {
      env: env.DATABASE_ENV || "dev",
      url_pro: env.DATABASE_URL_PRO || "",
      url_dev: env.DATABASE_URL_DEV || ""
    },
    storage: {
      documentsPath: resolve(__dirname, env.STORAGE_DOCUMENTS_PATH || "storage/"),
      logs: resolve(__dirname, env.STORAGE_LOGS_PATH || "storage/"),
      uploads: resolve(__dirname, env.STORAGE_UPLOADS_PATH || "storage/")
    },
    apiSISU: {
      env: env.API_SISU_ENV || "dev",
      url_pro: env.API_SISU_URL_PRO || "http://127.0.0.1:5000",
      url_dev: env.API_SISU_URL_DEV || "http://127.0.0.1:5001",
      client_id: env.API_SISU_CLIENT_ID || "",
      password: env.API_SISU_PASSWORD || "",
      type_auth: env.API_SISU_TYPE_AUTH || "Bearer",
      basic_user: env.API_SISU_BASIC_USER || "",
      basic_password: env.API_SISU_BASIC_PASSWORD || ""
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
      apy_key: env.API_FIRMA_KEY || ""
    },
    apiFLASKPDF: {
      env: env.API_FLASKPDF_ENV || "dev",
      basic_user: env.API_FLASKPDF_USER || "",
      basic_password: env.API_FLASKPDF_PASSWORD || "",
      url_pro: env.API_FLASKPDF_URL_PRO || "",
      url_dev: env.API_FLASKPDF_URL_DEV || ""
    },
    mail: {
      env: env.MAIL_ENV || "dev",
      // Gmail: smtp.gmail.com:465 (SSL) o :587 (STARTTLS). Por defecto :465.
      host: env.MAIL_HOST || "smtp.gmail.com",
      port: Number(env.MAIL_PORT) || 465,
      secure: env.MAIL_SECURE ? env.MAIL_SECURE === "true" : true,
      user: env.MAIL_USER || "",
      pass: env.MAIL_PASSWORD || "",
      from_name: env.MAIL_FROM_NAME || "Comfaca Créditos",
      from_address: env.MAIL_FROM_ADDRESS || env.MAIL_USER || "",
      // Desactivar verificación TLS solo para diagnóstico. NUNCA activar en pro.
      reject_unauthorized: env.MAIL_REJECT_UNAUTHORIZED
        ? env.MAIL_REJECT_UNAUTHORIZED === "true"
        : true
    },
    sftp: {
      env: env.SFTP_ENV || "dev",
      host: env.SFTP_HOST || "",
      port: Number(env.SFTP_PORT) || 22,
      username: env.SFTP_USER || "",
      password: env.SFTP_PASSWORD || "",
      // Si se quiere autenticación por clave privada, en lugar de password
      // poblar SFTP_PRIVATE_KEY_BASE64 (contenido codificado en base64).
      private_key_base64: env.SFTP_PRIVATE_KEY_BASE64 || "",
      passphrase: env.SFTP_PASSPHRASE || "",
      // Ruta base remota; los métodos del servicio reciben rutas relativas a esta.
      base_path: env.SFTP_BASE_PATH || "/",
      // Timeout en milisegundos para conectar y para operaciones.
      ready_timeout: Number(env.SFTP_READY_TIMEOUT_MS) || 20000
    },
    backendBaseUrl: env.NUXT_BACKEND_BASE_URL + ":" + env.NUXT_BACKEND_BASE_PORT,
    jwtSecret: env.NUXT_JWT_SECRET || ""
  },
  alias: {
    "@": fileURLToPath(new URL("./app", import.meta.url)),
    "~": fileURLToPath(new URL("./app", import.meta.url)),
    ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
    "@tests": fileURLToPath(new URL("./tests/", import.meta.url)),
    "~~": fileURLToPath(new URL("./", import.meta.url))
  },

  routeRules: {
    "/": { prerender: true },
    "/dash/**": { isr: false }
  },
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3000, // Puerto deseado
    host: process.env.NUXT_HOST || "localhost"
  },

  experimental: {
    serverAppConfig: false
  },

  compatibilityDate: "2025-01-15",

  nitro: {
    preset: "node-server",
    experimental: {
      asyncContext: true
    },
    prerender: {
      routes: ["/"],
      ignore: ["/dashboard", "/dashboard/**"],
      crawlLinks: true,
      failOnError: false
    }
  },

  vite: {
    resolve: {
      alias: {
        ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
        "@": fileURLToPath(new URL("./app", import.meta.url)),
        "~": fileURLToPath(new URL("./app", import.meta.url)),
        "~~": fileURLToPath(new URL("./", import.meta.url)),
        "@tests": fileURLToPath(new URL("./tests/", import.meta.url))
      }
    },
    optimizeDeps: {
      include: [
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "@lucide/vue",
        "@heroicons/vue/24/outline",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "radix-vue",
        "zod"
      ]
    },
    build: {
      sourcemap: env.NODE_ENV == "development",
      modulePreload: {
        polyfill: false
      }
    }
  },
  auth: {
    session: {
      maxAge: 60 * 60 * 8 // 8 horas
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs"
      }
    }
  },
  veeValidate: {
    // disable or enable auto imports
    autoImports: true,
    // Use different names for components
    componentNames: {
      Form: "VeeForm",
      Field: "VeeField",
      FieldArray: "VeeFieldArray",
      ErrorMessage: "VeeErrorMessage"
    }
  }
});
