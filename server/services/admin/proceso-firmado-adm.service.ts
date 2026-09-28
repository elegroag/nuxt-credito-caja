import prisma from "~~/lib/prisma";
import apiKiai from "../api-kiai";
import type { KiaiRuntimeConfig } from "../api-kiai";
import documentoStorage from "../storage/documento-storage.service";
import { construirProcesoKiai, KIAI_PROVEEDOR } from "../firma/kiai-firmado.mapper";
import { loggerService } from "~~/server/utils/logger.service";
import { useRuntimeConfig } from "#imports";

const Log = loggerService();

interface IniciarFirmadoParams {
  solicitudId: string
}

interface IniciarFirmadoResult {
  success: boolean
  message: string
  data?: {
    transaccion_id: string
    estado: string
    proveedor?: string
    expira_en?: string | null
  }
}

const kiai = () => apiKiai(useRuntimeConfig() as unknown as KiaiRuntimeConfig);

const procesoVigente = (solicitudId: string) =>
  prisma.procesos_firma.findFirst({
    where: { solicitud_id: solicitudId, proveedor: KIAI_PROVEEDOR },
    orderBy: { id: "desc" }
  });

class ProcesoFirmadoAdm {
  /**
   * Proceso KIAI que impide un nuevo envío (abierto o completado), o null si se puede enviar
   */
  async procesoQueBloqueaEnvio(solicitudId: string) {
    const vigente = await procesoVigente(solicitudId);
    if (!vigente) return null;
    return ["DRAFT", "PENDING", "IN_PROGRESS", "COMPLETED"].includes(vigente.estado) ? vigente : null;
  }

  /**
   * Proceso KIAI que impide editar o borrar firmantes, o null si se pueden modificar.
   * Debe coincidir con puedeAgregarFirmantes en pages/admin/firmas/firmado/[id].vue
   */
  async procesoQueBloqueaFirmantes(solicitudId: string) {
    return this.procesoQueBloqueaEnvio(solicitudId);
  }

  /**
   * Crea el proceso de firma en KIAI y lo registra en procesos_firma
   */
  async iniciarFirmado(
    params: IniciarFirmadoParams
  ): Promise<IniciarFirmadoResult> {
    try {
      const { solicitudId } = params;

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Iniciando proceso", { solicitudId });

      const solicitud = await prisma.solicitudes_credito.findUnique({
        where: { numero_solicitud: solicitudId },
        include: {
          firmantes_solicitud: {
            orderBy: { orden: "asc" }
          },
          pdfs_generados: true
        }
      });

      if (!solicitud) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: Solicitud no encontrada", { solicitudId });
        return {
          success: false,
          message: "Solicitud no encontrada"
        };
      }

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

      const sinEmail = solicitud.firmantes_solicitud.filter((f) => !f.email?.trim());
      if (sinEmail.length > 0) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: Firmantes sin email", { solicitudId, count: sinEmail.length });
        return {
          success: false,
          message: "Todos los firmantes deben tener correo electrónico para recibir la invitación de firma"
        };
      }

      if (!solicitud.pdfs_generados) {
        Log.warn("ProcesoFirmadoAdm.iniciarFirmado: Sin PDF generado en tabla pdfs_generados", { solicitudId });
        return {
          success: false,
          message: "La solicitud no tiene PDF generado"
        };
      }

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

