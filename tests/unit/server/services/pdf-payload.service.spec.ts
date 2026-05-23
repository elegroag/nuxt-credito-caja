/**
 * pdf-payload.service.spec.ts
 *
 * Tests para pdf-payload.service.ts
 * Verifica construcción del payload y serializeForPdf.
 */

import { describe, it, expect } from "vitest";
import pdfPayloadService, { serializeForPdf } from "~~/server/services/pdf/pdf-payload.service";

// ---------- Tests: serializeForPdf ----------

describe("serializeForPdf", () => {
  it("retorna null cuando recibe null", () => {
    expect(serializeForPdf(null)).toBeNull();
  });

  it("retorna undefined cuando recibe undefined", () => {
    expect(serializeForPdf(undefined)).toBeUndefined();
  });

  it("convierte Date a ISO string", () => {
    const date = new Date("2025-05-23T10:30:00Z");
    expect(serializeForPdf(date)).toBe("2025-05-23T10:30:00.000Z");
  });

  it("convierte BigInt a string", () => {
    const big = BigInt(123456789);
    expect(serializeForPdf(big)).toBe("123456789");
  });

  it("convierte objetos Date dentro de arrays", () => {
    const input = [{ fecha: new Date("2025-01-01T00:00:00Z") }, { nombre: "test" }];
    const result = serializeForPdf(input) as Record<string, unknown>[];
    expect(result[0].fecha).toBe("2025-01-01T00:00:00.000Z");
  });

  it("convierte BigInt dentro de objetos", () => {
    const input = { big: BigInt(999), normal: "foo" };
    const result = serializeForPdf(input) as Record<string, unknown>;
    expect(result.big).toBe("999");
    expect(result.normal).toBe("foo");
  });

  it("preserve números, strings y booleanos", () => {
    const input = { n: 42, s: "hola", b: true, arr: [1, 2, 3] };
    const result = serializeForPdf(input) as Record<string, unknown>;
    expect(result.n).toBe(42);
    expect(result.s).toBe("hola");
    expect(result.b).toBe(true);
    expect(result.arr).toEqual([1, 2, 3]);
  });

  it("no convierte arrays vacíos", () => {
    const input: unknown[] = [];
    expect(serializeForPdf(input)).toEqual([]);
  });

  it("handle objects with nested objects", () => {
    const input = { a: { b: { c: 1 } }, d: [{ e: 2 }] };
    const result = serializeForPdf(input) as Record<string, unknown>;
    expect((result.a as Record<string, unknown>).b).toEqual({ c: 1 });
    expect(result.d).toEqual([{ e: 2 }]);
  });
});

// ---------- Tests: buildPayload ----------

