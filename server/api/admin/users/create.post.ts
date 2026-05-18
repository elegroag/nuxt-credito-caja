import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import usersAdmService from "~~/server/services/admin/users-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = usersAdmService();
    const payload = await readValidatedBody(event, service.validateCreateUser);

    const user = await service.createUser(payload);

    return CustomResponse.success(
      {
        id: Number(user.id),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles
      },
      "Usuario creado exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al crear usuario."
    );
  }
});
