import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { KIAI_PROVEEDOR, resumirProcesoFirma } from "~~/server/services/firma/kiai-firmado.mapper";

const procesoVigente = (solicitudId: string) =>
  prisma.procesos_firma.findFirst({
    where: { solicitud_id: solicitudId, proveedor: KIAI_PROVEEDOR },
    orderBy: { id: "desc" }
  });

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id },
      select: { numero_solicitud: true, estado: true, _count: { select: { firmantes_solicitud: true } } }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    let proceso = await procesoVigente(id);
    if (!proceso) {
      setResponseStatus(event, 404);
      return CustomResponse.error("La solicitud no tiene un proceso de firma en KIAI", "Recurso no encontrado");
    }

    // Los procesos simulados no existen en KIAI: se devuelve lo guardado
    if (!proceso.simulado) {
      const consulta = await procesoFirmadoAdm.consultarEstado(id);
      if (!consulta.success) {
        setResponseStatus(event, 502);
        return CustomResponse.error(consulta.message, "Error al consultar estado en KIAI.");
      }
      proceso = (await procesoVigente(id)) ?? proceso;
    }

    const resumen = resumirProcesoFirma(proceso, solicitud._count.firmantes_solicitud);

    return CustomResponse.success(
      {
        solicitud_id: solicitud.numero_solicitud,
        estado_solicitud: solicitud.estado,
        ...resumen
      },
      proceso.simulado ? "Proceso simulado: estado guardado localmente" : "Estado de firmado consultado en KIAI"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al consultar estado de firmado."
    );
  }
});
