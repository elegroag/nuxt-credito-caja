import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import { CustomResponse } from "~~/server/utils/customResponse";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const estados = await prisma.estados_solicitud.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        orden: true,
        activo: true
      }
    });

    return CustomResponse.ok(estados, "Estados obtenidos correctamente");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener estados."
    );
  }
});
