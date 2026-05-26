import prisma from "~~/lib/prisma";
import apiFirmaPlus from "../api-firmaplus";
import documentoStorage from "../storage/documento-storage.service";
import { loggerService } from "~~/server/utils/logger.service";
import { useRuntimeConfig } from "#imports";

const Log = loggerService();

interface FirmanteData {
  orden: number
  tipo: string
  nombre_completo: string
  numero_documento: string
  email: string
  rol: string
  telefono?: string | null
  codigo_pais?: string | null
}

interface IniciarFirmadoParams {
  solicitudId: string
}

interface IniciarFirmadoResult {
  success: boolean
  message: string
  data?: {
    transaccion_id: string
    estado: string
    urls_firma?: Record<string, string>
  }
}

const formatPhoneForFirmaPlus = (phone: string | number | null | undefined, codigoPais: string | null | undefined): string => {
  if (!phone) return "";
  const str = String(phone).replace(/\D/g, "");
  const pais = codigoPais || "57";
  if (str.length === 10 && str.startsWith("3")) {
    return pais + str;
  }
  if (str.length === 9 && str.startsWith("3")) {
    return pais + str;
  }
  return str;
};

interface FirmaPlusSignerRequest {
  Usuario: string
  Clave: string
  Nota: string
  Firmantes: FirmaPlusFirmante[]
  ArchivosPDF: FirmaPlusArchivo[]
  ArchivosAdjuntos: FirmaPlusArchivo[]
}

interface FirmaPlusFirmante {
  Identificacion: string
  TipoIdentificacion: string
  Nombre: string
  Correo: string
  NroCelular: string
  Foto: string
  FotoObligatoria: string
  SolicitarAdjunto: string
  ReconocimientoFacial: string
}

interface FirmaPlusArchivo {
  Nombre: string
  Documento_base64: string
}

interface FirmaPlusSignerResponse {
  Code: string
  Data?: {
    NroSolicitud?: string
    Fecha?: string
    Link?: string
  }
  Message?: string
}

class ProcesoFirmadoAdm {
  /**
   * Inicia el proceso de firmado para una solicitud
   */
  async iniciarFirmado(
    params: IniciarFirmadoParams
  ): Promise<IniciarFirmadoResult> {
    try {
      const { solicitudId } = params;

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Iniciando proceso", { solicitudId });

      const config = useRuntimeConfig();
      const usuario = config.apiFIRMA.basic_user as string;
      const clave = config.apiFIRMA.basic_password as string;

      // 1. Consultar la solicitud con firmantes y PDF generado
      const solicitud = await prisma.solicitudes_credito.findUnique({
        where: { numero_solicitud: solicitudId },
        include: {
          firmantes_solicitud: {
            orderBy: { orden: "asc" }
          },
          pdfs_generados: true
        }
      });

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Solicitud consultada", { solicitudId, found: !!solicitud });

      if (!solicitud) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: Solicitud no encontrada", { solicitudId });
        return {
          success: false,
          message: "Solicitud no encontrada"
        };
      }

      // 2. Validar que la solicitud tenga firmantes
      if (
        !solicitud.firmantes_solicitud
        || solicitud.firmantes_solicitud.length === 0
      ) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: Sin firmantes en solicitud", { solicitudId });
        return {
          success: false,
          message: "La solicitud no tiene firmantes asociados"
        };
      }

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Firmantes encontrados", { solicitudId, count: solicitud.firmantes_solicitud.length });

