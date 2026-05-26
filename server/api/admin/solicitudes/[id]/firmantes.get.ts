import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const firmantes = await prisma.firmantes_solicitud.findMany({
      where: { solicitud_id: id },
      orderBy: { orden: "asc" }
    });

    const serialized = firmantes.map((f) => ({
      id: String(f.id),
      solicitud_id: f.solicitud_id,
      orden: f.orden,
      tipo: f.tipo,
      nombre_completo: f.nombre_completo,
      numero_documento: f.numero_documento,
      email: f.email,
      rol: f.rol,
      created_at: f.created_at?.toISOString() || null,
      updated_at: f.updated_at?.toISOString() || null
    }));

    return CustomResponse.success(serialized, "Firmantes obtenidos exitosamente");
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 502);
    return CustomResponse.error(
      err?.message || "Error conectando con backend",
      "Error al obtener firmantes."
    );
  }
});
