import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readValidatedBody, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

// Schema de validación para cambiar estado
const cambiarEstadoSchema = z.object({
  estado: z.string().min(1, "El estado es requerido"),
  descripcion: z.string().optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const payload = await readValidatedBody(event, cambiarEstadoSchema.parse);

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    const solicitudActualizada = await prisma.solicitudes_credito.update({
      where: { numero_solicitud: id },
      data: {
        estado: payload.estado
      }
    });

    return CustomResponse.success(
      {
        numero_solicitud: solicitudActualizada.numero_solicitud,
        estado: solicitudActualizada.estado
      },
      "Estado actualizado exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al actualizar estado."
    );
  }
});
