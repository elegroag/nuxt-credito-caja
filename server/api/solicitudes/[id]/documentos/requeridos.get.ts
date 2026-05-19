import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import apiSisuweb from "~~/server/services/api-sisuweb";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";

interface TipoCreditoResponse {
  success: boolean;
  status: boolean;
  exception: number;
  data: TipoCreditoSisuweb[];
}

interface TipoCreditoSisuweb {
  tipcre: string;
  detalle: string;
  documentos?: Array<{
    tipdoc: string;
    detalle: string;
    obliga: string;
  }>;
}

interface DocumentoRequerido {
  id: string;
  nombre: string;
  tipo: string;
  obligatorio: boolean;
  descripcion: string;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "No tienes permiso para ver los documentos requeridos de esta solicitud",
        "Acceso denegado"
      );
    }

    if (!solicitud.tipo_credito) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "La solicitud no tiene tipo de crédito asignado",
        "Error de validación"
      );
    }

    const sisuweb = apiSisuweb();
    let sisuResponse: TipoCreditoResponse | null = null;

    const log = loggerService();
    await log.info("documentos/requeridos: Consultando SISUWEB para tipo_credito", {
      tipo_credito: solicitud.tipo_credito,
      solicitud_id: solicitud.numero_solicitud
    });

    try {
      sisuResponse = await sisuweb.postJson<TipoCreditoResponse>(
        "creditos/tipo-creditos",
        {},
        { auth: true }
      );
      await log.info("documentos/requeridos: Respuesta SISUWEB", {
        success: sisuResponse?.success,
        status: sisuResponse?.status,
        count: sisuResponse?.data?.length ?? 0
      });

      if (!sisuResponse?.data || !Array.isArray(sisuResponse.data)) {
        await log.error(
          "documentos/requeridos: Respuesta SISUWEB invalida - no es array",
          undefined,
          {
            tipoCredito: solicitud.tipo_credito,
            respuesta: sisuResponse
          }
        );
        setResponseStatus(event, 500);
        return CustomResponse.error(
          "Error al obtener tipos de crédito desde SISUWEB",
          "Error en SISUWEB"
        );
      }

      const tipoCredito = sisuResponse.data.find(
        (tc: TipoCreditoSisuweb) => tc.tipcre === solicitud.tipo_credito
      );

      if (!tipoCredito) {
        setResponseStatus(event, 404);
        return CustomResponse.error(
          "Tipo de crédito no encontrado en SISUWEB",
          "Recurso no encontrado"
        );
      }

      const documentosRequeridos: DocumentoRequerido[] = (tipoCredito.documentos || []).map(
        (doc: { tipdoc: string; detalle: string; obliga: string }) => ({
          id: doc.tipdoc,
          nombre: doc.detalle,
          tipo: doc.tipdoc,
          obligatorio: doc.obliga === "S",
          descripcion: doc.detalle
        })
      );

      return CustomResponse.success(
        { documentos: documentosRequeridos, count: documentosRequeridos.length },
        "Documentos requeridos obtenidos exitosamente"
      );
    } catch (e: unknown) {
      await log.error("documentos/requeridos: Error SISUWEB", e as Error, {
        tipo_credito: solicitud.tipo_credito,
        solicitud_id: solicitud.numero_solicitud
      });
      setResponseStatus(event, 500);
      return CustomResponse.error(
        "Error al obtener tipos de crédito desde SISUWEB",
        "Error en SISUWEB"
      );
    }
  } catch (error: unknown) {
    const err = error as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    console.error("Error al obtener documentos requeridos:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al obtener documentos requeridos",
      "Error al obtener documentos requeridos."
    );
  }
});
