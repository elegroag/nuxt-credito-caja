import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import convenioService from "~~/server/services/convenio.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

// Schema de validación para query params
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  estado: z.string().optional(),
  nit: z.string().optional(),
  busqueda: z.string().optional(),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = convenioService();
    const query = await getQuery(event);
    const validatedQuery = querySchema.parse(query);

    const { page, limit, estado, nit, busqueda } = validatedQuery;

    const result = await service.getConveniosPaginados({
      page,
      limit,
      estado,
      nit,
      busqueda,
    });

    return CustomResponse.success(result, "Convenios obtenidos exitosamente");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener convenios.",
    );
  }
});
