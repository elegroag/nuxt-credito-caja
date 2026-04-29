import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readValidatedBody, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { z } from "zod";

// Schema de validación para actualizar solicitud
const updateSolicitudSchema = z.object({
  estado: z.string().optional(),
  valor_solicitud: z.number().positive().optional(),
  plazo_meses: z.number().int().positive().optional(),
  tasa_interes: z.number().nonnegative().optional(),
  producto_tipo: z.string().max(2).optional(),
  ha_tenido_credito: z.boolean().optional(),
  detalle_modalidad: z.string().max(255).optional(),
  tipo_credito: z.string().max(3).optional(),
  moneda: z.string().max(3).optional(),
  cuota_mensual: z.number().nonnegative().optional(),
  fecha_radicado: z.string().optional(),
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

    const payload = await readValidatedBody(event, updateSolicitudSchema.parse);

    const updateData: any = {};

    if (payload.estado !== undefined) updateData.estado = payload.estado;
    if (payload.valor_solicitud !== undefined) updateData.valor_solicitud = payload.valor_solicitud;
    if (payload.plazo_meses !== undefined) updateData.plazo_meses = payload.plazo_meses;
    if (payload.tasa_interes !== undefined) updateData.tasa_interes = payload.tasa_interes;
    if (payload.producto_tipo !== undefined) updateData.producto_tipo = payload.producto_tipo;
    if (payload.ha_tenido_credito !== undefined) updateData.ha_tenido_credito = payload.ha_tenido_credito;
    if (payload.detalle_modalidad !== undefined) updateData.detalle_modalidad = payload.detalle_modalidad;
    if (payload.tipo_credito !== undefined) updateData.tipo_credito = payload.tipo_credito;
    if (payload.moneda !== undefined) updateData.moneda = payload.moneda;
    if (payload.cuota_mensual !== undefined) updateData.cuota_mensual = payload.cuota_mensual;
    if (payload.fecha_radicado !== undefined) updateData.fecha_radicado = new Date(payload.fecha_radicado);

    const solicitud = await prisma.solicitudes_credito.update({
      where: { numero_solicitud: id },
      data: updateData,
    });

    return {
      success: true,
      message: "Solicitud actualizada exitosamente",
      data: {
        numero_solicitud: solicitud.numero_solicitud,
        estado: solicitud.estado,
        valor_solicitud: String(solicitud.valor_solicitud),
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