describe("pdfPayloadService.buildPayload", () => {
  // Mock mínimo de SolicitudDB compatible con el tipo Prisma
  const mockSolicitud = {
    numero_solicitud: "SOL-2025-001",
    fecha_radicado: new Date("2025-05-10T09:00:00Z"),
    valor_solicitud: 5_000_000,
    plazo_meses: 24,
    numero_comprobante: "COMP-123",
    rol_en_solicitud: "T",
    producto_tipo: "LIBRANZA",
    tipo_credito: "01",
    ha_tenido_credito: true,
    solicitud_solicitante: [
      {
        numero_documento: "12345678",
        tipo_documento: "CC",
        nombres: "JUAN CARLOS",
        apellidos: "PÉREZ GÓMEZ",
        fecha_nacimiento: new Date("1990-03-15"),
        genero: "M",
        pais_residencia: "CO",
        ciudad: "001",
        cargo: "001",
        tipo_vivienda: "01",
        nivel_educativo: "02",
        estado_civil: "C",
        direccion: "CARRERA 10 # 5-20",
        telefono_fijo: "6015551234",
        telefono_movil: "3101234567",
        email: "juan@example.com",
        barrio: "CENTRO",
        vive_con_nucleo_familiar: true,
        personas_a_cargo: 2,
        salario: { toNumber: () => 2_500_000 },
        tipo_persona: "natural",
        created_at: new Date("2024-01-15T08:00:00Z"),
        nit: 123456789,
        razon_social: null,
        antiguedad_meses: 36,
        codigo_categoria: "B"
      }
    ] as unknown,
    firmantes_solicitud: [
      {
        tipo: "FIRMANTE",
        rol: "PRINCIPAL",
        nombre_completo: "MARÍA LÓPEZ",
        numero_documento: "87654321",
        email: "maria@example.com",
        orden: 1
      }
    ] as unknown,
    solicitud_payload: [
      {
        informacion_laboral: {
          empresa_nit: "900123456",
          empresa_razon_social: "ACME S.A.",
          empresa_direccion: "AV. PRINCIPAL 100",
          empresa_telefono: "6015559999",
          empresa_ciudad: "001",
          cargo: "ANALISTA",
          fecha_ingreso: "2022-03-01",
          tiempo_servicio: 36,
          tiempo_servicio_unidad: "meses",
          tipo_contrato: "02",
          representacion: null,
         nit: null,
          representante_nombre: "PEDRO PÉREZ",
          representante_documento: "11223344",
          nit_convenio: "900123456",
          nombre_convenio: "ACME S.A.",
          fecha_convenio: "2020-01-01",
          fecha_vencimiento: "2030-12-31",
          estado: "Activo"
        },
        ingresos_descuentos: {
          salario_basico_mensual: 2_500_000,
          horas_extras: 200_000,
          comisiones: 100_000,
          otros_ingresos: 50_000,
          total_ingresos: 2_850_000,
          salud_pension: 300_000,
          judiciales: 0,
          libranzas_comfaca: 150_000,
          otras_libranzas: 50_000,
          otras_deducciones: 0,
          total_descuentos: 500_000,
          total_neto_recibido: 2_350_000,
          moneda: "COP",
          deduccion_adicional: null
        },
        informacion_economica: {
          total_activos: 50_000_000,
          total_pasivos: 10_000_000,
          total_gastos: 800_000,
          arrendamientos: 0,
          otros: 0,
          descripcion: null,
          gastos_descripcion: null,
          moneda: "COP"
        },
        propiedades: [],
        deudas: [{ acreedor: "BANCOLOMBIA", valor: 5_000_000 }],
        referencias: {
          familiares: [{ nombre: "LUIS PÉREZ", telefono: "3109991111", parentesco: "HERMANO" }],
          personales: [{ nombre: "ANA GÓMEZ", telefono: "3102223333" }]
        }
      }
    ] as unknown
  };

  const mockCatalogos = {
    ciudades: [{ codciu: "001", detciu: "FLORENCIA" }],
    paises: [{ cod1: "CO", nombre: "COLOMBIA" }],
    ocupaciones: [
      { codocu: "001", detalle: "INGENIERO DE SISTEMAS" },
      { codocu: "002", detalle: "ABOGADO" }
    ],
    sectores_economicos: [{ sector: "01", detalle: "AGRICULTURA" }],
    codigos_tipo_documento: [
      { coddoc: "CC", detdoc: "CÉDULA DE CIUDADANÍA" },
      { coddoc: "NIT", detdoc: "NÚMERO DE IDENTIFICACIÓN TRIBUTARIA" }
    ],
    tipo_vivienda: [{ vivienda: "01", detalle: "PROPIA" }],
    tipo_contrato: [
      { tipcon: "01", detalle: "TÉRMINO FIJO" },
      { tipcon: "02", detalle: "TÉRMINO INDEFINIDO" }
    ],
    nivel_educativos: [
      { nivedu: "01", detalle: "PRIMARIA" },
      { nivedu: "02", detalle: "SECUNDARIA" }
    ],
    sexos: [{ codsex: "M", detsex: "MASCULINO" }],
    estado_civiles: [{ estciv: "C", detest: "CASADO" }]
  };

  it("construye payload con datos del solicitante resueltos", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      mockSolicitud.solicitud_payload[0].informacion_laboral as Record<string, unknown>,
      mockSolicitud.solicitud_payload[0].ingresos_descuentos as Record<string, unknown>,
      mockSolicitud.solicitud_payload[0].informacion_economica as Record<string, unknown>,
      mockSolicitud.solicitud_payload[0].propiedades as unknown[],
      mockSolicitud.solicitud_payload[0].deudas as unknown[],
      mockSolicitud.solicitud_payload[0].referencias as { familiares: unknown[]; personales: unknown[] }
    ) as Record<string, unknown>;

    // Verificar secciones principales
    expect(payload).toHaveProperty("solicitud");
    expect(payload).toHaveProperty("solicitante");
    expect(payload).toHaveProperty("laboral");
    expect(payload).toHaveProperty("economica");
    expect(payload).toHaveProperty("ingresos");
    expect(payload).toHaveProperty("descuentos");
    expect(payload).toHaveProperty("referencias");
    expect(payload).toHaveProperty("trabajador");
  });

  it("resuelve tipo_documento a nombre completo (CC → CÉDULA DE CIUDADANÍA)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const solicitante = payload.solicitante as Record<string, unknown>;
    expect(solicitante.tipo_documento).toBe("CÉDULA DE CIUDADANÍA");
  });

  it("resuelve tipo_contrato a detalle (02 → TÉRMINO INDEFINIDO)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      mockSolicitud.solicitud_payload[0].informacion_laboral as Record<string, unknown>,
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const laboral = payload.laboral as Record<string, unknown>;
    expect(laboral.tipo_contrato).toBe("TÉRMINO INDEFINIDO");
  });

  it("resuelve sexo a nombre completo (M → MASCULINO)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const solicitante = payload.solicitante as Record<string, unknown>;
    expect(solicitante.sexo).toBe("MASCULINO");
  });

  it("resuelve nivel_educativo (02 → SECUNDARIA)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const solicitante = payload.solicitante as Record<string, unknown>;
    expect(solicitante.nivel_educativo).toBe("SECUNDARIA");
  });

  it("resuelve ciudad_residencia (001 → FLORENCIA)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const solicitante = payload.solicitante as Record<string, unknown>;
    expect(solicitante.ciudad_residencia).toBe("FLORENCIA");
  });

  it("resuelve cargo a nombre (001 → INGENIERO DE SISTEMAS)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const laboral = payload.laboral as Record<string, unknown>;
    const trabajador = (payload.trabajador as Record<string, unknown>);
    expect(laboral.cargo).toBe("INGENIERO DE SISTEMAS");
    expect(trabajador.cargo).toBe("INGENIERO DE SISTEMAS");
  });

  it("incluye firmantes mapeados correctamente", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const firmantes = payload.firmantes as Record<string, unknown>[];
    expect(firmantes).toHaveLength(1);
    expect(firmantes[0].nombre_completo).toBe("MARÍA LÓPEZ");
    expect(firmantes[0].numero_documento).toBe("87654321");
  });

  it("incluye referencias familiares y personales", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      {
        familiares: mockSolicitud.solicitud_payload[0].referencias.familiares as unknown[],
        personales: mockSolicitud.solicitud_payload[0].referencias.personales as unknown[]
      }
    ) as Record<string, unknown>;

    const refs = payload.referencias as { familiares: unknown[]; personales: unknown[] };
    expect(refs.familiares).toHaveLength(1);
    expect(refs.personales).toHaveLength(1);
  });

  it("incluye deuda desde payload", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [{ acreedor: "BANCOLOMBIA", valor: 5_000_000 }],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const deudas = payload.deudas as Record<string, unknown>[];
    expect(deudas).toHaveLength(1);
    expect(deudas[0].acreedor).toBe("BANCOLOMBIA");
  });

  it("calcula valor_solicitud formateado a 2 decimales", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const solicitud = payload.solicitud as Record<string, unknown>;
    expect(solicitud.valor_solicitud).toBe("5000000.00");
  });

  it("usa fallback cuando no hay catalogos (retorna código original)", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      null,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const solicitante = payload.solicitante as Record<string, unknown>;
    expect(solicitante.tipo_documento).toBe("CC"); // fallback al código original
    expect(solicitante.ciudad_residencia).toBe("001");
  });

  it("construye sección trabajador con nombres separados", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const trab = payload.trabajador as Record<string, unknown>;
    expect(trab.primer_nombre).toBe("JUAN");
    expect(trab.segundo_nombre).toBe("CARLOS");
    expect(trab.primer_apellido).toBe("PÉREZ");
    expect(trab.segundo_apellido).toBe("GÓMEZ");
  });

  it("incluye metadata del PDF con versión 2.0", () => {
    const service = pdfPayloadService();
    const payload = service.buildPayload(
      mockSolicitud as never,
      mockCatalogos,
      {},
      {},
      {},
      [],
      [],
      { familiares: [], personales: [] }
    ) as Record<string, unknown>;

    const meta = payload.pdf_metadata as Record<string, unknown>;
    expect(meta.version).toBe("2.0");
    expect(meta.solicitud_id).toBe("SOL-2025-001");
  });
});