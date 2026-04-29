import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const grupos = await prisma.solicitudes_credito.groupBy({
      by: ["estado"],
      _count: { estado: true },
    });

    const conteo: Record<string, number> = {};
    for (const g of grupos) {
      if (g.estado) conteo[g.estado] = g._count.estado;
    }

    return { success: true, data: conteo };
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return { error: e?.message || "Error al obtener conteo por estados" };
  }
});
