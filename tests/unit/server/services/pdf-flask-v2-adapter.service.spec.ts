/**
 * pdf-flask-v2-adapter.service.spec.ts
 *
 * Verifica mapeos al contrato templates_creditos_v2.
 */

import { describe, it, expect } from "vitest";
import { adaptPayloadForFlaskV2 } from "~~/server/services/pdf/pdf-flask-v2-adapter.service";
import type { ParametrosCatalogos } from "~~/server/services/shared/parametros-resolver.service";

const catalogosMinimos = {
  ciudades: [],
  paises: [],
  ocupaciones: [],
  sectores_economicos: [],
  codigos_tipo_documento: [
    { coddoc: "1", detdoc: "CEDULA DE CIUDADANIA", codrua: "CC", coddoc_circular: "1" },
    { coddoc: "2", detdoc: "CEDULA EXTRANJERIA", codrua: "CE", coddoc_circular: "2" }
  ],
  tipo_vivienda: [],
  tipo_contrato: [],
  nivel_educativos: [],
  sexos: [],
  estado_civiles: []
} as unknown as ParametrosCatalogos;

describe("adaptPayloadForFlaskV2", () => {
  it("mapea labels/códigos reales al contrato v2 de checkboxes", () => {
    const payload = {
      solicitud: {
        rol_en_solicitud: "T",
        producto_tipo: "13",
        ha_tenido_credito_comfaca: false
      },
      solicitante: {
        fecha_vinculacion: "",
        tipo_documento: "CEDULA DE CIUDADANIA",
        sexo: "MASCULINO",
        nivel_educativo: "UNIVERSITARIO",
        tipo_vivienda: "ARRENDADA",
        telefono_fijo: null,
        telefono_movil: null,
        ciudad_residencia: "FLORENCIA",
        email: "maxedwwin@gmail.com",
        nombre_completo: "EDWIN ANDRES LEGRO AGUDELO"
      },
      laboral: {
        nombre_pagador: "GUILLERMO ALFONSO PERDOMO ROJAS",
        fecha_ingreso: "2026-01-13"
      },
      ingresos: {
        total_neto_recibido: 4656079
      },
      descuentos: {
        total_descuentos: 383216
      },
      economica: {
        otros: 0,
        descripcion: "",
        gastos_descripcion: ""
      },
      trabajador: {
        fecha_afiliacion: "2020-03-15",
        sexo: "MASCULINO",
        tipo_documento: "CEDULA DE CIUDADANIA",
        nivel_educativo: "UNIVERSITARIO"
      }
    };

    const out = adaptPayloadForFlaskV2(payload, catalogosMinimos);
    const solicitante = out.solicitante as Record<string, unknown>;
    const solicitud = out.solicitud as Record<string, unknown>;
    const laboral = out.laboral as Record<string, unknown>;
    const ingresos = out.ingresos as Record<string, unknown>;
    const descuentos = out.descuentos as Record<string, unknown>;
    const economica = out.economica as Record<string, unknown>;
    const trabajador = out.trabajador as Record<string, unknown>;

    expect(solicitante.sexo).toBe("M");
    expect(solicitante.tipo_documento).toBe("CC");
    expect(solicitante.nivel_educativo).toBe("universitario");
    expect(solicitante.tipo_vivienda).toBe("arrendada");
    expect(solicitante.telefono_fijo).toBe("");
    expect(solicitante.telefono_movil).toBe("");
    expect(solicitante.fecha_vinculacion).toBe("2026-01-13");
    expect(solicitante.ciudad_residencia).toBe("FLORENCIA");
    expect(solicitante.email).toBe("maxedwwin@gmail.com");

    expect(solicitud.rol_en_solicitud).toBe("solicitante");
    expect(solicitud.producto_tipo).toBe("E");
    expect(solicitud.ha_tenido_credito_comfaca).toBe(false);

    expect(laboral.nombramiento_o_pagador).toBe("GUILLERMO ALFONSO PERDOMO ROJAS");
    expect(ingresos.total_neto).toBe(4656079);
    expect(descuentos.total_gastos).toBe(383216);
    expect(economica.otros_ingresos).toBe(0);
    expect(economica.descripcion_ingresos).toBe("");
    expect(economica.descripcion_gastos).toBe("");

    expect(trabajador.sexo).toBe("M");
    expect(trabajador.tipo_documento).toBe("CC");
    expect(trabajador.nivel_educativo).toBe("universitario");
  });

  it("mapea códigos SISU: sexo M/F, doc 1→CC, nivedu 11, vivienda A, rol C", () => {
    const out = adaptPayloadForFlaskV2(
      {
        solicitud: { rol_en_solicitud: "C" },
        solicitante: {
          sexo: "F",
          tipo_documento: "1",
          nivel_educativo: "11",
          tipo_vivienda: "A",
          fecha_vinculacion: "2019-01-01"
        },
        laboral: { fecha_ingreso: "2018-05-02" }
      },
      catalogosMinimos
    );
    const solicitante = out.solicitante as Record<string, unknown>;
    const solicitud = out.solicitud as Record<string, unknown>;

    expect(solicitante.sexo).toBe("F");
    expect(solicitante.tipo_documento).toBe("CC");
    expect(solicitante.nivel_educativo).toBe("universitario");
    expect(solicitante.tipo_vivienda).toBe("arrendada");
    expect(solicitante.fecha_vinculacion).toBe("2018-05-02");
    expect(solicitud.rol_en_solicitud).toBe("codeudor");
  });

  it("mapea vivienda P/F y niveles por código/slug", () => {
    expect(
      (adaptPayloadForFlaskV2({
        solicitante: { tipo_vivienda: "P", nivel_educativo: "10" }
      }).solicitante as Dict).tipo_vivienda
    ).toBe("propia");
    expect(
      (adaptPayloadForFlaskV2({
        solicitante: { tipo_vivienda: "F", nivel_educativo: "primaria" }
      }).solicitante as Dict).tipo_vivienda
    ).toBe("familiar");
    expect(
      (adaptPayloadForFlaskV2({
        solicitante: { nivel_educativo: "12" }
      }).solicitante as Dict).nivel_educativo
    ).toBe("posgrado");
  });

  it("normaliza fechas a YYYY-MM-DD y deriva laboral.mes/anio", () => {
    const out = adaptPayloadForFlaskV2({
      solicitante: {
        fecha_vinculacion: "2020-03-15T00:00:00.000Z",
        fecha_expedicion_documento: "2008-06-01",
        fecha_nacimiento: "1989-12-19"
      },
      laboral: {
        fecha_ingreso: "2026-01-13"
      },
      solicitud: {
        fecha_radicado: "2026-09-23T00:00:00.000Z"
      },
      pdf_metadata: {
        fecha_generacion: "23/9/2026, 6:00:26 p. m."
      }
    });
    const solicitante = out.solicitante as Dict;
    const laboral = out.laboral as Dict;
    const solicitud = out.solicitud as Dict;
    const meta = out.pdf_metadata as Dict;

    expect(solicitante.fecha_vinculacion).toBe("2026-01-13");
    expect(solicitante.fecha_expedicion_documento).toBe("2008-06-01");
    expect(solicitante.fecha_nacimiento).toBe("1989-12-19");
    expect(laboral.fecha_ingreso).toBe("2026-01-13");
    expect(laboral.mes).toBe("01");
    expect(laboral.anio).toBe("2026");
    expect(solicitud.fecha_radicado).toBe("2026-09-23");
    expect(meta.fecha_generacion).toBe("2026-09-23");
  });

  it("deja fecha_vinculacion vacía si no hay laboral.fecha_ingreso", () => {
    const out = adaptPayloadForFlaskV2({
      solicitante: { fecha_vinculacion: "2019-01-01" },
      trabajador: { fecha_afiliacion: "2020-03-15" }
    });
    expect((out.solicitante as Dict).fecha_vinculacion).toBe("");
  });

  it("mapea producto_tipo (tipcre) a opción A-E", () => {
    const producto = (tipcre: unknown) =>
      (adaptPayloadForFlaskV2({ solicitud: { producto_tipo: tipcre } }).solicitud as Dict)
        .producto_tipo;

    expect(producto("02")).toBe("A");
    expect(producto("014")).toBe("B");
    expect(producto("06")).toBe("C");
    expect(producto("01")).toBe("D");
    expect(producto("13")).toBe("E");
    expect(producto("e")).toBe("E");
    expect(producto("10")).toBe("10");
    expect(producto(null)).toBe("");
  });

  it("mapea tipo_documento del codeudor a CC/CE", () => {
    const out = adaptPayloadForFlaskV2(
      { codeudor: { tipo_documento: "1", numero_documento: "11223344" } },
      catalogosMinimos
    );
    expect((out.codeudor as Dict).tipo_documento).toBe("CC");
    expect((out.codeudor as Dict).numero_documento).toBe("11223344");
  });

  it("no muta el payload original", () => {
    const payload = {
      solicitante: { sexo: "MASCULINO", tipo_documento: "1" }
    };
    adaptPayloadForFlaskV2(payload, catalogosMinimos);
    expect(payload.solicitante.sexo).toBe("MASCULINO");
    expect(payload.solicitante.tipo_documento).toBe("1");
  });
});

type Dict = Record<string, unknown>;
