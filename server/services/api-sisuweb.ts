import { useRuntimeConfig } from "#imports";
import { ofetch } from "ofetch";

const apiSisuweb = () => {
  const config = useRuntimeConfig();
  const env = config.apiSISU.env;
  const client_id = config.apiSISU.client_id;
  const password = config.apiSISU.password;
  const type_auth = config.apiSISU.type_auth;
  const basic_user = config.apiSISU.basic_user;
  const basic_password = config.apiSISU.basic_password;
  const baseUrl = {
    pro: config.apiSISU.url_pro,
    dev: config.apiSISU.url_dev,
  };

  const authHeader = (accessToken: string) => {
    return {
      Authorization: `${type_auth} ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  };

  const getToken = async (): Promise<string | { error: string }> => {
    try {
      if (type_auth === "Basic") {
        if (!basic_user || !basic_password) {
          throw createError({
            statusCode: 401,
            message: "Basic user or password not configured",
          });
        }
        return Buffer.from(`${basic_user}:${basic_password}`).toString(
          "base64",
        );
      }

      const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
      const dataToken = await ofetch(`${url}/token`, {
        method: "POST",
        body: {
          client_id: client_id,
          password: password,
        },
      });

      if (dataToken.success) {
        return dataToken.token;
      }

      return dataToken;
    } catch (e: any) {
      const status = Number(e?.statusCode || e?.response?.status || 502);
      if (e?.data && typeof e.data === "object") {
        return e.data;
      }

      return {
        error:
          e?.data?.error || e?.message || "Error conectando con SISUWEB API",
      };
    }
  };

  const getJson = async <T>(
    path: string,
    opts?: {
      auth?: boolean;
      headers?: Record<string, string>;
    },
  ) => {
    const headers: Record<string, string> = {
      ...(opts?.headers || {}),
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token,
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "GET",
      headers,
    });
    return response;
  };

  const postJson = async <T>(
    path: string,
    body: any,
    opts?: {
      auth?: boolean;
      headers?: Record<string, string>;
    },
  ) => {
    const headers: Record<string, string> = {
      ...(opts?.headers || {}),
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token,
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "POST",
      headers,
      body,
    });

    return response;
  };

  const putJson = async <T>(
    path: string,
    body: any,
    opts?: {
      auth?: boolean;
      headers?: Record<string, string>;
    },
  ) => {
    const headers: Record<string, string> = {
      ...(opts?.headers || {}),
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token,
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "PUT",
      headers,
      body,
    });

    return response;
  };

  const deleteJson = async <T>(
    path: string,
    opts?: {
      auth?: boolean;
      headers?: Record<string, string>;
    },
  ) => {
    const headers: Record<string, string> = {
      ...(opts?.headers || {}),
    };
    const token = await getToken();

    if (typeof token !== "string") {
      throw createError({
        statusCode: 401,
        message: "Bad token no valid",
        data: token,
      });
    }

    if (opts?.auth) {
      Object.assign(headers, authHeader(token as string));
    }

    const url = env === "pro" ? baseUrl.pro : baseUrl.dev;
    const response = await ofetch<T>(`${url}/${path}`, {
      method: "DELETE",
      headers,
    });

    return response;
  };

  return {
    getToken,
    getJson,
    postJson,
    putJson,
    deleteJson,
  };
};

export default apiSisuweb;
