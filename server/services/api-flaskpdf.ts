import { useRuntimeConfig } from "#imports";
import { ofetch } from "ofetch";

interface FetchError {
  statusCode?: number
  data?: { error: string }
  message?: string
  response?: { status?: number }
}

const apiFlaskPdf = () => {
  const config = useRuntimeConfig();
  const env = config.apiFLASKPDF.env;
  const basic_user = config.apiFLASKPDF.basic_user;
  const basic_password = config.apiFLASKPDF.basic_password;
  const baseUrl = {
    pro: config.apiFLASKPDF.url_pro,
    dev: config.apiFLASKPDF.url_dev
  };

  const authHeader = (basicToken: string) => {
    return {
      "Authorization": `Basic ${basicToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  };

  const getBasicToken = async (): Promise<string | { error: string }> => {
    try {
      if (!basic_user || !basic_password) {
        throw createError({
          statusCode: 401,
          message: "Basic user or password not configured"
        });
      }
      return Buffer.from(`${basic_user}:${basic_password}`).toString("base64");
    } catch (e: unknown) {
      const err = e as FetchError;
      if (err?.data && typeof err.data === "object") {
        return err.data;
      }

      return {
        error:
          err?.data?.error || err?.message || "Error conectando con FLASKPDF API"
      };
    }
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
    const token = await getBasicToken();

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

  const generatePdf = async <T>(data: Record<string, unknown>): Promise<T> => {
    return await postJson<T>("creditos/generate-pdf", data, { auth: true });
  };

  return {
    getBasicToken,
    postJson,
    generatePdf
  };
};

export default apiFlaskPdf;
