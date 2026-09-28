import { randomUUID } from "node:crypto";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

export interface KiaiRuntimeConfig {
  kiai: {
    env: string
    simulation?: boolean
    grant_type: string
    api_url_pro: string
    api_url_dev: string
    client_id_pro: string
    client_id_dev: string
    secret_key_pro: string
    secret_key_dev: string
  }
}

export type KiaiProcessStatus
  = | "DRAFT"
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "DECLINED"
    | "EXPIRED"
    | "CANCELLED";

export interface KiaiSigner {
  firstName: string
  lastName: string
  email: string
  phoneIndicative?: string
  phoneNumber?: string
  identificationTypeCode?: string
  identificationNumber?: string
  signingOrder: number
}

export interface KiaiCreateProcessRequest {
  processName: string
  processDescription?: string
  signatureMethod: "CLICK" | "ADVANCED" | "HANDWRITTEN"
  authenticationMethodCode?: "OTP_EMAIL" | "OTP_SMS" | "OTP_WHATSAPP"
  isSequential?: boolean
  deadlineDays?: number
  isSendByEmail?: boolean
  messageEmail?: string
  externalReference?: string
  base64Document: string
  documentFileName?: string
  signers: KiaiSigner[]
  reminderEnabled?: boolean
  reminderIntervalDays?: number
}

export interface KiaiProcess {
  id: string
  processName: string
  status: KiaiProcessStatus
  expiresAt?: string | null
  createdAt?: string
  signersCount?: number
}

export interface KiaiProcessSigner {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  signingOrder: number
  signedAt?: string | null
  declinedAt?: string | null
  declineReason?: string | null
}

export interface KiaiProcessDetail extends KiaiProcess {
  completedAt?: string | null
  signers: KiaiProcessSigner[]
}

export interface KiaiMessageResponse {
  message: string
}

interface KiaiTokenResponse {
  access_token?: string
  expires_in?: number
}

interface KiaiFetchError {
  status?: number
  statusCode?: number
  response?: { status?: number }
  data?: { message?: string, error?: string, error_description?: string }
  message?: string
}

// Servicio de autenticación (GU), distinto del de firmas. La URL de producción no está confirmada por KIAI.
export const KIAI_AUTH_URL = {
  pro: "https://usuarios.kiai.co",
  dev: "https://usuarios-demo.kiai.co"
} as const;

// La vigencia del token no está confirmada por KIAI (15 min o 1 h); sin expires_in se asume la menor.
const DEFAULT_TOKEN_TTL_S = 15 * 60;
const TOKEN_MARGIN_MS = 60 * 1000;

const tokenCache = new Map<string, { token: string, expiresAt: number }>();

