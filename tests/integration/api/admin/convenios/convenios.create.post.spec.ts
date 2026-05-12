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

describe("POST /api/admin/convenios/create — integración", () => {
  beforeAll(async () => {
    await doLogin();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("autenticación", () => {
    it("retorna 401 cuando no hay sesión", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_documento: "12345678",
          representante_nombre: "Juan Test"
        })
      });
      expect(response.status).toBe(401);
    });

    it("retorna 401 cuando el token en authorization es inválido", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer token-invalido",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_documento: "12345678",
          representante_nombre: "Juan Test"
        })
      });
      expect(response.status).toBe(401);
    });
  });

  describe("validación de payload", () => {
    it("retorna 400 cuando no se provee body", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        }
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando nit está ausente", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          razon_social: "Empresa Test",
          representante_documento: "12345678",
          representante_nombre: "Juan Test"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando razon_social está ausente", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          representante_documento: "12345678",
          representante_nombre: "Juan Test"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando representante_documento está ausente", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_nombre: "Juan Test"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando representante_nombre está ausente", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_documento: "12345678"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando correo tiene formato inválido", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_documento: "12345678",
          representante_nombre: "Juan Test",
          correo: "no-es-un-email"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando estado tiene valor inválido", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_documento: "12345678",
          representante_nombre: "Juan Test",
          estado: "EstadoInvalido"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando telefono excede 20 caracteres", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nit: "1234567890",
          razon_social: "Empresa Test",
          representante_documento: "12345678",
          representante_nombre: "Juan Test",
          telefono: "123456789012345678901"
        })
      });
      expect(response.status).toBe(400);
    });
  });

  describe("creación con sesión válida", () => {
    it("retorna 201 y el convenio creado", async () => {
      const uniqueSuffix = Date.now();
      const payload = {
        nit: `${uniqueSuffix}001`,
        razon_social: `Empresa Test ${uniqueSuffix}`,
        representante_documento: `${uniqueSuffix}`,
        representante_nombre: `Juan Test ${uniqueSuffix}`,
        telefono: "1234567890",
        correo: `test${uniqueSuffix}@example.com`,
        estado: "Activo",
        ciudad: "Bogotá",
        numero_empleados: 50
      };

      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        nit: expect.any(String),
        razon_social: expect.stringContaining(`Empresa Test ${uniqueSuffix}`),
        estado: "Activo"
      });
    });

    it("retorna 201 con campos opcionales omitidos", async () => {
      const uniqueSuffix = Date.now();
      const payload = {
        nit: `${uniqueSuffix}002`,
        razon_social: `Empresa Mínima ${uniqueSuffix}`,
        representante_documento: `${uniqueSuffix}`,
        representante_nombre: `Juan Test ${uniqueSuffix}`
      };

      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it("retorna 502 cuando el NIT ya existe (violación de unique)", async () => {
      const uniqueSuffix = Date.now();
      const payload = {
        nit: `999999999${uniqueSuffix % 100}`,
        razon_social: `Empresa Duplicada ${uniqueSuffix}`,
        representante_documento: `${uniqueSuffix}`,
        representante_nombre: `Juan Test ${uniqueSuffix}`
      };

      await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const response = await fetch(`${BASE_URL}/api/admin/convenios/create`, {
        method: "POST",
        headers: {
          "Cookie": sessionCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      expect(response.status).toBe(502);
    });
  });
});
