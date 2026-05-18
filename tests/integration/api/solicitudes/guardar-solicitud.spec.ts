import { describe, it, expect, afterAll, beforeAll, vi } from "vitest";
import { fetch } from "ofetch";

const BASE_URL = "http://localhost:4000";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 500
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 502 && i < retries - 1) {
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

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

describe("POST /api/solicitudes/guardar-solicitud — integración", () => {
  beforeAll(async () => {
    await doLogin();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("autenticación", () => {
    it("retorna 401 cuando no hay sesión", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 5000000,
              plazo_meses: 12
            }
          })
        }
      );
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.statusCode).toBe(401);
      expect(data.message).toBe("Debe iniciar sesión para acceder a este recurso");
    });

    it("retorna 401 cuando el token en authorization es inválido", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer token-invalido"
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 5000000,
              plazo_meses: 12
            }
          })
        }
      );
      expect(response.status).toBe(401);
    });
  });

  describe("validación de schema", () => {
    it("retorna 400 cuando valor_solicitud es negativo", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: -1000,
              plazo_meses: 12
            }
          })
        }
      );
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando plazo_meses es negativo", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 5000000,
              plazo_meses: -5
            }
          })
        }
      );
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando tasa_interes es negativa", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 5000000,
              plazo_meses: 12,
              tasa_interes: -1
            }
          })
        }
      );
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando rol_en_solicitud tiene valor inválido", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 5000000,
              plazo_meses: 12,
              rol_en_solicitud: "X"
            }
          })
        }
      );
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando el body está vacío", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({})
        }
      );
      expect(response.status).toBe(400);
    });

    it("retorna 400 cuando el email del solicitante es inválido", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 5000000,
              plazo_meses: 12
            },
            solicitante: {
              email: "no-es-un-email"
            }
          })
        }
      );
      expect(response.status).toBe(400);
    });
  });

  describe("creación exitosa de solicitud", () => {
    it("retorna 200 y estructura de respuesta exitosa con datos de solicitud", async () => {
      const unique = `T${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
      const response = await fetchWithRetry(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
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
              numero_documento: `${unique}`,
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
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.numero_solicitud).toBeTruthy();
      expect(data.data).toHaveProperty("numero_solicitud");
      expect(data.data).toHaveProperty("solicitud");
      expect(data.data.solicitud).toHaveProperty("numero_solicitud");
      expect(data.data.solicitud).toHaveProperty("valor_solicitud");
      expect(Number(data.data.solicitud.valor_solicitud)).toBe(5000000);
      expect(data.data.solicitud).toHaveProperty("plazo_meses", 12);
      expect(data.data.solicitud).toHaveProperty("estado");
    });

    it("contiene campos requeridos en la respuesta de éxito", async () => {
      const unique = `T${Date.now()}${Math.random().toString(36).slice(2, 8)}A`;
      const response = await fetchWithRetry(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 3000000,
              plazo_meses: 6
            },
            solicitante: {
              tipo_documento: "CC",
              numero_documento: `${unique}`,
              email: `test2_${unique}@example.com`
            }
          })
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("message");
      expect(data.data).toHaveProperty("numero_solicitud");
      expect(data.data.solicitud).toHaveProperty("numero_solicitud");
      expect(data.data.solicitud).toHaveProperty("owner_username");
      expect(data.data.solicitud).toHaveProperty("valor_solicitud");
      expect(Number(data.data.solicitud.valor_solicitud)).toBe(3000000);
      expect(data.data.solicitud).toHaveProperty("plazo_meses", 6);
      expect(data.data.solicitud).toHaveProperty("estado");
    });

    it("genera número de solicitud automáticamente si no se provee", async () => {
      const response = await fetchWithRetry(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 1000000,
              plazo_meses: 3
            }
          })
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.numero_solicitud).toMatch(/^\d{6}-\d{4}-\d{2}$/);
    });

    it("acepta solicitante con formato de ciudad como objeto {label, value}", async () => {
      const unique = `T${Date.now()}${Math.random().toString(36).slice(2, 8)}B`;
      const response = await fetchWithRetry(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 2500000,
              plazo_meses: 8
            },
            solicitante: {
              tipo_documento: "CC",
              numero_documento: `${unique}`,
              ciudad: { label: "Florencia", value: "FLORENCIA" },
              email: `test3_${unique}@example.com`
            }
          })
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.solicitud).toHaveProperty("numero_solicitud");
    });

    it("el owner_username se toma de la sesión cuando no se provee", async () => {
      const response = await fetchWithRetry(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 1500000,
              plazo_meses: 4
            }
          })
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.solicitud.owner_username).toBe("admin");
    });
  });

  describe("campos opcionales", () => {
    it("acepta solicitud sin solicitante", async () => {
      const response = await fetchWithRetry(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 2000000,
              plazo_meses: 12,
              tipo_credito: "01"
            }
          })
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.solicitud).toHaveProperty("numero_solicitud");
    });

    it("acepta campos adicionales en payload", async () => {
      const response = await fetch(
        `${BASE_URL}/api/solicitudes/guardar-solicitud`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            solicitud: {
              valor_solicitud: 1800000,
              plazo_meses: 6
            },
            linea_credito: { tipcre: "03" },
            informacion_economica: {
              total_activos: 50000000,
              total_pasivos: 10000000
            }
          })
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.payload).toHaveProperty("linea_credito");
    });
  });
});
