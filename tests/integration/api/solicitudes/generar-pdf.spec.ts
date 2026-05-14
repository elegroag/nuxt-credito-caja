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

async function createTestSolicitud(): Promise<string> {
  const unique = `T${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const response = await fetchWithRetry(
    `${BASE_URL}/api/solicitudes/guardar-solicitud`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      solicitud: {
        valor_solicitud: 5000000,
        plazo_meses: 12,
        producto_tipo: "01",
        tipo_credito: "01",
        ha_tenido_credito: false,
        rol_en_solicitud: "T"
      },
      solicitante: {
        tipo_persona: "natural",
        tipo_documento: "CC",
        numero_documento: unique,
        nombres: "JUAN",
        apellidos: "PEREZ",
        email: `test_${unique}@example.com`,
        telefono_movil: "3001234567",
        ciudad: "FLORENCIA",
        pais_residencia: "CO"
      },
      informacion_laboral: {
        cargo: "ANALISTA",
        empresa_razon_social: "EMPRESA TEST",
        tipo_contrato: "TERMINO_FIJO"
      },
      ingresos_descuentos: {
        salario_basico_mensual: 2000000,
        total_ingresos: 2000000,
        total_descuentos: 0
      }
    })
  });
  const data = await response.json();
  if (!data.data?.numero_solicitud) {
    throw new Error(`createTestSolicitud failed: ${JSON.stringify(data)}`);
  }
  return data.data.numero_solicitud;
}

async function fetchWithRetry(
  url: string,
  options: any,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 502 && i < retries - 1) {
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

describe("POST /api/solicitudes/:id/generar-pdf — integración", () => {
  beforeAll(async () => {
    await doLogin();
  });

  afterAll(() => {
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
    let solicitudId: string;

    beforeAll(async () => {
      solicitudId = await createTestSolicitud();
    });

    it("retorna 200 y estructura esperada cuando la solicitud existe", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/${solicitudId}/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("PDF generado exitosamente");
      expect(data.data).toMatchObject({
        solicitud_id: solicitudId,
        filename: expect.any(String),
        path: expect.any(String)
      });
    });

    it("contiene campos requeridos en la respuesta de éxito", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/${solicitudId}/generar-pdf`,
        {
          method: "POST",
          headers: { Cookie: sessionCookie }
        }
      );

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
    let solicitudId: string;

    beforeAll(async () => {
      solicitudId = await createTestSolicitud();
    });

    it.skip("retorna 500 cuando Flask PDF retorna success=false", async () => {
    });

    it.skip("retorna 502 cuando Flask PDF no está disponible", async () => {
    });
  });
});
