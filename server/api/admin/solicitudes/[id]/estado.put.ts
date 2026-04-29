import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readValidatedBody, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { z } from "zod";

// Schema de validación para cambiar estado
const cambiarEstadoSchema = z.object({
  estado: z.string().min(1, "El estado es requerido"),
  descripcion: z.string().optional(),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    const payload = await readValidatedBody(event, cambiarEstadoSchema.parse);

    // Verificar que la solicitud existe
    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    // Actualizar estado
    const solicitudActualizada = await prisma.solicitudes_credito.update({
      where: { numero_solicitud: id },
      data: {
        estado: payload.estado,
      },
    });

    // Aquí se podría agregar lógica para registrar el cambio en un historial o timeline
    // Por ahora solo actualizamos el estado

    return {
      success: true,
      message: "Estado actualizado exitosamente",
      data: {
        numero_solicitud: solicitudActualizada.numero_solicitud,
        estado: solicitudActualizada.estado,
      },
    };
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (e?.data && typeof e.data === "object") {
      return e.data;
    }

    return {
      error: e?.data?.error || e?.message || "Error conectando con backend",
    };
  }
});
