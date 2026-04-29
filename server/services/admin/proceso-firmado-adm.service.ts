import prisma from "~~/lib/prisma";
import apiFirmaPlus from "../api-firmaplus";
import documentoStorage from "../storage/documento-storage.service";

interface FirmanteData {
  orden: number;
  tipo: string;
  nombre_completo: string;
  numero_documento: string;
  email: string;
  rol: string;
}

interface IniciarFirmadoParams {
  solicitudId: string;
}

interface IniciarFirmadoResult {
  success: boolean;
  message: string;
  data?: {
    transaccion_id: string;
    estado: string;
    urls_firma?: Record<string, string>;
  };
}

class ProcesoFirmadoAdm {
  /**
   * Inicia el proceso de firmado para una solicitud
   */
  async iniciarFirmado(
    params: IniciarFirmadoParams,
  ): Promise<IniciarFirmadoResult> {
    try {
      const { solicitudId } = params;

      // 1. Consultar la solicitud con firmantes
      const solicitud = await prisma.solicitudes_credito.findUnique({
        where: { numero_solicitud: solicitudId },
        include: {
          firmantes_solicitud: {
            orderBy: { orden: "asc" },
          },
        },
      });

      if (!solicitud) {
        return {
          success: false,
          message: "Solicitud no encontrada",
        };
      }

      // 2. Validar que la solicitud tenga firmantes
      if (
        !solicitud.firmantes_solicitud ||
        solicitud.firmantes_solicitud.length === 0
      ) {
        return {
          success: false,
          message: "La solicitud no tiene firmantes asociados",
        };
      }

      // 3. Validar que la solicitud tenga PDF generado
      if (!solicitud.pdf_generado) {
        return {
          success: false,
          message: "La solicitud no tiene PDF generado",
        };
      }

      // 4. Obtener el documento del storage
      const documento = await documentoStorage.obtenerContenidoDesdePdfGenerado(
        solicitud.pdf_generado as any,
      );
      if (!documento) {
        return {
          success: false,
          message: "No se pudo obtener el documento PDF del storage",
        };
      }

      // 5. Preparar datos para FirmaPlus
      const firmantes = this.prepararFirmantes(solicitud.firmantes_solicitud);
      const solicitudFirma = this.prepararSolicitudFirma(
        solicitud,
        documento,
        firmantes,
      );

      // 6. Llamar al servicio de FirmaPlus para iniciar el firmado
      const api = apiFirmaPlus();
      const respuesta = await api.postJson<any>(
        "generarsolicitud",
        solicitudFirma,
        {
          auth: true,
        },
      );

      if (!respuesta.success) {
        return {
          success: false,
          message: respuesta.message || "Error al iniciar solicitud de firmado",
        };
      }

      // 7. Aquí se podría guardar la información del proceso de firmado en la base de datos
      // Por ejemplo, crear una tabla proceso_firmado o actualizar un campo en la solicitud

      return {
        success: true,
        message: "Proceso de firmado iniciado exitosamente",
        data: {
          transaccion_id:
            respuesta.data?.transaccion_id || solicitud.numero_solicitud,
          estado: "PENDIENTE_FIRMADO",
          urls_firma: respuesta.data?.urls_firma,
        },
      };
    } catch (error: any) {
      console.error("Error al iniciar firmado:", error);
      return {
        success: false,
        message: error.message || "Error al iniciar proceso de firmado",
      };
    }
  }

  /**
   * Prepara los firmantes en el formato esperado por FirmaPlus
   */
  private prepararFirmantes(firmantes: FirmanteData[]): any[] {
    return firmantes.map((f) => ({
      nombre: f.nombre_completo,
      documento: f.numero_documento,
      email: f.email,
      rol: f.rol,
      orden: f.orden,
    }));
  }

  /**
   * Prepara la solicitud de firma en el formato esperado por FirmaPlus
   */
  private prepararSolicitudFirma(
    solicitud: any,
    documento: string,
    firmantes: any[],
  ): any {
    return {
      documento: documento, // Base64 o URL del documento
      nombre_documento: `Solicitud_${solicitud.numero_solicitud}.pdf`,
      descripcion: `Solicitud de crédito #${solicitud.numero_solicitud}`,
      firmantes: firmantes,
      callback_url: `${process.env.API_URL}/api/admin/solicitudes/${solicitud.numero_solicitud}/webhook-firmado`,
      fecha_expiracion: this.calcularFechaExpiracion(),
    };
  }

  /**
   * Calcula la fecha de expiración del proceso de firmado (por defecto 7 días)
   */
  private calcularFechaExpiracion(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);
    return fecha.toISOString();
  }

  /**
   * Consulta el estado de un proceso de firmado
   */
  async consultarEstado(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      const api = apiFirmaPlus();
      const respuesta = await api.getJson<any>(
        `consultarsolicitud/${solicitudId}`,
        { auth: true },
      );

      if (!respuesta.success) {
        return {
          success: false,
          message: respuesta.message || "Error al consultar estado de firmado",
        };
      }

      return {
        success: true,
        message: "Estado consultado exitosamente",
        data: {
          transaccion_id: respuesta.data?.transaccion_id || solicitudId,
          estado: respuesta.data?.estado || "DESCONOCIDO",
          urls_firma: respuesta.data?.urls_firma,
        },
      };
    } catch (error: any) {
      console.error("Error al consultar estado de firmado:", error);
      return {
        success: false,
        message: error.message || "Error al consultar estado de firmado",
      };
    }
  }

  /**
   * Cancela un proceso de firmado
   */
  async cancelarFirmado(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      const api = apiFirmaPlus();
      const respuesta = await api.putJson<any>(
        `cancelarsolicitud/${solicitudId}`,
        {},
        { auth: true },
      );

      if (!respuesta.success) {
        return {
          success: false,
          message: respuesta.message || "Error al cancelar proceso de firmado",
        };
      }

      return {
        success: true,
        message: "Proceso de firmado cancelado exitosamente",
        data: {
          transaccion_id: solicitudId,
          estado: "CANCELADO",
        },
      };
    } catch (error: any) {
      console.error("Error al cancelar firmado:", error);
      return {
        success: false,
        message: error.message || "Error al cancelar proceso de firmado",
      };
    }
  }
}

export const procesoFirmadoAdm = new ProcesoFirmadoAdm();
export default procesoFirmadoAdm;
