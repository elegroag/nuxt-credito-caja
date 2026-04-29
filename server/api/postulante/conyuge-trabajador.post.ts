import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { z } from "zod";

const bodySchema = z.object({
  cedtra: z.number().min(3, "Username must be at least 3 characters"),
  estado: z.number().min(8, "Password must be at least 8 characters"),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { cedtra, estado } = await readValidatedBody(event, bodySchema.parse);

    const conyugeTrabajador = await datosApiSisuwebService().conyugeTrabajador({
      cedtra,
      estado,
    });

    return {
      success: true,
      message: "Solicitudes obtenidas exitosamente",
      data: conyugeTrabajador,
    };
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (e?.data && typeof e.data === "object") {
      return e.data;
    }

    return {
      error: e?.data?.error || e?.message || "Error conectando con backend",
    };
  }
});
