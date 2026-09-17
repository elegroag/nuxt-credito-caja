import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import rbacAdminService from "~~/server/services/rbac-admin.service";
import { requireRbacManage } from "~~/server/utils/rbac-admin-auth";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    await requireRbacManage(event, "permissions.manage");
    const id = Number(getRouterParam(event, "id"));
    if (!Number.isFinite(id) || id <= 0) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID inválido", "Error");
    }
    const data = await rbacAdminService().deletePermission(id);
    return CustomResponse.success(data, "Permiso eliminado.");
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = Number(err?.statusCode || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);
    return CustomResponse.error(err?.message || "Error al eliminar permiso", "Error");
  }
});
