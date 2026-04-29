import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

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
      include: {
        pdfs_generados: true,
      },
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
        error: "No tienes permiso para ver esta solicitud",
      };
    }

    return {
      success: true,
      data: solicitud,
    };
  } catch (error: any) {
    console.error("Error al obtener solicitud:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al obtener la solicitud",
    };
  }
});
