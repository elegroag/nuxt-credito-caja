import { computed, useRuntimeConfig, useSession } from "#imports";
import { $fetch } from "ofetch";

export interface ApiRequestOptions {
  auth?: boolean
  headers?: Record<string, string>
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const { authHeader } = useSession();

  const baseUrl = computed(() => {
    // Usar directamente el backendBaseUrl del runtimeConfig
    const raw = String(config.public.backendBaseUrl || "");
    return raw.replace(/\/+$/, "");
  });

  const urlFor = (path: string) => {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl.value}${p}`;
  };

  const postJson = async <T>(
    path: string,
    body: unknown,
    opts?: ApiRequestOptions
  ) => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(opts?.headers || {})
    };

    if (opts?.auth) {
      Object.assign(headers, authHeader.value as unknown as Record<string, string>);
    }

    return await $fetch<T>(urlFor(path), {
      method: "POST",
      body: body as BodyInit,
      headers
    });
  };

  // Agregar métodos GET, PUT, DELETE para completar la API
  const getJson = async <T>(
    path: string,
    opts?: ApiRequestOptions
  ) => {
    const headers: Record<string, string> = {
      ...(opts?.headers || {})
    };

    if (opts?.auth) {
      Object.assign(headers, authHeader.value as unknown as Record<string, string>);
    }

    return await $fetch<T>(urlFor(path), {
      method: "GET",
      headers
    });
  };

  const putJson = async <T>(
    path: string,
    body: unknown,
    opts?: ApiRequestOptions
  ) => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(opts?.headers || {})
    };

    if (opts?.auth) {
      Object.assign(headers, authHeader.value as unknown as Record<string, string>);
    }

    return await $fetch<T>(urlFor(path), {
      method: "PUT",
      body: body as BodyInit,
      headers
    });
  };

  const deleteJson = async <T>(
    path: string,
    body: unknown,
    opts?: ApiRequestOptions
  ) => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(opts?.headers || {})
    };

    if (opts?.auth) {
      Object.assign(headers, authHeader.value as unknown as Record<string, string>);
    }

    return await $fetch<T>(urlFor(path), {
      method: "DELETE",
      body: body as BodyInit,
      headers
    });
  };

  return {
    baseUrl,
    getJson,
    postJson,
    putJson,
    deleteJson,
    urlFor
  };
};