      const payload = construirProcesoKiai({
        numeroSolicitud: solicitud.numero_solicitud,
        firmantes: solicitud.firmantes_solicitud,
        documentoBase64: documento,
        filename: solicitud.pdfs_generados.filename
      });

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Creando proceso en KIAI", {
        solicitudId,
        signers: payload.signers.map((s) => ({ email: s.email, signingOrder: s.signingOrder }))
      });

      const api = kiai();
      const proceso = await api.crearProceso(payload);

      const now = new Date();
      await prisma.procesos_firma.create({
        data: {
          solicitud_id: solicitud.numero_solicitud,
          proveedor: KIAI_PROVEEDOR,
          proceso_id: proceso.id,
          estado: proceso.status,
          simulado: api.simulation,
          expira_en: proceso.expiresAt ? new Date(proceso.expiresAt) : null,
          respuesta: JSON.parse(JSON.stringify(proceso)),
          created_at: now,
          updated_at: now
        }
      });

      Log.info("ProcesoFirmadoAdm.iniciarFirmado: Proceso KIAI creado", {
        solicitudId,
        procesoId: proceso.id,
        status: proceso.status
      });

      return {
        success: true,
        message: "Proceso de firmado iniciado exitosamente",
        data: {
          transaccion_id: proceso.id,
          estado: "PENDIENTE_FIRMADO",
          proveedor: KIAI_PROVEEDOR,
          expira_en: proceso.expiresAt ?? null
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
   * Consulta en KIAI el estado del proceso vigente de la solicitud
   */
  async consultarEstado(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      const vigente = await procesoVigente(solicitudId);
      if (!vigente) {
        return {
          success: false,
          message: "La solicitud no tiene un proceso de firma en KIAI"
        };
      }

      const detalle = await kiai().consultarProceso(vigente.proceso_id);
      const now = new Date();
      await prisma.procesos_firma.update({
        where: { id: vigente.id },
        data: {
          estado: detalle.status,
          completado_en: detalle.completedAt ? new Date(detalle.completedAt) : null,
          ultima_consulta: now,
          respuesta: JSON.parse(JSON.stringify(detalle)),
          updated_at: now
        }
      });

      return {
        success: true,
        message: "Estado consultado exitosamente",
        data: {
          transaccion_id: vigente.proceso_id,
          estado: detalle.status,
          proveedor: KIAI_PROVEEDOR,
          expira_en: detalle.expiresAt ?? null
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
   * Cancela el proceso vigente de la solicitud (en KIAI, salvo que sea simulado)
   */
  async cancelarFirmado(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      const vigente = await procesoVigente(solicitudId);
      if (!vigente) {
        return {
          success: false,
          message: "La solicitud no tiene un proceso de firma en KIAI"
        };
      }

      if (["COMPLETED", "DECLINED", "EXPIRED", "CANCELLED"].includes(vigente.estado)) {
        return {
          success: false,
          message: `El proceso de firma ya finalizó (${vigente.estado}) y no puede cancelarse`
        };
      }

      // Un proceso simulado no existe en KIAI: se cancela solo localmente
      if (!vigente.simulado) {
        await kiai().cancelarProceso(vigente.proceso_id);
      }
      await prisma.procesos_firma.update({
        where: { id: vigente.id },
        data: { estado: "CANCELLED", updated_at: new Date() }
      });

      Log.info("ProcesoFirmadoAdm.cancelarFirmado: Cancelado exitosamente", {
        solicitudId,
        procesoId: vigente.proceso_id,
        simulado: vigente.simulado
      });

      return {
        success: true,
        message: "Proceso de firmado cancelado exitosamente",
        data: {
          transaccion_id: vigente.proceso_id,
          estado: "CANCELLED",
          proveedor: KIAI_PROVEEDOR
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

  /**
   * Descarta localmente un proceso simulado abierto (nunca llama a KIAI)
   */
  async descartarSimulacion(solicitudId: string): Promise<IniciarFirmadoResult> {
    try {
      const vigente = await procesoVigente(solicitudId);
      if (!vigente) {
        return {
          success: false,
          message: "La solicitud no tiene un proceso de firma en KIAI"
        };
      }

      if (!vigente.simulado) {
        return {
          success: false,
          message: "El proceso existe en KIAI: debe cancelarse, no descartarse"
        };
      }

      if (["COMPLETED", "DECLINED", "EXPIRED", "CANCELLED"].includes(vigente.estado)) {
        return {
          success: false,
          message: `La simulación ya finalizó (${vigente.estado})`
        };
      }

      await prisma.procesos_firma.update({
        where: { id: vigente.id },
        data: { estado: "CANCELLED", updated_at: new Date() }
      });

      Log.info("ProcesoFirmadoAdm.descartarSimulacion: Simulación descartada", { solicitudId, procesoId: vigente.proceso_id });

      return {
        success: true,
        message: "Simulación de firma descartada",
        data: {
          transaccion_id: vigente.proceso_id,
          estado: "CANCELLED",
          proveedor: KIAI_PROVEEDOR
        }
      };
    } catch (error: unknown) {
      const err = error as Error;
      Log.error("ProcesoFirmadoAdm.descartarSimulacion: Error catch", { solicitudId, error: err?.message || "Unknown" });
      return {
        success: false,
        message: err?.message || "Error al descartar la simulación"
      };
    }
  }
}

export const procesoFirmadoAdm = new ProcesoFirmadoAdm();
export default procesoFirmadoAdm;
