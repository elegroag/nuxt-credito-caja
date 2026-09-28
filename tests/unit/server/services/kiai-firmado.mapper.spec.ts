/**
 * kiai-firmado.mapper.spec.ts
 *
 * Tests de la traducción de firmantes y estados entre la app y KIAI.
 */

import { describe, it, expect } from "vitest";
import {
  construirProcesoKiai,
  dividirNombre,
  mapEstadoSolicitud,
  mapTelefonoKiai,
  mapTipoDocumentoKiai,
  resumirProcesoFirma
} from "~~/server/services/firma/kiai-firmado.mapper";

describe("dividirNombre", () => {
  it("con 4 palabras toma dos nombres y dos apellidos", () => {
    expect(dividirNombre("JUAN CARLOS PEREZ GOMEZ")).toEqual({ firstName: "JUAN CARLOS", lastName: "PEREZ GOMEZ" });
  });

  it("con 3 palabras toma un nombre y dos apellidos", () => {
    expect(dividirNombre("ANA TORRES LOPEZ")).toEqual({ firstName: "ANA", lastName: "TORRES LOPEZ" });
  });

  it("con 2 palabras toma un nombre y un apellido", () => {
    expect(dividirNombre("  Ana   Torres ")).toEqual({ firstName: "Ana", lastName: "Torres" });
  });

  it("con 1 palabra la repite como apellido", () => {
    expect(dividirNombre("ANA")).toEqual({ firstName: "ANA", lastName: "ANA" });
  });
});

describe("mapTipoDocumentoKiai", () => {
  it("traduce los códigos SISU conocidos", () => {
    expect(mapTipoDocumentoKiai("1")).toBe("CC");
    expect(mapTipoDocumentoKiai("4")).toBe("CE");
    expect(mapTipoDocumentoKiai("14")).toBe("PPT");
  });

  it("devuelve undefined para códigos no listados", () => {
    expect(mapTipoDocumentoKiai("12")).toBeUndefined();
    expect(mapTipoDocumentoKiai(null)).toBeUndefined();
  });
});

describe("mapTelefonoKiai", () => {
  it("separa el indicativo del celular", () => {
    expect(mapTelefonoKiai("3001234567", "57")).toEqual({ phoneIndicative: "+57", phoneNumber: "3001234567" });
  });

  it("quita el indicativo si viene concatenado", () => {
    expect(mapTelefonoKiai("573001234567", "57")).toEqual({ phoneIndicative: "+57", phoneNumber: "3001234567" });
  });

  it("omite teléfonos vacíos o incompletos", () => {
    expect(mapTelefonoKiai(null, "57")).toEqual({});
    expect(mapTelefonoKiai("123", "57")).toEqual({});
  });
});

describe("construirProcesoKiai", () => {
  const payload = construirProcesoKiai({
    numeroSolicitud: "000010-2026-13",
    documentoBase64: "JVBERi0=",
    filename: "solicitud.pdf",
    firmantes: [
      { orden: 2, tipo: "1", nombre_completo: "MARIA TORRES", numero_documento: "222", email: "maria@test.co", telefono: null, codigo_pais: "57" },
      { orden: 1, tipo: "1", nombre_completo: "JUAN CARLOS PEREZ GOMEZ", numero_documento: "111", email: " juan@test.co ", telefono: "3001234567", codigo_pais: "57" }
    ]
  });

  it("aplica los parámetros de negocio acordados", () => {
    expect(payload).toMatchObject({
      signatureMethod: "CLICK",
      authenticationMethodCode: "OTP_EMAIL",
      isSequential: true,
      deadlineDays: 7,
      isSendByEmail: true,
      externalReference: "000010-2026-13",
      base64Document: "JVBERi0=",
      documentFileName: "solicitud.pdf"
    });
  });

  it("ordena los firmantes por orden y numera signingOrder desde 1", () => {
    expect(payload.signers).toEqual([
      {
        firstName: "JUAN CARLOS",
        lastName: "PEREZ GOMEZ",
        email: "juan@test.co",
        signingOrder: 1,
        identificationNumber: "111",
        identificationTypeCode: "CC",
        phoneIndicative: "+57",
        phoneNumber: "3001234567"
      },
      {
        firstName: "MARIA",
        lastName: "TORRES",
        email: "maria@test.co",
        signingOrder: 2,
        identificationNumber: "222",
        identificationTypeCode: "CC"
      }
    ]);
  });
});

describe("resumirProcesoFirma", () => {
  const base = {
    proceso_id: "p-1",
    proveedor: "KIAI",
    estado: "IN_PROGRESS",
    simulado: false,
    created_at: new Date("2026-09-28T21:00:33.000Z"),
    expira_en: new Date("2026-10-05T21:00:33.000Z"),
    completado_en: null,
    ultima_consulta: null
  };

  it("cuenta firmantes completados desde el detalle de KIAI", () => {
    const resumen = resumirProcesoFirma({
      ...base,
      respuesta: { signers: [{ status: "SIGNED" }, { status: "PENDING" }, { status: "PENDING" }] }
    }, 2);

    expect(resumen).toEqual({
      transaccion_id: "p-1",
      proveedor: "KIAI",
      estado: "IN_PROGRESS",
      simulado: false,
      fecha_inicio: "2026-09-28T21:00:33.000Z",
      expira_en: "2026-10-05T21:00:33.000Z",
      fecha_completado: null,
      ultima_consulta: null,
      firmantes_completados: 1,
      firmantes_pendientes: 2
    });
  });

  it("sin status en la respuesta usa el total de firmantes de la solicitud como pendientes", () => {
    const resumen = resumirProcesoFirma({
      ...base,
      simulado: true,
      respuesta: { id: "p-1", status: "IN_PROGRESS" }
    }, 2);

    expect(resumen.firmantes_completados).toBe(0);
    expect(resumen.firmantes_pendientes).toBe(2);
    expect(resumen.simulado).toBe(true);
  });
});

describe("mapEstadoSolicitud", () => {
  it("traduce los estados finales de KIAI", () => {
    expect(mapEstadoSolicitud("COMPLETED")?.estado).toBe("FIRMADO");
    expect(mapEstadoSolicitud("DECLINED")?.estado).toBe("RECHAZADA");
    expect(mapEstadoSolicitud("CANCELLED")?.estado).toBe("CANCELADA");
    expect(mapEstadoSolicitud("EXPIRED")?.estado).toBe("APROBADA");
  });

  it("devuelve null para procesos abiertos", () => {
    expect(mapEstadoSolicitud("IN_PROGRESS")).toBeNull();
    expect(mapEstadoSolicitud("DRAFT")).toBeNull();
    expect(mapEstadoSolicitud("PENDING")).toBeNull();
  });
});
