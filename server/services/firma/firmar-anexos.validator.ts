import { ANEXO_MAX_BYTES, TIPOS_ANEXO } from "~~/shared/types/firmar-anexos";
import type { TipoAnexo } from "~~/shared/types/firmar-anexos";

export interface ArchivoAnexo {
  filename?: string
  type?: string
  data: Buffer
}

export type ValidacionAnexo =
  | { ok: true, tipo: TipoAnexo }
  | { ok: false, message: string };

const PDF_MAGIC = Buffer.from("%PDF-");

export const esTipoAnexo = (valor: unknown): valor is TipoAnexo =>
  typeof valor === "string" && (TIPOS_ANEXO as readonly string[]).includes(valor);

export const validarAnexo = (tipo: unknown, archivo?: ArchivoAnexo | null): ValidacionAnexo => {
  if (!esTipoAnexo(tipo)) {
    return { ok: false, message: `Tipo de anexo inválido. Valores permitidos: ${TIPOS_ANEXO.join(", ")}` };
  }
  if (!archivo?.data?.length) {
    return { ok: false, message: "No se recibió el archivo del anexo" };
  }
  if (archivo.data.length > ANEXO_MAX_BYTES) {
    return { ok: false, message: `El anexo supera el tamaño máximo de ${ANEXO_MAX_BYTES / (1024 * 1024)} MB` };
  }
  if (archivo.type && archivo.type !== "application/pdf") {
    return { ok: false, message: "Solo se permiten archivos PDF" };
  }
  if (!archivo.data.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return { ok: false, message: "El archivo no es un PDF válido" };
  }
  return { ok: true, tipo };
};
