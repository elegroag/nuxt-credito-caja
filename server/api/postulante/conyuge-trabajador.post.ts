import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

const bodySchema = z.object({
  cedtra: z.string().min(3, "Cédula debe tener al menos 3 caracteres"),
  estado: z.string().min(1, "Estado es requerido")
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { cedtra, estado } = await readValidatedBody(event, bodySchema.parse);

    const conyugeTrabajador = await datosApiSisuwebService().conyugeTrabajador({
      cedtra,
      estado
    });

    return CustomResponse.success(conyugeTrabajador, "Solicitudes obtenidas exitosamente");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener conyuge trabajador."
    );
  }
});
