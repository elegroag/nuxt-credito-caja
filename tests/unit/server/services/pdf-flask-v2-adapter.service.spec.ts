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
        nombre_pagador: "GUILLERMO ALFONSO PERDOMO ROJAS"
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
    expect(solicitante.fecha_vinculacion).toBe("2020-03-15");
    expect(solicitante.ciudad_residencia).toBe("FLORENCIA");
    expect(solicitante.email).toBe("maxedwwin@gmail.com");

    expect(solicitud.rol_en_solicitud).toBe("solicitante");
    expect(solicitud.producto_tipo).toBe("13");
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
        }
      },
      catalogosMinimos
    );
    const solicitante = out.solicitante as Record<string, unknown>;
    const solicitud = out.solicitud as Record<string, unknown>;

    expect(solicitante.sexo).toBe("F");
    expect(solicitante.tipo_documento).toBe("CC");
    expect(solicitante.nivel_educativo).toBe("universitario");
    expect(solicitante.tipo_vivienda).toBe("arrendada");
    expect(solicitante.fecha_vinculacion).toBe("2019-01-01");
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
