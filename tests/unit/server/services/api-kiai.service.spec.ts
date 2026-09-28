/**
 * api-kiai.service.spec.ts
 *
 * Tests del cliente KIAI. Mockeamos fetch global para validar URLs por entorno,
 * cache y renovación del token ante 401, y el modo simulación.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("~~/server/utils/logger.service", () => ({
  loggerService: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })
}));

// eslint-disable-next-line import/first
import apiKiai from "~~/server/services/api-kiai";
// eslint-disable-next-line import/first
import type { KiaiRuntimeConfig } from "~~/server/services/api-kiai";

const fetchMock = vi.fn();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const callUrl = (n: number) => String(fetchMock.mock.calls[n]![0]);
const callInit = (n: number) => fetchMock.mock.calls[n]![1] as RequestInit & { headers: Record<string, string> };
const callBody = (n: number) => JSON.parse(String(callInit(n).body));

let seq = 0;

const buildConfig = (overrides: Partial<KiaiRuntimeConfig["kiai"]> = {}): KiaiRuntimeConfig => ({
  kiai: {
    env: "dev",
    simulation: false,
    grant_type: "client_credentials",
    api_url_pro: "https://api.pro",
    api_url_dev: "https://api.dev",
    client_id_pro: "client-pro",
    // Un client id distinto por test evita compartir la cache de tokens entre casos
    client_id_dev: `client-dev-${++seq}`,
    secret_key_pro: "secret-pro",
    secret_key_dev: "secret-dev",
    ...overrides
  }
});

const signer = { firstName: "Ana", lastName: "Torres", email: "ana@test.co", signingOrder: 1 };
const createBody = {
  processName: "Solicitud",
  signatureMethod: "CLICK" as const,
  isSendByEmail: true,
  base64Document: "JVBERi0=",
  signers: [signer]
};

describe("apiKiai", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pide el token con client_credentials al servicio de autenticación del entorno", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1", expires_in: 900 }))
      .mockResolvedValueOnce(jsonResponse({ id: "p-1", status: "IN_PROGRESS" }, 201));

    const config = buildConfig();
    const result = await apiKiai(config).crearProceso(createBody);

    expect(result).toEqual({ id: "p-1", status: "IN_PROGRESS" });
    expect(callUrl(0)).toBe("https://usuarios-demo.kiai.co/api/oauth/token");
    expect(callInit(0).method).toBe("POST");
    expect(callBody(0)).toEqual({
      grant_type: "client_credentials",
      client_id: config.kiai.client_id_dev,
      client_secret: "secret-dev"
    });
    expect(callUrl(1)).toBe("https://api.dev/api/SignatureProcess/create");
    expect(callInit(1).headers.Authorization).toBe("Bearer tok-1");
    expect(callInit(1).headers["Content-Type"]).toBe("application/json");
    expect(callBody(1)).toEqual(createBody);
  });

  it("usa las URLs y credenciales de producción con env=pro", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-pro" }))
      .mockResolvedValueOnce(jsonResponse({ id: "p-2", status: "IN_PROGRESS", signers: [] }));

    await apiKiai(buildConfig({ env: "pro", client_id_pro: `client-pro-${++seq}` })).consultarProceso("p-2");

    expect(callUrl(0)).toBe("https://usuarios.kiai.co/api/oauth/token");
    expect(callBody(0).client_secret).toBe("secret-pro");
    expect(callUrl(1)).toBe("https://api.pro/api/SignatureProcess/p-2");
    expect(callInit(1).method).toBe("GET");
    expect(callInit(1).body).toBeUndefined();
  });

  it("reutiliza el token en cache entre llamadas", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-cache", expires_in: 900 }))
      .mockImplementation(async () => jsonResponse({ id: "p-3", status: "IN_PROGRESS", signers: [] }));

    const api = apiKiai(buildConfig());
    await api.consultarProceso("p-3");
    await api.consultarProceso("p-3");

    const tokenCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/api/oauth/token"));
    expect(tokenCalls).toHaveLength(1);
  });

  it("renueva el token y reintenta una vez ante 401", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-viejo", expires_in: 900 }))
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-nuevo", expires_in: 900 }))
      .mockResolvedValueOnce(jsonResponse({ message: "Proceso cancelado correctamente." }));

    const result = await apiKiai(buildConfig()).cancelarProceso("p-4");

    expect(result.message).toBe("Proceso cancelado correctamente.");
    expect(callUrl(3)).toBe("https://api.dev/api/SignatureProcess/p-4/cancel");
    expect(callInit(3).headers.Authorization).toBe("Bearer tok-nuevo");
  });

  it("propaga el mensaje de error de KIAI con su status", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 900 }))
      .mockResolvedValueOnce(jsonResponse({ message: "El proceso ya está en un estado final y no puede cancelarse." }, 400));

    await expect(apiKiai(buildConfig()).cancelarProceso("p-5")).rejects.toMatchObject({
      message: "KIAI cancelar proceso: El proceso ya está en un estado final y no puede cancelarse.",
      statusCode: 400
    });
  });

  it("reporta error de token cuando las credenciales son inválidas", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid_client" }, 401));

    await expect(apiKiai(buildConfig()).getToken()).rejects.toMatchObject({
      message: "KIAI token: invalid_client",
      statusCode: 401
    });
  });

  it("rechaza grant_type distinto de client_credentials", async () => {
    await expect(apiKiai(buildConfig({ grant_type: "password" })).getToken()).rejects.toThrow("no soportado");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falla si faltan credenciales del entorno", async () => {
    await expect(apiKiai(buildConfig({ secret_key_dev: "" })).getToken()).rejects.toThrow("faltan credenciales");
  });

  it("usa el token recibido por parámetro sin pedir uno nuevo", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "p-6", status: "COMPLETED", signers: [] }));

    await apiKiai(buildConfig(), { accessToken: "tok-ciclo" }).consultarProceso("p-6");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callInit(0).headers.Authorization).toBe("Bearer tok-ciclo");
  });

  it("en simulación no llama a KIAI", async () => {
    const api = apiKiai(buildConfig({ simulation: true }));

    const proceso = await api.crearProceso(createBody);
    const detalle = await api.consultarProceso(proceso.id);
    const cancelado = await api.cancelarProceso(proceso.id);

    expect(proceso.id).toMatch(/^MOCK-/);
    expect(proceso.status).toBe("IN_PROGRESS");
    expect(detalle.status).toBe("IN_PROGRESS");
    expect(cancelado.message).toContain("[MOCK]");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sin simulation definido simula solo en dev", () => {
    expect(apiKiai(buildConfig({ simulation: undefined })).simulation).toBe(true);
    expect(apiKiai(buildConfig({ simulation: undefined, env: "pro" })).simulation).toBe(false);
  });
});
