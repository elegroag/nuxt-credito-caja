import type { KiaiCreateProcessRequest, KiaiProcessStatus, KiaiSigner } from "../api-kiai";

export const KIAI_PROVEEDOR = "KIAI";
export const KIAI_DEADLINE_DAYS = 7;

export interface FirmanteKiaiInput {
  orden: number
  tipo: string
  nombre_completo: string
  numero_documento: string
  email: string
  telefono?: string | null
  codigo_pais?: string | null
}

// Códigos de tipo de documento de SISU; los no listados se envían sin identificationTypeCode.
const TIPO_DOCUMENTO_KIAI: Record<string, string> = {
  1: "CC",
  3: "NIT",
  4: "CE",
  6: "PA",
  8: "PEP",
  14: "PPT"
};

/** nombre_completo se arma como "nombres apellidos": con 4+ palabras los dos primeros son nombres. */
export const dividirNombre = (nombreCompleto: string): { firstName: string, lastName: string } => {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { firstName: "", lastName: "" };
  if (partes.length === 1) return { firstName: partes[0]!, lastName: partes[0]! };
  const nNombres = partes.length >= 4 ? 2 : 1;
  return {
    firstName: partes.slice(0, nNombres).join(" "),
    lastName: partes.slice(nNombres).join(" ")
  };
};

export const mapTipoDocumentoKiai = (tipo: string | null | undefined): string | undefined => {
  if (!tipo) return undefined;
  return TIPO_DOCUMENTO_KIAI[String(tipo).trim()];
};

export const mapTelefonoKiai = (
  telefono: string | null | undefined,
  codigoPais: string | null | undefined
): { phoneIndicative?: string, phoneNumber?: string } => {
  const pais = String(codigoPais || "57").replace(/\D/g, "") || "57";
  let numero = String(telefono || "").replace(/\D/g, "");
  if (numero.length > 10 && numero.startsWith(pais)) {
    numero = numero.slice(pais.length);
  }
  if (numero.length < 7) return {};
  return { phoneIndicative: `+${pais}`, phoneNumber: numero };
};

export const construirFirmantesKiai = (firmantes: FirmanteKiaiInput[]): KiaiSigner[] =>
  [...firmantes]
    .sort((a, b) => a.orden - b.orden)
    .map((f, index) => {
      const signer: KiaiSigner = {
        ...dividirNombre(f.nombre_completo),
        email: f.email.trim(),
        signingOrder: index + 1,
        identificationNumber: String(f.numero_documento).trim(),
        ...mapTelefonoKiai(f.telefono, f.codigo_pais)
      };
      const tipo = mapTipoDocumentoKiai(f.tipo);
      if (tipo) signer.identificationTypeCode = tipo;
      return signer;
    });

export const construirProcesoKiai = (params: {
  numeroSolicitud: string
  firmantes: FirmanteKiaiInput[]
  documentoBase64: string
  filename?: string | null
}): KiaiCreateProcessRequest => ({
  processName: `Solicitud de crédito ${params.numeroSolicitud}`,
  processDescription: `Firma de la solicitud de crédito ${params.numeroSolicitud} - Comfaca`,
  signatureMethod: "CLICK",
  authenticationMethodCode: "OTP_EMAIL",
  isSequential: true,
  deadlineDays: KIAI_DEADLINE_DAYS,
  isSendByEmail: true,
  externalReference: params.numeroSolicitud,
  base64Document: params.documentoBase64,
  documentFileName: params.filename || `Solicitud_${params.numeroSolicitud}.pdf`,
  signers: construirFirmantesKiai(params.firmantes)
});

export interface ProcesoFirmaRegistro {
  proceso_id: string
  proveedor: string
  estado: string
  simulado: boolean
  created_at: Date | null
  expira_en: Date | null
  completado_en: Date | null
  ultima_consulta: Date | null
  respuesta: unknown
}

export interface ProcesoFirmadoResumen {
  transaccion_id: string
  proveedor: string
  estado: string
  simulado: boolean
  fecha_inicio: string | null
  expira_en: string | null
  fecha_completado: string | null
  ultima_consulta: string | null
  firmantes_completados: number
  firmantes_pendientes: number
}

/** El avance sale de respuesta.signers[].status (detalle de KIAI); la respuesta de creación no trae status. */
export const resumirProcesoFirma = (
  proceso: ProcesoFirmaRegistro,
  totalFirmantes: number
): ProcesoFirmadoResumen => {
  const respuesta = (proceso.respuesta ?? {}) as { signers?: Array<{ status?: string }> };
  const signers = Array.isArray(respuesta.signers) ? respuesta.signers : [];
  const total = signers.length || totalFirmantes;
  const completados = signers.filter((s) => s.status === "SIGNED").length;

  return {
    transaccion_id: proceso.proceso_id,
    proveedor: proceso.proveedor,
    estado: proceso.estado,
    simulado: proceso.simulado,
    fecha_inicio: proceso.created_at?.toISOString() ?? null,
    expira_en: proceso.expira_en?.toISOString() ?? null,
    fecha_completado: proceso.completado_en?.toISOString() ?? null,
    ultima_consulta: proceso.ultima_consulta?.toISOString() ?? null,
    firmantes_completados: completados,
    firmantes_pendientes: Math.max(total - completados, 0)
  };
};

/** Estado de la solicitud al que lleva un estado final de KIAI; null si el proceso sigue abierto. */
export const mapEstadoSolicitud = (
  status: KiaiProcessStatus | string
): { estado: string, detalle: string } | null => {
  switch (status) {
    case "COMPLETED":
      return { estado: "FIRMADO", detalle: "Todos los firmantes firmaron el documento en KIAI." };
    case "DECLINED":
      return { estado: "RECHAZADA", detalle: "Un firmante rechazó la firma del documento en KIAI." };
    case "CANCELLED":
      return { estado: "APROBADA", detalle: "El proceso de firma fue cancelado en KIAI; puede reenviarse a firma." };
    case "EXPIRED":
      return { estado: "APROBADA", detalle: "El proceso de firma venció en KIAI sin completarse; puede reenviarse a firma." };
    default:
      return null;
  }
};
