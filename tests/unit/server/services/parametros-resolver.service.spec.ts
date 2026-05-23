/**
 * parametros-resolver.service.spec.ts
 *
 * Tests para parametros-resolver.service.ts
 * Verifica que los resolveores traduzcan correctamente códigos → texto legible.
 */

import { describe, it, expect, beforeEach } from "vitest";
import parametrosResolver from "~~/server/services/shared/parametros-resolver.service";

describe("parametrosResolver", () => {
  // Datos mock con estructura real de parametros.ts
  const mockCatalogos = {
    ciudades: [
      { codciu: "001", detciu: "FLORENCIA" },
      { codciu: "002", detciu: "SAN VICENTE DEL CAGUÁN" }
    ],
    paises: [
      { cod1: "CO", nombre: "COLOMBIA" },
      { cod1: "US", nombre: "ESTADOS UNIDOS" }
    ],
    ocupaciones: [
      { codocu: "001", detalle: "ABOGADO" },
      { codocu: "002", detalle: "INGENIERO DE SISTEMAS" }
    ],
    sectores_economicos: [
      { sector: "01", detalle: "AGRICULTURA" },
      { sector: "02", detalle: "INDUSTRIA MANUFACTURERA" }
    ],
    codigos_tipo_documento: [
      { coddoc: "CC", detdoc: "CÉDULA DE CIUDADANÍA" },
      { coddoc: "CE", detdoc: "CÉDULA DE EXTRANJERÍA" },
      { coddoc: "NIT", detdoc: "NÚMERO DE IDENTIFICACIÓN TRIBUTARIA" }
    ],
    tipo_vivienda: [
      { vivienda: "01", detalle: "PROPIA" },
      { vivienda: "02", detalle: "ARRENDADA" }
    ],
    tipo_contrato: [
      { tipcon: "01", detalle: "TÉRMINO FIJO" },
      { tipcon: "02", detalle: "TÉRMINO INDEFINIDO" },
      { tipcon: "03", detalle: "CONTRATO DE OBRA O LABUR" }
    ],
    nivel_educativos: [
      { nivedu: "01", detalle: "PRIMARIA" },
      { nivedu: "02", detalle: "SECUNDARIA" }
    ],
    sexos: [
      { codsex: "M", detsex: "MASCULINO" },
      { codsex: "F", detsex: "FEMENINO" }
    ],
    estado_civiles: [
      { estciv: "S", detest: "SOLTERO" },
      { estciv: "C", detest: "CASADO" }
    ]
  };

  describe("inicialización y catalogos", () => {
    it("inicializa con catalogos null al crear el servicio", () => {
      const resolver = parametrosResolver();
      // No se puede acceder directamente a catalogos porque es privado,
      // pero verificamos que el servicio se crea sin errores
      expect(resolver).toBeDefined();
      expect(typeof resolver.init).toBe("function");
      expect(typeof resolver.resolveCiudad).toBe("function");
    });

    it("init acepta la estructura completa de catalogos", () => {
      const resolver = parametrosResolver();
      expect(() => resolver.init(mockCatalogos)).not.toThrow();
    });

    it("init puede llamarse múltiples veces (sobrescribe catalogos)", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      // Segunda llamada no lanza, solo sobrescribe
      expect(() => resolver.init(mockCatalogos)).not.toThrow();
      // Verify que sigue funcionando
      expect(resolver.resolveCiudad("001")).toBe("FLORENCIA");
    });
  });

  describe("resolveCiudad", () => {
    beforeEach(() => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
    });

    it("retorna el nombre cuando encuentra el código", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveCiudad("001")).toBe("FLORENCIA");
    });

    it("retorna el código cuando no encuentra coincidencia (fallback)", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveCiudad("999")).toBe("999");
    });

    it("retorna string vacío cuando recibe código null/undefined", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveCiudad(null)).toBe("");
      expect(resolver.resolveCiudad(undefined)).toBe("");
    });
  });

  describe("resolvePais", () => {
    it("retorna el nombre del país cuando encuentra el código", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolvePais("CO")).toBe("COLOMBIA");
    });

    it("retorna el código como fallback cuando no encuentra coincidencia", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolvePais("XX")).toBe("XX");
    });
  });

  describe("resolveOcupacion", () => {
    it("retorna el detalle de la ocupación", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveOcupacion("001")).toBe("ABOGADO");
    });

    it("retorna el código como fallback", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveOcupacion("999")).toBe("999");
    });
  });

  describe("resolveSectorEconomico", () => {
    it("retorna el detalle del sector económico usando clave 'sector'", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveSectorEconomico("01")).toBe("AGRICULTURA");
      expect(resolver.resolveSectorEconomico("02")).toBe("INDUSTRIA MANUFACTURERA");
    });

    it("retorna el código como fallback", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveSectorEconomico("99")).toBe("99");
    });
  });

  describe("resolveTipoDocumento", () => {
    it("retorna el nombre completo del tipo de documento", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveTipoDocumento("CC")).toBe("CÉDULA DE CIUDADANÍA");
      expect(resolver.resolveTipoDocumento("NIT")).toBe("NÚMERO DE IDENTIFICACIÓN TRIBUTARIA");
    });

    it("retorna el código como fallback", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveTipoDocumento("XX")).toBe("XX");
    });
  });

  describe("resolveTipoVivienda", () => {
    it("retorna el detalle del tipo de vivienda", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveTipoVivienda("01")).toBe("PROPIA");
      expect(resolver.resolveTipoVivienda("02")).toBe("ARRENDADA");
    });
  });

  describe("resolveTipoContrato", () => {
    it("retorna el detalle del tipo de contrato usando clave 'tipcon'", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveTipoContrato("01")).toBe("TÉRMINO FIJO");
      expect(resolver.resolveTipoContrato("03")).toBe("CONTRATO DE OBRA O LABUR");
    });

    it("retorna el código como fallback", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveTipoContrato("99")).toBe("99");
    });
  });

  describe("resolveNivelEducativo", () => {
    it("retorna el detalle del nivel educativo", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveNivelEducativo("01")).toBe("PRIMARIA");
      expect(resolver.resolveNivelEducativo("02")).toBe("SECUNDARIA");
    });
  });

  describe("resolveSexo", () => {
    it("retorna el nombre del sexo", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveSexo("M")).toBe("MASCULINO");
      expect(resolver.resolveSexo("F")).toBe("FEMENINO");
    });
  });

  describe("resolveEstadoCivil", () => {
    it("retorna el detalle del estado civil", () => {
      const resolver = parametrosResolver();
      resolver.init(mockCatalogos);
      expect(resolver.resolveEstadoCivil("S")).toBe("SOLTERO");
      expect(resolver.resolveEstadoCivil("C")).toBe("CASADO");
    });
  });

  describe("comportamiento sin inicializar", () => {
    it("resolveCiudad retorna el código sin traducir si no hay catalogos", () => {
      const resolver = parametrosResolver();
      expect(resolver.resolveCiudad("001")).toBe("001");
    });

    it("resolveTipoContrato retorna el código sin traducir si no hay catalogos", () => {
      const resolver = parametrosResolver();
      expect(resolver.resolveTipoContrato("01")).toBe("01");
    });
  });
});