/**
 * firmar-anexos.validator.spec.ts
 *
 * Tests de la validación de anexos PDF que el asesor envía a firmar.
 */

import { describe, it, expect } from "vitest";
import { esTipoAnexo, validarAnexo } from "~~/server/services/firma/firmar-anexos.validator";
import { ANEXO_MAX_BYTES } from "~~/shared/types/firmar-anexos";

const pdf = (extra = "contenido") => Buffer.from(`%PDF-1.7\n${extra}`);

describe("esTipoAnexo", () => {
  it("acepta los tipos del catálogo", () => {
    expect(esTipoAnexo("PAGARE")).toBe(true);
    expect(esTipoAnexo("CARTA_INSTRUCCIONES")).toBe(true);
    expect(esTipoAnexo("OFICIO")).toBe(true);
    expect(esTipoAnexo("OTRO")).toBe(true);
  });

  it("rechaza valores fuera del catálogo", () => {
    expect(esTipoAnexo("pagare")).toBe(false);
    expect(esTipoAnexo("")).toBe(false);
    expect(esTipoAnexo(undefined)).toBe(false);
  });
});

describe("validarAnexo", () => {
  it("acepta un PDF válido", () => {
    const r = validarAnexo("PAGARE", { filename: "pagare.pdf", type: "application/pdf", data: pdf() });
    expect(r).toEqual({ ok: true, tipo: "PAGARE" });
  });

  it("rechaza un tipo inválido", () => {
    const r = validarAnexo("CONTRATO", { filename: "a.pdf", type: "application/pdf", data: pdf() });
    expect(r.ok).toBe(false);
  });

  it("rechaza si no hay archivo o está vacío", () => {
    expect(validarAnexo("OFICIO", null).ok).toBe(false);
    expect(validarAnexo("OFICIO", { filename: "a.pdf", data: Buffer.alloc(0) }).ok).toBe(false);
  });

  it("rechaza archivos que superan el tamaño máximo", () => {
    const data = Buffer.concat([pdf(), Buffer.alloc(ANEXO_MAX_BYTES)]);
    const r = validarAnexo("OTRO", { filename: "grande.pdf", type: "application/pdf", data });
    expect(r).toMatchObject({ ok: false, message: expect.stringContaining("10 MB") });
  });

  it("rechaza un mime distinto de PDF", () => {
    const r = validarAnexo("OTRO", { filename: "a.pdf", type: "image/png", data: pdf() });
    expect(r).toMatchObject({ ok: false, message: "Solo se permiten archivos PDF" });
  });

  it("rechaza contenido que no es PDF aunque la extensión lo sea", () => {
    const r = validarAnexo("OTRO", { filename: "falso.pdf", type: "application/pdf", data: Buffer.from("hola") });
    expect(r).toMatchObject({ ok: false, message: "El archivo no es un PDF válido" });
  });
});
