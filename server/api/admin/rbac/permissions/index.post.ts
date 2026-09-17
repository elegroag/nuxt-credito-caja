import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import rbacAdminService from "~~/server/services/rbac-admin.service";
import { requireRbacManage } from "~~/server/utils/rbac-admin-auth";
import { CustomResponse } from "~~/server/utils/customResponse";

const schema = z.object({
  key: z.string().min(3).max(100).regex(/^[a-z0-9_.]+$/),
  etiqueta: z.string().min(2).max(150),
  descripcion: z.string().max(255).optional().nullable(),
  activo: z.boolean().optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireRbacManage(event, "permissions.manage");
    const body = schema.parse(await readBody(event));
    const data = await rbacAdminService().createPermission(body);
    return CustomResponse.success(data, "Permiso creado.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; issues?: unknown };
    const status = Number(err?.statusCode || (err?.issues ? 400 : 502));
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(err?.message || "Error al crear permiso", "Error");
  }
});
