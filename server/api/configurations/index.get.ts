import { defineEventHandler } from "h3";
import configurationsService from "~~/server/services/configurations.service";

export default defineEventHandler(async () => {
  const service = configurationsService();
  const configs = await service.getAllConfigurations();
  return configs;
});