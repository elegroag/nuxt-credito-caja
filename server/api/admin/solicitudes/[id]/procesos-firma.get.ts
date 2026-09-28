import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import type { KiaiProcessSigner } from "~~/server/services/api-kiai";
import { KIAI_PROVEEDOR, resumirProcesoFirma } from "~~/server/services/firma/kiai-firmado.mapper";

/** respuesta solo trae signers después de consultar el detalle en KIAI; la de creación no los incluye. */
const extraerFirmantes = (respuesta: unknown) => {
  const signers = (respuesta as { signers?: Partial<KiaiProcessSigner>[] } | null)?.signers;
  if (!Array.isArray(signers)) return null;

  return [...signers]
    .sort((a, b) => Number(a.signingOrder ?? 0) - Number(b.signingOrder ?? 0))
    .map((s) => ({
      orden: Number(s.signingOrder ?? 0),
      nombre: [s.firstName, s.lastName].filter(Boolean).join(" "),
      email: s.email ?? "",
      estado: s.status ?? "",
      firmado_en: s.signedAt ?? null,
      rechazado_en: s.declinedAt ?? null,
      motivo_rechazo: s.declineReason ?? null
    }));
};

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: id },
      select: {
        numero_solicitud: true,
        estado: true,
        solicitud_solicitante: { select: { nombres: true, apellidos: true }, take: 1 },
        _count: { select: { firmantes_solicitud: true } },
        procesos_firma: {
          where: { proveedor: KIAI_PROVEEDOR },
          orderBy: { id: "desc" }
        }
      }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Solicitud no encontrada", "Recurso no encontrado");
    }

    const solicitante = solicitud.solicitud_solicitante[0];

    return CustomResponse.success(
      {
        solicitud_id: solicitud.numero_solicitud,
        estado_solicitud: solicitud.estado,
        solicitante: solicitante
          ? [solicitante.nombres, solicitante.apellidos].filter(Boolean).join(" ")
          : null,
        procesos: solicitud.procesos_firma.map((p) => ({
          id: String(p.id),
          ...resumirProcesoFirma(p, solicitud._count.firmantes_solicitud),
          firmantes: extraerFirmantes(p.respuesta)
        }))
      },
      "Historial de procesos de firma obtenido exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error consultando procesos de firma",
      "Error al obtener historial de procesos de firma."
    );
  }
});
