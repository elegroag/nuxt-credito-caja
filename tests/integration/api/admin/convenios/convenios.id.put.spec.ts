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

describe("PUT /api/admin/convenios/:id — integración", () => {
  beforeAll(async () => {
    await doLogin();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("autenticación", () => {
    it("retorna 401 cuando no hay sesión", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razon_social: "Test" })
      });
      expect(response.status).toBe(401);
    });

    it("retorna 401 cuando el token en authorization es inválido", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/1`, {
        method: "PUT",
        headers: {
          "Authorization": "Bearer token-invalido",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ razon_social: "Test" })
      });
      expect(response.status).toBe(401);
    });
  });

  describe("respuesta con sesión válida", () => {
    it("retorna 400 cuando no se provee body", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/1`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        }
      });
      expect(response.status).toBe(400);
    });

    it("retorna 502 cuando el convenio no existe", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/999999999`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ razon_social: "Test" })
      });
      expect(response.status).toBe(502);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("retorna 200 y el convenio actualizado", async () => {
      const listResponse = await fetch(`${BASE_URL}/api/admin/convenios?page=1&limit=1`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const listData = await listResponse.json();

      if (!listData.data?.empresas || listData.data.empresas.length === 0) {
        it.skip("skip: no hay convenios en la base de datos", () => {});
        return;
      }

      const firstConvenio = listData.data.empresas[0];
      const id = firstConvenio.id;

      const updatePayload = {
        razon_social: `${firstConvenio.razon_social} (actualizado)`,
        telefono: "1234567890"
      };

      const response = await fetch(`${BASE_URL}/api/admin/convenios/${id}`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatePayload)
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        nit: expect.any(String),
        razon_social: expect.stringContaining("(actualizado)"),
        estado: expect.any(String)
      });
    });

    it("retorna 400 cuando el body tiene campos inválidos", async () => {
      const listResponse = await fetch(`${BASE_URL}/api/admin/convenios?page=1&limit=1`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const listData = await listResponse.json();

      if (!listData.data?.empresas || listData.data.empresas.length === 0) {
        it.skip("skip: no hay convenios en la base de datos", () => {});
        return;
      }

      const firstConvenio = listData.data.empresas[0];
      const id = firstConvenio.id;

      const response = await fetch(`${BASE_URL}/api/admin/convenios/${id}`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ correo: "no-es-un-email" })
      });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("retorna 502 cuando el ID no es numérico", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/abc`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ razon_social: "Test" })
      });
      expect(response.status).toBe(502);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("cannot be converted to a BigInt");
    });

    it("acepta actualización de estado válido", async () => {
      const listResponse = await fetch(`${BASE_URL}/api/admin/convenios?page=1&limit=1`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const listData = await listResponse.json();

      if (!listData.data?.empresas || listData.data.empresas.length === 0) {
        it.skip("skip: no hay convenios en la base de datos", () => {});
        return;
      }

      const firstConvenio = listData.data.empresas[0];
      const id = firstConvenio.id;

      const response = await fetch(`${BASE_URL}/api/admin/convenios/${id}`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ estado: "Inactivo" })
      });
      expect(response.status).toBe(200);
    });

    it("acepta actualización de numero_empleados como entero", async () => {
      const listResponse = await fetch(`${BASE_URL}/api/admin/convenios?page=1&limit=1`, {
        method: "GET",
        headers: { Cookie: sessionCookie }
      });
      const listData = await listResponse.json();

      if (!listData.data?.empresas || listData.data.empresas.length === 0) {
        it.skip("skip: no hay convenios en la base de datos", () => {});
        return;
      }

      const firstConvenio = listData.data.empresas[0];
      const id = firstConvenio.id;

      const response = await fetch(`${BASE_URL}/api/admin/convenios/${id}`, {
        method: "PUT",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ numero_empleados: 150 })
      });
      expect(response.status).toBe(200);
    });
  });
});
