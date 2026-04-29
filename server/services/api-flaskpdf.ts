import { useRuntimeConfig } from "#imports";
import { ofetch } from "ofetch";

const apiFlaskPdf = () => {
  const config = useRuntimeConfig();
  const basic_user = config.apiFLASKPDF?.basic_user;
  const basic_password = config.apiFLASKPDF?.basic_password;
  const baseUrl = config.apiFLASKPDF?.url;

  const authHeader = (basicToken: string) => {
    return {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  };

  const getBasicToken = async (): Promise<string | { error: string }> => {
    try {
      if (!basic_user || !basic_password) {
        throw createError({
          statusCode: 401,
          message: "Basic user or password not configured",
        });
      }
      return Buffer.from(`${basic_user}:${basic_password}`).toString("base64");
    } catch (e: any) {
      const status = Number(e?.statusCode || e?.response?.status || 502);
      if (e?.data && typeof e.data === "object") {
        return e.data;
      }

      return {
        error:
          e?.data?.error || e?.message || "Error conectando con FLASKPDF API",
      };
    }
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
    const token = await getBasicToken();

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

    const response = await ofetch<T>(`${baseUrl}/${path}`, {
      method: "POST",
      headers,
      body,
    });

    return response;
  };

  const generatePdf = async <T>(data: any): Promise<T> => {
    return await postJson<T>("creditos/generate-pdf", data, { auth: true });
  };

  return {
    getBasicToken,
    postJson,
    generatePdf,
  };
};

export default apiFlaskPdf;
