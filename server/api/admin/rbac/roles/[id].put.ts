import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import rbacAdminService from "~~/server/services/rbac-admin.service";
import { requireRbacManage } from "~~/server/utils/rbac-admin-auth";
import { CustomResponse } from "~~/server/utils/customResponse";

const schema = z.object({
  etiqueta: z.string().max(45).optional().nullable(),
  descripcion: z.string().max(255).optional().nullable(),
  color: z.string().max(7).optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
  tipo: z.enum(["sistema", "firmante"]).optional(),
  permission_ids: z.array(z.number().int().positive()).optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireRbacManage(event, "roles.manage");
    const id = Number(getRouterParam(event, "id"));
    if (!Number.isFinite(id) || id <= 0) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID inválido", "Error");
    }
    const body = schema.parse(await readBody(event));
    const srv = rbacAdminService();
    let data = await srv.updateRole(id, body);
    if (body.permission_ids !== undefined) {
      data = await srv.setRolePermissions(id, body.permission_ids);
    }
    return CustomResponse.success(data, "Rol actualizado.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; issues?: unknown };
    const status = Number(err?.statusCode || (err?.issues ? 400 : 502));
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(err?.message || "Error al actualizar rol", "Error");
  }
});
