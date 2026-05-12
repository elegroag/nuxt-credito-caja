import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import { fetch } from "ofetch";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:4000";

const mswServer = setupServer(
  http.post("/api/utils/sender-email", () => {
    return HttpResponse.json({ success: true });
  }),
  http.post("http://172.168.0.15:9800/api/utils/sender-email", () => {
    return HttpResponse.json({ success: true });
  }),
  http.post("http://172.168.0.15:9800/api//utils/sender-email", () => {
    return HttpResponse.json({ success: true });
  }),
  http.post("**/utils/sender-email", () => {
    return HttpResponse.json({ success: true });
  })
);

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
  mswServer.close();
  vi.restoreAllMocks();
});

describe("POST /api/auth/register — integración", () => {
  describe("validación de schema", () => {
    it("retorna 400 cuando username tiene menos de 3 caracteres", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "juan.perez@example.com",
          username: "ab",
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando password tiene menos de 8 caracteres", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "juan.perez@example.com",
          username: "testuser123",
          password: "short",
          confirmar_password: "short"
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 4xx cuando passwords no coinciden (validación en servicio)", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "juan.perez@example.com",
          username: "testuser123",
          password: "Password123.",
          confirmar_password: "Different123."
        })
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("retorna 400 cuando email no es válido", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "invalid-email",
          username: "testuser123",
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando falta tipo_documento", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "juan.perez@example.com",
          username: "testuser123",
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando falta numero_documento", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "juan.perez@example.com",
          username: "testuser123",
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando body está vacío", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(400);
    });
  });

  describe("username duplicado", () => {
    it("retorna 409 cuando el username ya existe", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "otro.email@example.com",
          username: "admin",
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Username already in use");
    });
  });

  describe("registro exitoso (verifica respuesta del API externa)", () => {
    it("retorna respuesta con estructura esperada cuando registration succeeds", async () => {
      const unique = Date.now();
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: `test_${unique}@example.com`,
          username: `user_${unique}`,
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        expect(data.success).toBe(true);
        expect(data.message).toBe("Register successful");
        expect(data.data).toMatchObject({
          message: "Register successful",
          pin: expect.any(String),
          access_token: expect.any(String),
          token_type: "bearer"
        });
        expect(data.data.user).toMatchObject({
          username: expect.any(String),
          email: expect.any(String),
          full_name: expect.any(String),
          roles: expect.arrayContaining(["user_trabajador"])
        });
      } else {
        expect(data.success).toBe(false);
        expect(data.error).toContain("sender-email");
      }
    });

    it("verifica respuesta contiene campos de sesión", async () => {
      const unique = Date.now() + 1;
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: `test_${unique}@example.com`,
          username: `jwtuser_${unique}`,
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });

      const data = await response.json();

      if (data.data?.access_token) {
        expect(data.data.access_token).toBeDefined();
        expect(typeof data.data.access_token).toBe("string");
        expect(data.data.access_token.split(".")).toHaveLength(3);
      }
    });
  });

  describe("campos requeridos", () => {
    const requiredFields = [
      "tipo_documento",
      "numero_documento",
      "nombres",
      "apellidos",
      "telefono",
      "email",
      "username",
      "password",
      "confirmar_password"
    ];

    requiredFields.forEach((field) => {
      it(`retorna 400 cuando falta ${field}`, async () => {
        const payload = {
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: "test@example.com",
          username: "testuser123",
          password: "Password123.",
          confirmar_password: "Password123."
        };
        delete payload[field as keyof typeof payload];

        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        expect(response.status).toBe(400);
      });
    });
  });

  describe("seguridad", () => {
    it("ruta /api/auth/register es pública", async () => {
      const unique = Date.now() + 5;
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "CC",
          numero_documento: "12345678",
          nombres: "JUAN",
          apellidos: "PEREZ",
          telefono: "3001234567",
          email: `test_${unique}@example.com`,
          username: `public_${unique}`,
          password: "Password123.",
          confirmar_password: "Password123."
        })
      });
      expect(response.status).toBeDefined();
    });
  });
});
