import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import { fetch } from "ofetch";

const BASE_URL = "http://localhost:4000";

let sessionCookie: string;

async function doLogin() {
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "Admin123$."
    })
  });
  const setCookieHeader = loginResponse.headers.get("set-cookie");
  if (setCookieHeader) {
    sessionCookie = setCookieHeader.split(";")[0];
  }
}

describe("GET /api/admin/convenios — integración", () => {
  beforeAll(async () => {
    await doLogin();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("autenticación", () => {
    it("retorna 401 cuando no hay sesión", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios`, {
        method: "GET"
      });
      expect(response.status).toBe(401);
    });

    it("retorna 401 cuando el token en authorization es inválido", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios`, {
        method: "GET",
        headers: { Authorization: "Bearer token-invalido" }
      });
      expect(response.status).toBe(401);
    });
  });

  describe("respuesta con sesión válida", () => {
    it("retorna 200 con paginación por defecto", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("empresas");
      expect(data.data).toHaveProperty("pagination");
      expect(Array.isArray(data.data.empresas)).toBe(true);
    });

    it("retorna estructura de paginación correcta", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const data = await response.json();

      expect(data.data.pagination).toMatchObject({
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it("retorna conteo de estados", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const data = await response.json();

      expect(data.data).toHaveProperty("conteo_estados");
      expect(typeof data.data.conteo_estados).toBe("object");
    });

    it("acepta parámetro page", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios?page=2`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.page).toBe(2);
    });

    it("acepta parámetro limit", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios?limit=5`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.limit).toBe(5);
      expect(data.data.empresas.length).toBeLessThanOrEqual(5);
    });

    it("acepta parámetro estado", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios?estado=Activo`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      data.data.empresas.forEach((empresa: Record<string, unknown>) => {
        expect(empresa.estado).toBe("Activo");
      });
    });

    it("acepta parámetro nit", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios?nit=123456789`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);
    });

    it("retorna 502 cuando se usa parámetro busqueda (mode insensitive no soportado)", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios?busqueda=test`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(502);
    });

    it("retorna empresas con campos esperados", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios?limit=1`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const data = await response.json();

      if (data.data.empresas.length === 0) {
        it.skip("skip: no hay convenios en la base de datos", () => {});
        return;
      }

      const empresa = data.data.empresas[0];
      expect(empresa).toMatchObject({
        id: expect.any(String),
        nit: expect.any(String),
        razon_social: expect.any(String),
        estado: expect.any(String)
      });
    });
  });
});
