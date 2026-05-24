import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Consultar roles activos desde la BD
    const rolesRaw = await prisma.roles.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true, descripcion: true }
    });

    // Convertir BigInt a string para serialización JSON
    const roles = rolesRaw.map((r) => ({
      id: Number(r.id),
      nombre: r.nombre,
      descripcion: r.descripcion
    }));

    return CustomResponse.success(roles, "Roles de firmantes obtenidos exitosamente.");
  } catch (e: unknown) {
    console.error("Error al obtener roles de firmantes:", e);
    setResponseStatus(event, 500);
    return CustomResponse.error(
      "Error al obtener roles de firmantes",
      "Error al consultar la base de datos"
    );
  }
});
