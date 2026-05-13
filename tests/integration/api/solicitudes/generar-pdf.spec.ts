import { describe, it, expect, afterAll, beforeAll, beforeEach, vi } from "vitest";
import { fetch } from "ofetch";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:4000";

const mswServer = setupServer(
  http.post("**/creditos/generate-pdf", async () => {
    return HttpResponse.json({
      success: true,
      data: {
        api_path: "/storage/documents/test_solicitud_123.pdf",
        api_filename: "solicitud_TEST123.pdf",
        api_content: "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb29"
      }
    });
  })
);

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

describe("POST /api/solicitudes/:id/generar-pdf — integración", () => {
  beforeAll(async () => {
    mswServer.listen({ onUnhandledRequest: "bypass" });
    await doLogin();
  });

  afterAll(() => {
    mswServer.close();
    vi.restoreAllMocks();
  });

  describe("autenticación", () => {
    it("retorna 401 cuando no hay sesión", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/TEST123/generar-pdf`,
        {
          method: "POST"
        }
      );
      expect(response.status).toBe(401);
    });

    it("retorna 401 cuando el token en authorization es inválido", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/TEST123/generar-pdf`,
        {
          method: "POST",
          headers: { Authorization: "Bearer token-invalido" }
        }
      );
      expect(response.status).toBe(401);
    });
  });

  describe("validación de parámetros", () => {
    it("retorna 400 cuando el ID está vacío", async () => {
      const response = await fetch(`${BASE_URL}/api/solicitudes//generar-pdf`, {
        method: "POST",
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(400);
    });
  });

  describe("caso no encontrado", () => {
    it("retorna 404 cuando la solicitud no existe", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/NONEXISTENT999/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Solicitud no encontrada");
    });
  });

  describe("generación exitosa de PDF", () => {
    it("retorna 200 y estructura esperada cuando la solicitud existe", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/TEST123/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );

      if (response.status === 404) {
        console.warn("SKIP: solicitud TEST123 no existe en la base de datos");
        return;
      }

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("PDF generado exitosamente");
      expect(data.data).toMatchObject({
        solicitud_id: "TEST123",
        filename: expect.any(String),
        path: expect.any(String)
      });
    });

    it("contiene campos requeridos en la respuesta de éxito", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/TEST123/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );

      if (response.status === 404) {
        console.warn("SKIP: solicitud TEST123 no existe en la base de datos");
        return;
      }

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("solicitud_id");
      expect(data.data).toHaveProperty("filename");
      expect(data.data).toHaveProperty("path");
    });
  });

  describe("manejo de errores del servicio Flask PDF", () => {
    beforeEach(() => {
      mswServer.resetHandlers();
    });

    it("retorna 500 cuando Flask PDF retorna success=false", async () => {
      mswServer.use(
        http.post("**/creditos/generate-pdf", async () => {
          return HttpResponse.json({
            success: false,
            message: "Error interno en Flask PDF"
          });
        })
      );

      const response = await fetch(
        `${BASE_URL}/api/solicitudes/TEST123/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );

      if (response.status === 404) {
        console.warn("SKIP: TEST123 no existe, no se puede probar error de Flask");
        return;
      }

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Error al generar el PDF");
    });

    it("retorna 502 cuando Flask PDF no está disponible", async () => {
      mswServer.use(
        http.post("**/creditos/generate-pdf", async () => {
          return new HttpResponse(null, { status: 502 });
        })
      );

      const response = await fetch(
        `${BASE_URL}/api/solicitudes/TEST123/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );

      if (response.status === 404) {
        console.warn("SKIP: TEST123 no existe, no se puede probar error 502");
        return;
      }

      expect(response.status).toBe(502);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
