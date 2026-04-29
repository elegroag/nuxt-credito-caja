import type { H3Event } from "h3";
import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import usersAdmService from "~~/server/services/admin/users-adm.service";
import { z } from "zod";

// Schema de validación para query params
const querySchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
  rol: z.string().optional(),
  estado: z.string().optional(),
  busqueda: z.string().optional(),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = usersAdmService();
    const query = await getQuery(event);
    const validatedQuery = querySchema.parse(query);

    const { limit, offset, rol, estado, busqueda } = validatedQuery;

    // Obtener usuarios con paginación
    const result = await service.listUsers(limit, offset);

    // Filtrar usuarios según los parámetros
    let usuariosFiltrados = result.data;

    if (rol) {
      usuariosFiltrados = usuariosFiltrados.filter((user: any) =>
        user.roles?.includes(rol),
      );
    }

    if (estado) {
      usuariosFiltrados = usuariosFiltrados.filter((user: any) => {
        if (estado === "active") return user.is_active && !user.disabled;
        if (estado === "inactive") return !user.is_active || user.disabled;
        if (estado === "suspended") return user.disabled;
        return true;
      });
    }

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(
        (user: any) =>
          user.full_name?.toLowerCase().includes(busquedaLower) ||
          user.email?.toLowerCase().includes(busquedaLower) ||
          user.username?.toLowerCase().includes(busquedaLower),
      );
    }

    // Calcular conteos de roles
    const conteoRoles: Record<string, number> = {};
    usuariosFiltrados.forEach((user: any) => {
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach((role: string) => {
          conteoRoles[role] = (conteoRoles[role] || 0) + 1;
        });
      }
    });

    // Calcular conteos de estados
    const conteoEstados = {
      active: 0,
      inactive: 0,
      suspended: 0,
    };

    usuariosFiltrados.forEach((user: any) => {
      if (user.disabled) {
        conteoEstados.suspended++;
      } else if (user.is_active) {
        conteoEstados.active++;
      } else {
        conteoEstados.inactive++;
      }
    });

    // Transformar usuarios al formato esperado por el frontend
    const usuariosTransformados = usuariosFiltrados.map((user: any) => ({
      id: Number(user.id),
      username: user.username,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      full_name: user.full_name,
      numero_documento: user.numero_documento,
      rol: user.roles?.[0] || "user_trabajador",
      roles: user.roles,
      estado: user.disabled
        ? "suspended"
        : user.is_active
          ? "active"
          : "inactive",
      fecha_creacion: user.created_at,
      telefono: user.phone,
    }));

    return {
      success: true,
      data: {
        usuarios: usuariosTransformados,
        total: result.total,
        conteo_roles: conteoRoles,
        conteo_estados: conteoEstados,
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
