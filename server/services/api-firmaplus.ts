import { useRuntimeConfig } from "#imports";
import { createError } from "h3";
import { ofetch } from "ofetch";
import { loggerService } from "~~/server/utils/logger.service";

export interface ApiFirmaRuntimeConfig {
  apiFIRMA: {
    env: string
    url_pro: string
    url_dev: string
    type_auth: string
    basic_user: string
    basic_password: string
    client_id: string | null
    password: string | null
  }
}

const Log = loggerService();

interface TokenResponse {
  success?: boolean
  token?: string
  error?: string
}

interface FetchError {
  statusCode?: number
  data?: TokenResponse | { error: string }
  message?: string
  response?: { status?: number }
}

interface FirmaPlusSignerResponse {
  Code: string
  Data?: {
    NroSolicitud?: string
    Fecha?: string
    Link?: string
  }
  Message?: string
}

const getMockResponse = (path: string, body?: Record<string, unknown>): FirmaPlusSignerResponse => {
  const timestamp = Date.now();
  const now = new Date();
  const fechaFormateada = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  if (path === "signer") {
    const firmantes = body?.Firmantes as Array<{ Identificacion?: string; Nombre?: string }> | undefined;
    Log.info("FirmaPlus MOCK (dev): signer", {
      nota: body?.Nota,
      firmantesCount: firmantes?.length ?? 0,
      firmantes: firmantes?.map((f) => ({ identificacion: f.Identificacion, nombre: f.Nombre })) ?? []
    });
    return {
      Code: "1",
      Data: {
        NroSolicitud: `MOCK-${timestamp}`,
        Fecha: fechaFormateada,
        Link: `http://localhost/FirmaPlus/mock-${timestamp}`
      },
      Message: "Documentos y registros guardados. [MOCK]"
    };
  }

  if (path.startsWith("consultarsolicitud")) {
    const solicitudId = path.split("/").pop();
    Log.info("FirmaPlus MOCK (dev): consultarsolicitud", { solicitudId });
    return {
      Code: "1",
      Data: {
        NroSolicitud: solicitudId || `MOCK-${timestamp}`,
        Fecha: fechaFormateada,
        Link: `http://localhost/FirmaPlus/mock-${timestamp}`
      },
      Message: "Solicitud consultada exitosamente. [MOCK]"
    };
  }

  if (path === "cancelarsolicitud") {
    Log.info("FirmaPlus MOCK (dev): cancelarsolicitud", { body });
    return {
      Code: "1",
      Message: "Solicitud cancelada exitosamente. [MOCK]"
    };
  }

  Log.warn("FirmaPlus MOCK (dev): endpoint no reconhecido", { path });
  return {
    Code: "0",
    Message: "Endpoint no reconocido. [MOCK]"
  };
};

const apiFirmaPlus = (configOverride?: ApiFirmaRuntimeConfig) => {
  const config = configOverride ?? useRuntimeConfig();
  const env = config.apiFIRMA.env;
  const baseUrl = {
    pro: config.apiFIRMA.url_pro,
    dev: config.apiFIRMA.url_dev
  };
  const type_auth = config.apiFIRMA.type_auth;
  const basic_user = config.apiFIRMA.basic_user;
  const basic_password = config.apiFIRMA.basic_password;

  const client_id = config.apiFIRMA.client_id || null;
  const password = config.apiFIRMA.password || null;

  const authHeader = (accessToken: string) => {
    return {
      "Authorization": `${type_auth} ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  };

  const getToken = async (): Promise<string | { error: string }> => {
    try {
      if (type_auth === "Basic") {
        if (!basic_user || !basic_password) {
          throw createError({
            statusCode: 401,
            message: "Basic user or password not configured"
          });
        }
        return Buffer.from(`${basic_user}:${basic_password}`).toString(
          "base64"
        );
      }

      const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
      const dataToken = await ofetch(`${url}/token`, {
        method: "POST",
        body: {
          client_id: client_id,
          password: password
        }
      });

      if (dataToken.success && dataToken.token) {
        return dataToken.token;
      }
      return { error: dataToken.error || "Error al obtener token" };
    } catch (e: unknown) {
      const err = e as FetchError;
      const _status = Number(err?.statusCode || err?.response?.status || 502);
      if (err?.data && typeof err.data === "object") {
        if ('error' in err.data && typeof err.data.error === 'string') {
          return { error: err.data.error };
        }
        return { error: "Error desconhecido" };
      }

      return {
        error:
          err?.data?.error || err?.message || "Error conectando con SISUWEB API"
      };
    }
  };

  const getJson = async <T>(
    path: string,
    opts?: {
      auth?: boolean
      headers?: Record<string, string>
    }
  ) => {
    if (env === "dev") {
      return getMockResponse(path) as T;
    }

    const headers: Record<string, string> = {
      ...(opts?.headers || {})
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "GET",
      headers
    });
    return response;
  };

  const postJson = async <T>(
    path: string,
    body: Record<string, unknown>,
    opts?: {
      auth?: boolean
      headers?: Record<string, string>
    }
  ) => {
    if (env === "dev") {
      return getMockResponse(path, body) as T;
    }

    const headers: Record<string, string> = {
      ...(opts?.headers || {})
    };

    if (opts?.auth) {
      const token = await getToken();

      if (typeof token !== "string") {
        throw createError({
          statusCode: 401,
          message: "Bad token no valid",
          data: token
        });
      }

      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "POST",
      headers,
      body
    });

    return response;
  };

  const putJson = async <T>(
    path: string,
    body: Record<string, unknown>,
    opts?: {
      auth?: boolean
      headers?: Record<string, string>
    }
  ) => {
    if (env === "dev") {
      return getMockResponse(path, body) as T;
    }

    const headers: Record<string, string> = {
      ...(opts?.headers || {})
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "PUT",
      headers,
      body
    });

    return response;
  };

  const deleteJson = async <T>(
    path: string,
    opts?: {
      auth?: boolean
      headers?: Record<string, string>
    }
  ) => {
    const headers: Record<string, string> = {
      ...(opts?.headers || {})
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "DELETE",
      headers
    });

    return response;
  };

  const getEndpoints = () => {
    return [
      { method: "POST", endpoint: "signer" },
      { method: "POST", endpoint: "generarsolicitud" },
      { method: "POST", endpoint: "certificar" },
      { method: "GET", endpoint: "consultarsolicitud/{id}" },
      { method: "PUT", endpoint: "cancelarsolicitud" }
    ];
  };

  return {
    getToken,
    getJson,
    postJson,
    putJson,
    deleteJson,
    getEndpoints
  };
};

export default apiFirmaPlus;
