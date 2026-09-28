import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { z } from "zod";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import { KIAI_PROVEEDOR, resumirProcesoFirma } from "~~/server/services/firma/kiai-firmado.mapper";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
  estado: z.string().optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { limit, skip, estado } = querySchema.parse(getQuery(event));

    const where = {
      procesos_firma: { some: { proveedor: KIAI_PROVEEDOR } },
      ...(estado && estado !== "@" ? { estado } : {})
    };

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudes_credito.findMany({
        where,
        orderBy: { updated_at: "desc" },
        take: limit,
        skip,
        include: {
          estados_solicitud: { select: { id: true, nombre: true, color: true } },
          solicitud_solicitante: {
            select: { nombres: true, apellidos: true, numero_documento: true, email: true }
          },
          firmantes_solicitud: { select: { id: true } },
          procesos_firma: {
            where: { proveedor: KIAI_PROVEEDOR },
            orderBy: { id: "desc" },
            take: 1
          },
          solicitud_payload: {
            select: { informacion_laboral: true },
            orderBy: { id: "desc" },
            take: 1
          }
        }
      }),
      prisma.solicitudes_credito.count({ where })
    ]);

    // No hay relación entre solicitud y convenio: se cruza por el NIT de la empresa del trabajador
    const nitPorSolicitud = new Map<string, string>();
    for (const s of solicitudes) {
      const laboral = s.solicitud_payload[0]?.informacion_laboral as { empresa_nit?: unknown } | null;
      const nit = String(laboral?.empresa_nit ?? "").replace(/\D/g, "");
      if (nit) nitPorSolicitud.set(s.numero_solicitud, nit);
    }

    const nits = [...new Set(nitPorSolicitud.values())];
    const convenios = nits.length
      ? await prisma.empresas_convenio.findMany({
          where: { nit: { in: nits.map((n) => BigInt(n)) } },
          select: { nit: true, razon_social: true, estado: true }
        })
      : [];
    const convenioPorNit = new Map(
      convenios.map((c) => [String(c.nit), { nit: String(c.nit), razon_social: c.razon_social, estado: c.estado }])
    );

    const collection = solicitudes.map((s) => {
      const solicitante = s.solicitud_solicitante?.[0] ?? null;
      const proceso = s.procesos_firma[0];
      const nit = nitPorSolicitud.get(s.numero_solicitud);
      return {
        numero_solicitud: s.numero_solicitud,
        owner_username: s.owner_username,
        estado: s.estado,
        estado_info: s.estados_solicitud,
        fecha_radicado: s.fecha_radicado?.toISOString() || null,
        created_at: s.created_at?.toISOString() || null,
        updated_at: s.updated_at?.toISOString() || null,
        solicitante: solicitante
          ? {
              ...solicitante,
              nombres_apellidos: [solicitante.nombres, solicitante.apellidos].filter(Boolean).join(" ")
            }
          : null,
        convenio: (nit && convenioPorNit.get(nit)) || null,
        proceso_firmado: proceso ? resumirProcesoFirma(proceso, s.firmantes_solicitud.length) : null
      };
    });

    return CustomResponse.success({ collection, pagination: { total } }, "Procesos de firma obtenidos exitosamente");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error consultando procesos de firma",
      "Error al obtener procesos de firma."
    );
  }
});
