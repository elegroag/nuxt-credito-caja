import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import prisma from "~~/lib/prisma";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

const bodySchema = z.object({
  motivo: z.string().trim().max(500).optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const body = bodySchema.safeParse((await readBody(event).catch(() => null)) ?? {});
    if (!body.success) {
      setResponseStatus(event, 400);
      return CustomResponse.error("El motivo no puede superar 500 caracteres", "Error de validación");
    }
    const motivo = body.data.motivo || undefined;

    const resultado = await procesoFirmadoAdm.cancelarFirmado(id);
    if (!resultado.success) {
      setResponseStatus(event, 400);
      return CustomResponse.error(resultado.message, "Error al cancelar proceso de firma");
    }

    const session = await getUserSession(event).catch(() => null);
    const username = session?.user?.username || "system";
    const now = new Date();
    const procesoId = resultado.data?.transaccion_id || "N/A";

    await prisma.$transaction([
      prisma.solicitudes_credito.update({
        where: { numero_solicitud: id },
        data: { estado: "CANCELADA", updated_at: now }
      }),
      prisma.solicitud_timeline.create({
        data: {
          solicitud_id: id,
          estado: "CANCELADA",
          fecha: now,
          detalle: `Proceso de firma KIAI cancelado por el administrador. Proceso: ${procesoId}.${motivo ? ` Motivo: ${motivo}` : ""}`,
          usuario_username: username
        }
      })
    ]);

    Log.info("cancelar-firmado: Proceso cancelado", { solicitudId: id, procesoId, username });

    return CustomResponse.success(
      { solicitud_id: id, estado_solicitud: "CANCELADA", transaccion_id: procesoId },
      "Proceso de firma cancelado. La solicitud quedó en estado CANCELADA."
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    Log.error("cancelar-firmado: Error catch", { error: err?.message || "Unknown" });

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al cancelar el proceso de firma",
      "Error al cancelar proceso de firma."
    );
  }
});
