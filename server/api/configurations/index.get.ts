import { defineEventHandler } from "h3";
import configurationsService from "~~/server/services/configurations.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async () => {
  try {
    const service = configurationsService();
    const configs = await service.getAllConfigurations();

    return CustomResponse.ok(configs, "Datos consultados con éxito");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(e, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener convenios."
    );
  }
});
