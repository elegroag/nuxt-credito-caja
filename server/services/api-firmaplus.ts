import { useRuntimeConfig } from "#imports";
import { ofetch } from "ofetch";

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

const apiFirmaPlus = () => {
  const config = useRuntimeConfig();
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
