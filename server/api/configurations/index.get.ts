import { defineEventHandler, setResponseStatus } from "h3";
import configurationsService from "~~/server/services/configurations.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event) => {
  try {
    const service = configurationsService();
    const configs = await service.getAllConfigurations();

    return CustomResponse.ok(configs, "Datos consultados con éxito");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al obtener configuraciones."
    );
  }
});
