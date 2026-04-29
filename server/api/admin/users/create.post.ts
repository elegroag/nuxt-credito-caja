import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import usersAdmService from "~~/server/services/admin/users-adm.service";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = usersAdmService();
    const payload = await readValidatedBody(event, service.validateCreateUser);

    const user = await service.createUser(payload);

    return {
      success: true,
      message: "Usuario creado exitosamente",
      data: {
        id: Number(user.id),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles,
      },
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
