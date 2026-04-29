import type { H3Event } from "h3";
import {
  defineEventHandler,
  getRouterParam,
  readValidatedBody,
  setResponseStatus,
} from "h3";
import usersAdmService from "~~/server/services/admin/users-adm.service";
import { z } from "zod";

// Schema de validación para actualizar usuario
const updateUserSchema = z.object({
  username: z
    .string()
    .min(1, "El username es requerido")
    .max(255, "El username no puede exceder 255 caracteres")
    .optional(),
  email: z
    .string()
    .email("El email no es válido")
    .max(255, "El email no puede exceder 255 caracteres")
    .optional(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .optional(),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  apellido: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "El apellido no puede exceder 100 caracteres")
    .optional(),
  roles: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  tipo_documento: z
    .string()
    .max(20, "El tipo de documento no puede exceder 20 caracteres")
    .optional(),
  numero_documento: z
    .string()
    .max(20, "El número de documento no puede exceder 20 caracteres")
    .optional(),
  telefono: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional(),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = usersAdmService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return {
        error: "ID de usuario no proporcionado",
      };
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      setResponseStatus(event, 400);
      return {
        error: "ID de usuario inválido",
      };
    }

    const payload = await readValidatedBody(event, updateUserSchema.parse);

    // Transformar el payload al formato esperado por el service
    const updateParams: any = {};

    if (payload.username !== undefined)
      updateParams.username = payload.username;
    if (payload.email !== undefined) updateParams.email = payload.email;
    if (payload.password !== undefined)
      updateParams.password = payload.password;
    if (payload.nombre !== undefined) updateParams.nombre = payload.nombre;
    if (payload.apellido !== undefined)
      updateParams.apellido = payload.apellido;
    if (payload.roles !== undefined) updateParams.roles = payload.roles;
    if (payload.disabled !== undefined)
      updateParams.disabled = payload.disabled;
    if (payload.tipo_documento !== undefined)
      updateParams.tipo_documento = payload.tipo_documento;
    if (payload.numero_documento !== undefined)
      updateParams.numero_documento = payload.numero_documento;
    if (payload.telefono !== undefined)
      updateParams.telefono = payload.telefono;

    const user = await service.updateUser(userId, updateParams);

    return {
      success: true,
      message: "Usuario actualizado exitosamente",
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
