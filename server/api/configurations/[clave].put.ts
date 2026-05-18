import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";
import configurationsService from "~~/server/services/configurations.service";
import { z } from "zod";

const updateConfigSchema = z.object({
  valor: z.string().min(1, "El valor no puede estar vacío")
});

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error("No hay sesión activa", "Error de autenticación");
    }

    const user = await prisma.users.findUnique({
      where: { username: session.user.username },
      select: { roles: true }
    });

    if (!user) {
      setResponseStatus(event, 401);
      return CustomResponse.error("Usuario no encontrado", "Error de autenticación");
    }

    const userRoles = (user.roles as Array<{ nombre?: string; permisos?: string[] }>) || [];
    const isAdmin =
      userRoles.some((role) => role.nombre === "administrator") ||
      userRoles.some((role) => role.permisos?.includes("system.admin"));

    if (!isAdmin) {
      setResponseStatus(event, 403);
      return CustomResponse.error("Acceso denegado. Se requiere rol de administrador", "Error de permisos");
    }

    const clave = getRouterParam(event, "clave");

    if (!clave) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Clave de configuración requerida", "Error de validación");
    }

    const config = await prisma.configurations.findUnique({
      where: { clave }
    });

    if (!config) {
      setResponseStatus(event, 404);
      return CustomResponse.error(`Configuración '${clave}' no encontrada`, "No encontrada");
    }

    if (!config.editable) {
      setResponseStatus(event, 403);
      return CustomResponse.error(`La configuración '${clave}' no es editable`, "No editable");
    }

    const body = await readValidatedBody(event, updateConfigSchema.parse);

    const service = configurationsService();
    const updated = await service.setConfiguration(clave, body.valor);

    return CustomResponse.success(updated, `Configuración '${clave}' actualizada exitosamente`);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        e.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "),
        "Error de validación"
      );
    }

    const err = e as { message?: string };
    setResponseStatus(event, 500);
    return CustomResponse.error(err?.message || "Error interno del servidor", "Error al actualizar configuración");
  }
});