      // 3. Validar que la solicitud tenga PDF generado (tabla pdfs_generados)
      if (!solicitud.pdfs_generados) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: Sin PDF generado en tabla pdfs_generados", { solicitudId });
        return {
          success: false,
          message: "La solicitud no tiene PDF generado"
        };
      }

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: PDF encontrado", { solicitudId, pdfId: solicitud.pdfs_generados.id });

      // 4. Obtener el documento del storage usando la información de pdfs_generados
      const documento = await documentoStorage.obtenerContenidoDesdePdfGenerado(
        solicitud.pdfs_generados as unknown as PdfGenerado
      );
      if (!documento) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: No se pudo obtener PDF del storage", { solicitudId });
        return {
          success: false,
          message: "No se pudo obtener el documento PDF del storage"
        };
      }

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Documento obtenido del storage", { solicitudId, docLength: documento?.length });

      // 5. Construir payload para FirmaPlus endpoint /signer
      const payload = this.construirPayloadFirmaPlus(
        solicitud.numero_solicitud,
        usuario,
        clave,
        solicitud.firmantes_solicitud,
        documento,
        solicitud.pdfs_generados.filename
      );

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Payload construido", { solicitudId, payloadKeys: Object.keys(payload) });

      // 6. Llamar al servicio de FirmaPlus endpoint /signer
      const api = apiFirmaPlus();
      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Llamando a FirmaPlus API", { solicitudId, endpoint: "signer" });
      const respuesta = await api.postJson<FirmaPlusSignerResponse>(
        "signer",
        payload as unknown as Record<string, unknown>,
        {
          auth: true
        }
      );

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Respuesta FirmaPlus", { solicitudId, code: respuesta.Code, message: respuesta.Message });

      if (respuesta.Code !== "1") {
        Log.error("ProcesoFirmadoAdm.iniciarFirmado: Error de FirmaPlus", { solicitudId, code: respuesta.Code, message: respuesta.Message });
        return {
          success: false,
          message: respuesta.Message || "Error al iniciar solicitud de firmado"
        };
      }

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Proceso completado exitosamente", {
        solicitudId,
        nroSolicitud: respuesta.Data?.NroSolicitud,
        link: respuesta.Data?.Link
      });

      return {
        success: true,
        message: "Proceso de firmado iniciado exitosamente",
        data: {
          transaccion_id: respuesta.Data?.NroSolicitud || solicitud.numero_solicitud,
          estado: "PENDIENTE_FIRMADO",
          urls_firma: respuesta.Data?.Link ? { default: respuesta.Data.Link } : undefined
        }
      };
    } catch (error: unknown) {
      const err = error as Error;
      Log.error("ProcesoFirmadoAdm.iniciarFirmado: Error catch", { error: err?.message || "Unknown", stack: err?.stack });
      return {
        success: false,
        message: err?.message || "Error al iniciar proceso de firmado"
      };
    }
  }

  /**
   * Construye el payload para el endpoint /signer de FirmaPlus
   */
  private construirPayloadFirmaPlus(
    numeroSolicitud: string,
    usuario: string,
    clave: string,
    firmantes: FirmanteData[],
    documentoBase64: string,
    filename: string
  ): FirmaPlusSignerRequest {
    return {
      Usuario: usuario,
      Clave: clave,
      Nota: `Firma comfaca solicitud ${numeroSolicitud}`,
      Firmantes: firmantes.map((f) => ({
        Identificacion: f.numero_documento,
        TipoIdentificacion: f.tipo === "1" ? "Cédula de ciudadania" : f.tipo,
        Nombre: f.nombre_completo,
        Correo: f.email,
        NroCelular: formatPhoneForFirmaPlus(f.telefono, f.codigo_pais),
        Foto: "1",
        FotoObligatoria: "1",
        SolicitarAdjunto: "0",
        ReconocimientoFacial: "0"
      })),
      ArchivosPDF: [
        {
          Nombre: filename || `Solicitud_${numeroSolicitud}.pdf`,
          Documento_base64: documentoBase64
        }
      ],
      ArchivosAdjuntos: []
    };
  }

  /**
   * Consulta el estado de un proceso de firmado
   */
  async consultarEstado(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      Log.info("ProcesoFirmadoAdm.consultarEstado: Consultando estado", { solicitudId });

      const api = apiFirmaPlus();
      const respuesta = await api.getJson<FirmaPlusSignerResponse>(
        `consultarsolicitud/${solicitudId}`,
        { auth: true }
      );

      Log.info("ProcesoFirmadoAdm.consultarEstado: Respuesta", { solicitudId, code: respuesta.Code, message: respuesta.Message });

      if (respuesta.Code !== "1") {
        Log.warn("ProcesoFirmadoAdm.consultarEstado: Error", { solicitudId, code: respuesta.Code, message: respuesta.Message });
        return {
          success: false,
          message: respuesta.Message || "Error al consultar estado de firmado"
        };
      }

      return {
        success: true,
        message: "Estado consultado exitosamente",
        data: {
          transaccion_id: respuesta.Data?.NroSolicitud || solicitudId,
          estado: respuesta.Data?.Link ? "PENDIENTE_FIRMADO" : "DESCONOCIDO",
          urls_firma: respuesta.Data?.Link ? { default: respuesta.Data.Link } : undefined
        }
      };
    } catch (error: unknown) {
      const err = error as Error;
      Log.error("ProcesoFirmadoAdm.consultarEstado: Error catch", { solicitudId, error: err?.message || "Unknown" });
      return {
        success: false,
        message: err?.message || "Error al consultar estado de firmado"
      };
    }
  }

  /**
   * Cancela un proceso de firmado
   */
  async cancelarFirmado(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      Log.info("ProcesoFirmadoAdm.cancelarFirmado: Cancelando", { solicitudId });

      const api = apiFirmaPlus();
      const respuesta = await api.putJson<FirmaPlusSignerResponse>(
        `cancelarsolicitud/${solicitudId}`,
        {},
        { auth: true }
      );

      Log.info("ProcesoFirmadoAdm.cancelarFirmado: Respuesta", { solicitudId, code: respuesta.Code });

      if (respuesta.Code !== "1") {
        Log.warn("ProcesoFirmadoAdm.cancelarFirmado: Error", { solicitudId, code: respuesta.Code, message: respuesta.Message });
        return {
          success: false,
          message: respuesta.Message || "Error al cancelar proceso de firmado"
        };
      }

      Log.info("ProcesoFirmadoAdm.cancelarFirmado: Cancelado exitosamente", { solicitudId });

      return {
        success: true,
        message: "Proceso de firmado cancelado exitosamente",
        data: {
          transaccion_id: solicitudId,
          estado: "CANCELADO"
        }
      };
    } catch (error: unknown) {
      const err = error as Error;
      Log.error("ProcesoFirmadoAdm.cancelarFirmado: Error catch", { solicitudId, error: err?.message || "Unknown" });
      return {
        success: false,
        message: err?.message || "Error al cancelar proceso de firmado"
      };
    }
  }
}

export const procesoFirmadoAdm = new ProcesoFirmadoAdm();
export default procesoFirmadoAdm;
