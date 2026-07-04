import { beforeEach, describe, expect, it, vi } from "vitest";
import solicitantesReporteService, {
  mapSolicitanteReporteRow
} from "~~/server/services/reports/solicitantes-reporte.service";

const findManyMock = vi.hoisted(() => vi.fn());

vi.mock("~~/lib/prisma", () => ({
  default: {
    solicitud_solicitante: {
      findMany: findManyMock
    }
  },
  Prisma: {}
}));

const createRecord = (overrides: Record<string, unknown> = {}) => ({
  solicitud_id: "000001-202603-01",
  tipo_persona: "natural",
  tipo_documento: "CC",
  numero_documento: "123456789",
  nombres: "Juan",
  apellidos: "Pérez",
  fecha_nacimiento: new Date("1990-01-01T00:00:00.000Z"),
  fecha_expedicion: new Date("2008-01-01T00:00:00.000Z"),
  genero: "M",
  estado_civil: "Soltero",
  nivel_educativo: "Universitario",
  profesion: "Ingeniero",
  email: "juan@example.com",
  telefono_fijo: "6081234567",
  telefono_movil: "3001234567",
  direccion: "Calle 1 # 2-3",
  barrio: "Centro",
  ciudad: "Florencia",
  departamento: "Caquetá",
  salario: { toNumber: () => 2500000 },
  antiguedad_meses: 36,
  tipo_contrato: "Indefinido",
  sector_economico: "Servicios",
  solicitudes_credito: {
    numero_solicitud: "000001-202603-01",
    fecha_radicado: new Date("2026-03-18T00:00:00.000Z"),
    estado: "Postulado"
  },
  ...overrides
});

describe("mapSolicitanteReporteRow", () => {
  it("mapea el registro Prisma al formato del reporte", () => {
    const row = mapSolicitanteReporteRow(createRecord());

    expect(row.numero_solicitud).toBe("000001-202603-01");
    expect(row.numero_documento).toBe("123456789");
    expect(row.salario).toBe(2500000);
    expect(row.fecha_radicado).toBe("2026-03-18T00:00:00.000Z");
    expect(row.empresa_sector).toBe("Servicios");
  });
});

describe("solicitantesReporteService.obtenerSolicitantesReporte", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("consulta con filtros básicos y deduplica por documento", async () => {
    findManyMock.mockResolvedValue([
      createRecord(),
      createRecord({
        solicitud_id: "000002-202603-01",
        solicitudes_credito: {
          numero_solicitud: "000002-202603-01",
          fecha_radicado: new Date("2026-03-19T00:00:00.000Z"),
          estado: "Aprobado"
        }
      })
    ]);

    const service = solicitantesReporteService();
    const rows = await service.obtenerSolicitantesReporte({
      fecha_desde: "2026-03-01",
      fecha_hasta: "2026-03-31",
      tipo_documento: "CC",
      estado_solicitud: "Postulado"
    });

    expect(rows).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5000,
        where: expect.objectContaining({
          tipo_documento: "CC",
          solicitudes_credito: {
            is: expect.objectContaining({
              estado: "Postulado",
              fecha_radicado: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date)
              })
            })
          }
        })
      })
    );
  });
});
