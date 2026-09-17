import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import rbacAdminService from "~~/server/services/rbac-admin.service";
import { requireRbacManage } from "~~/server/utils/rbac-admin-auth";
import { CustomResponse } from "~~/server/utils/customResponse";

const schema = z.object({
  nombre: z.string().min(2).max(50),
  etiqueta: z.string().max(45).optional().nullable(),
  descripcion: z.string().max(255).optional().nullable(),
  color: z.string().max(7).optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
  tipo: z.enum(["sistema", "firmante"]).optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireRbacManage(event, "roles.manage");
    const body = schema.parse(await readBody(event));
    const data = await rbacAdminService().createRole(body);
    return CustomResponse.success(data, "Rol creado.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; issues?: unknown };
    const status = Number(err?.statusCode || (err?.issues ? 400 : 502));
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(err?.message || "Error al crear rol", "Error");
  }
});