// fetch nativo: el worker de server/nohup corre con tsx fuera de Nitro y ofetch no es dependencia directa
const httpJson = async <T>(
  url: string,
  init: { method: string, headers?: Record<string, string>, body?: object }
): Promise<T> => {
  const response = await fetch(url, {
    method: init.method,
    headers: {
      "Accept": "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    },
    body: init.body ? JSON.stringify(init.body) : undefined
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = { message: text.slice(0, 500) };
  }

  if (!response.ok) {
    throw Object.assign(new Error(`HTTP ${response.status} ${response.statusText}`), {
      status: response.status,
      data
    });
  }
  return data as T;
};

const errorStatus = (e: unknown): number => {
  const err = e as KiaiFetchError;
  return Number(err?.status || err?.statusCode || err?.response?.status || 0);
};

const toKiaiError = (e: unknown, operacion: string): Error => {
  const err = e as KiaiFetchError;
  const status = errorStatus(e);
  const detalle = err?.data?.message || err?.data?.error_description || err?.data?.error || err?.message || "Error desconocido";
  const error = new Error(`KIAI ${operacion}: ${detalle}`) as Error & { statusCode?: number };
  error.statusCode = status || 502;
  return error;
};

const mockProcess = (status: KiaiProcessStatus, id: string, body?: KiaiCreateProcessRequest): KiaiProcessDetail => {
  const now = new Date();
  const expires = new Date(now.getTime() + (body?.deadlineDays ?? 7) * 86400000);
  return {
    id,
    processName: body?.processName || "Proceso simulado",
    status,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
    completedAt: null,
    signersCount: body?.signers.length ?? 0,
    signers: (body?.signers ?? []).map((s) => ({
      id: randomUUID(),
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      status: "PENDING",
      signingOrder: s.signingOrder
    }))
  };
};

const apiKiai = (config: KiaiRuntimeConfig, opts?: { accessToken?: string }) => {
  const kiai = config.kiai;
  const isPro = kiai.env === "pro";
  const simulation = kiai.simulation ?? kiai.env === "dev";
  const authUrl = isPro ? KIAI_AUTH_URL.pro : KIAI_AUTH_URL.dev;
  const apiUrl = isPro ? kiai.api_url_pro : kiai.api_url_dev;
  const clientId = isPro ? kiai.client_id_pro : kiai.client_id_dev;
  const clientSecret = isPro ? kiai.secret_key_pro : kiai.secret_key_dev;
  const cacheKey = `${authUrl}|${clientId}`;

  if (opts?.accessToken && !tokenCache.has(cacheKey)) {
    tokenCache.set(cacheKey, { token: opts.accessToken, expiresAt: Date.now() + DEFAULT_TOKEN_TTL_S * 1000 });
  }

  const getToken = async (force = false): Promise<string> => {
    if (simulation) return "MOCK-TOKEN";

    const cached = tokenCache.get(cacheKey);
    if (!force && cached && cached.expiresAt - TOKEN_MARGIN_MS > Date.now()) {
      return cached.token;
    }

    if (kiai.grant_type !== "client_credentials") {
      throw new Error(`KIAI: grant_type "${kiai.grant_type}" no soportado; use client_credentials`);
    }
    if (!clientId || !clientSecret) {
      throw new Error(`KIAI: faltan credenciales para el entorno ${kiai.env}`);
    }

    try {
      const data = await httpJson<KiaiTokenResponse>(`${authUrl}/api/oauth/token`, {
        method: "POST",
        body: {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret
        }
      });

      if (!data?.access_token) {
        throw new Error("respuesta sin access_token");
      }

      const ttl = Number(data.expires_in) > 0 ? Number(data.expires_in) : DEFAULT_TOKEN_TTL_S;
      tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + ttl * 1000 });
      return data.access_token;
    } catch (e: unknown) {
      tokenCache.delete(cacheKey);
      throw toKiaiError(e, "token");
    }
  };

  const request = async <T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    operacion: string,
    body?: object
  ): Promise<T> => {
    if (!apiUrl) {
      throw new Error(`KIAI: falta la URL del servicio de firmas para el entorno ${kiai.env}`);
    }

    const send = async (token: string) =>
      httpJson<T>(`${apiUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body
      });

    try {
      return await send(await getToken());
    } catch (e: unknown) {
      if (errorStatus(e) === 401) {
        try {
          return await send(await getToken(true));
        } catch (retryError: unknown) {
          throw toKiaiError(retryError, operacion);
        }
      }
      throw toKiaiError(e, operacion);
    }
  };

  const crearProceso = async (body: KiaiCreateProcessRequest): Promise<KiaiProcess> => {
    if (simulation) {
      const proceso = mockProcess(body.isSendByEmail ? "IN_PROGRESS" : "DRAFT", `MOCK-${randomUUID()}`, body);
      Log.info("KIAI MOCK: crear proceso", {
        id: proceso.id,
        externalReference: body.externalReference,
        signers: body.signers.map((s) => ({ email: s.email, signingOrder: s.signingOrder }))
      });
      return proceso;
    }
    return request<KiaiProcess>("POST", "/api/SignatureProcess/create", "crear proceso", body);
  };

  const consultarProceso = async (id: string): Promise<KiaiProcessDetail> => {
    if (simulation) {
      Log.info("KIAI MOCK: consultar proceso", { id });
      return mockProcess("IN_PROGRESS", id);
    }
    return request<KiaiProcessDetail>("GET", `/api/SignatureProcess/${encodeURIComponent(id)}`, "consultar proceso");
  };

  const cancelarProceso = async (id: string): Promise<KiaiMessageResponse> => {
    if (simulation) {
      Log.info("KIAI MOCK: cancelar proceso", { id });
      return { message: "Proceso cancelado correctamente. [MOCK]" };
    }
    return request<KiaiMessageResponse>("POST", `/api/SignatureProcess/${encodeURIComponent(id)}/cancel`, "cancelar proceso");
  };

  return {
    simulation,
    getToken,
    crearProceso,
    consultarProceso,
    cancelarProceso
  };
};

export default apiKiai;
