import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import prisma from "~~/lib/prisma";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";

const updateFirmanteSchema = z.object({
  firmanteId: z.string().regex(/^\d+$/, "ID de firmante inválido"),
  nombre_completo: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  email: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .max(255, "El email no puede exceder 255 caracteres"),
  telefono: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, "El teléfono debe ser un número móvil válido (inicia con 3 y tiene 10 dígitos).")
    .optional()
    .or(z.literal("")),
  codigo_pais: z.string().trim().max(5).optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const bloqueante = await procesoFirmadoAdm.procesoQueBloqueaFirmantes(id);
    if (bloqueante) {
      setResponseStatus(event, 409);
      return CustomResponse.error(
        "Los firmantes no se pueden modificar mientras exista un proceso de firma con KIAI",
        "Edición de firmante no permitida"
      );
    }

    const parsed = updateFirmanteSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        parsed.error.issues[0]?.message || "Datos inválidos",
        "Error de validación"
      );
    }

    const { firmanteId, nombre_completo, email, telefono, codigo_pais } = parsed.data;

    const existente = await prisma.firmantes_solicitud.findFirst({
      where: { id: BigInt(firmanteId), solicitud_id: id }
    });

    if (!existente) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Firmante no encontrado", "Error al actualizar firmante.");
    }

    const actualizado = await prisma.firmantes_solicitud.update({
      where: { id: existente.id },
      data: {
        nombre_completo,
        email,
        telefono: telefono || null,
        codigo_pais: codigo_pais || existente.codigo_pais || "57",
        updated_at: new Date()
      }
    });

    return CustomResponse.success(
      {
        id: String(actualizado.id),
        solicitud_id: actualizado.solicitud_id,
        orden: actualizado.orden,
        tipo: actualizado.tipo,
        nombre_completo: actualizado.nombre_completo,
        numero_documento: actualizado.numero_documento,
        email: actualizado.email,
        rol: actualizado.rol,
        telefono: actualizado.telefono ?? undefined,
        codigo_pais: actualizado.codigo_pais ?? undefined,
        created_at: actualizado.created_at?.toISOString() || null,
        updated_at: actualizado.updated_at?.toISOString() || null
      },
      "Firmante actualizado exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 502);
    return CustomResponse.error(
      err?.message || "Error conectando con backend",
      "Error al actualizar firmante."
    );
  }
});
