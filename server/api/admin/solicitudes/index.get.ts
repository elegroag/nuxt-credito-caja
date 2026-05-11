import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import solicitudService from "~~/server/services/solicitud.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

// Schema de validación para query params
const querySchema = z.object({
  limit: z.coerce.number().int().positive().default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
  estado: z.string().optional(),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = solicitudService();
    const query = await getQuery(event);
    const validatedQuery = querySchema.parse(query);

    const { limit, skip, estado } = validatedQuery;

    const result = await service.getSolicitudesPaginadas({
      limit,
      skip,
      estado,
    });

    return CustomResponse.success(result, "Solicitudes obtenidas exitosamente");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener solicitudes.",
    );
  }
});
