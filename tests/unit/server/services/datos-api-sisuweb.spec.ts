import { describe, it, expect, vi } from "vitest";
// @ts-ignore
import mockDatosGenerales from "@tests/mocks/api-creditos-datos-generales.json";

// @ts-ignore
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
// @ts-ignore
import apiSisuweb from "~~/server/services/api-sisuweb";

vi.mock("~~/server/services/api-sisuweb", () => ({
  default: vi.fn(() => ({
    postJson: vi.fn()
  }))
}));

describe("datosApiSisuwebService", () => {
  describe("dataGeneral", () => {
    it("retorna los datos generales cuando la API responde exitosamente", async () => {
      vi.mocked(apiSisuweb).mockReturnValue({
        postJson: vi.fn().mockResolvedValue(mockDatosGenerales)
      });

      const service = datosApiSisuwebService();
      const result = await service.dataGeneral();

      expect(result).toEqual(mockDatosGenerales.data);
      expect(result.motivos_de_rechazos).toHaveLength(8);
      expect(result.formas_de_pago[0].forpag).toBe("1");
    });

    it("lanza error cuando la API retorna success: false", async () => {
      const mockResponse = {
        success: false,
        error: "Error de prueba"
      };

      vi.mocked(apiSisuweb).mockReturnValue({
        postJson: vi.fn().mockResolvedValue(mockResponse)
      });

      const service = datosApiSisuwebService();

      await expect(service.dataGeneral()).rejects.toThrow("Error de prueba");
    });

    it("lanza error cuando la API responde null", async () => {
      vi.mocked(apiSisuweb).mockReturnValue({
        postJson: vi.fn().mockResolvedValue(null)
      });

      const service = datosApiSisuwebService();

      await expect(service.dataGeneral()).rejects.toThrow(
        "Error al obtener los datos generales"
      );
    });

    it("retorna null cuando data es null pero success es true", async () => {
      const mockResponse = {
        success: true,
        data: null
      };

      vi.mocked(apiSisuweb).mockReturnValue({
        postJson: vi.fn().mockResolvedValue(mockResponse)
      });

      const service = datosApiSisuwebService();
      const result = await service.dataGeneral();

      expect(result).toBeNull();
    });
  });
});
