import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import rbacAdminService from "~~/server/services/rbac-admin.service";
import { requireRbacManage } from "~~/server/utils/rbac-admin-auth";
import { CustomResponse } from "~~/server/utils/customResponse";

const schema = z.object({
  key: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  href: z.string().max(500).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  abbr: z.string().max(10).optional().nullable(),
  section: z.enum(["General", "Administración", "Parametrización"]).optional(),
  ordering: z.number().int().optional(),
  active: z.enum(["S", "N"]).optional(),
  description: z.string().optional().nullable(),
  required_roles: z.array(z.string()).optional().nullable(),
  excluded_roles: z.array(z.string()).optional().nullable(),
  permission_ids: z.array(z.number().int().positive()).optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireRbacManage(event, "modules.manage");
    const body = schema.parse(await readBody(event));
    const data = await rbacAdminService().createModule(body);
    return CustomResponse.success(data, "Módulo creado.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; issues?: unknown };
    const status = Number(err?.statusCode || (err?.issues ? 400 : 502));
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(err?.message || "Error al crear módulo", "Error");
  }
});
