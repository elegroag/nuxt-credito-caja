import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { z } from "zod";
import rbacAdminService from "~~/server/services/rbac-admin.service";
import { requireRbacManage } from "~~/server/utils/rbac-admin-auth";
import { CustomResponse } from "~~/server/utils/customResponse";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  busqueda: z.string().optional(),
  section: z.string().optional(),
  active: z.string().optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireRbacManage(event, "modules.manage");
    const q = querySchema.parse(getQuery(event));
    const data = await rbacAdminService().listModules(q);
    return CustomResponse.success(data, "Módulos obtenidos.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; issues?: unknown };
    const status = Number(err?.statusCode || (err?.issues ? 400 : 502));
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(err?.message || "Error al listar módulos", "Error");
  }
});
