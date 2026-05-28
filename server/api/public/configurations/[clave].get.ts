import { defineEventHandler, getRouterParam } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const clave = getRouterParam(event, "clave");

  if (!clave) {
    throw createError({
      statusCode: 400,
      message: "Parámetro 'clave' es requerido"
    });
  }

  const config = await prisma.configurations.findUnique({
    where: { clave }
  });

  if (!config) {
    return {
      success: true,
      data: null,
      message: "Configuración no encontrada"
    };
  }

  return {
    success: true,
    data: {
      clave: config.clave,
      valor: config.valor,
      tipo: config.tipo,
      descripcion: config.descripcion
    },
    message: "Configuración obtenida exitosamente"
  };
});