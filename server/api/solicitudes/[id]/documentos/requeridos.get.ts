import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import apiSisuweb from "~~/server/services/api-sisuweb";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return {
        error: "No hay sesión activa",
      };
    }

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    if (solicitud.owner_username !== session.user.username) {
      setResponseStatus(event, 403);
      return {
        error:
          "No tienes permiso para ver los documentos requeridos de esta solicitud",
      };
    }

    if (!solicitud.tipo_credito) {
      setResponseStatus(event, 400);
      return {
        error: "La solicitud no tiene tipo de crédito asignado",
      };
    }

    const sisuweb = apiSisuweb();
    const response = await sisuweb.postJson<any>(
      "creditos/tipo-creditos",
      {},
      {
        auth: true,
      },
    );

    console.log("Respuesta de SISUWEB:", JSON.stringify(response, null, 2));
    console.log("Tipo de crédito de la solicitud:", solicitud.tipo_credito);

    if (!response.success || !response.data) {
      setResponseStatus(event, 500);
      return {
        error: "Error al obtener tipos de crédito desde SISUWEB",
        details: response,
      };
    }

    const tipoCredito = response.data.find(
      (tc: any) => tc.tipcre === solicitud.tipo_credito,
    );

    if (!tipoCredito) {
      setResponseStatus(event, 404);
      return {
        error: "Tipo de crédito no encontrado en SISUWEB",
      };
    }

    // Transformar documentos de SISUWEB al formato DocumentoRequerido[]
    const documentosRequeridos = (tipoCredito.documentos || []).map(
      (doc: any) => ({
        id: doc.tipdoc,
        nombre: doc.detalle,
        tipo: doc.tipdoc,
        obligatorio: doc.obliga === "S",
        descripcion: doc.detalle,
      }),
    );

    return {
      success: true,
      data: documentosRequeridos,
      count: documentosRequeridos.length,
    };
  } catch (error: any) {
    console.error("Error al obtener documentos requeridos:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error:
        error?.data?.error ||
        error?.message ||
        "Error al obtener documentos requeridos",
    };
  }
});
