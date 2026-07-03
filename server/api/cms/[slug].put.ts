import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readValidatedBody, setResponseStatus } from "h3";
import { z } from "zod";
import prisma from "~~/lib/prisma";
import cmsPaginasService from "~~/server/services/cms-paginas.service";
import { CustomResponse } from "~~/server/utils/customResponse";

const fieldSchema = z.object({
  clave: z.string().min(3).max(120),
  valor: z.string().max(50000),
  tipo: z.enum(["text", "html", "image", "json"]).default("text"),
  descripcion: z.string().max(255).optional().nullable()
});

const bodySchema = z.object({
  fields: z.array(fieldSchema).max(200)
});

const CMS_CATEGORY = "cms";

export default defineEventHandler(async (event: H3Event) => {
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

    const roles = (user.roles as string[]) || [];
    const isAdmin = roles.includes("administrator");

    if (!isAdmin) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        "Acceso denegado. Se requiere rol administrador",
        "Error de permisos"
      );
    }

    const slug = getRouterParam(event, "slug");
    const safeSlug = slug ? cmsPaginasService().sanitizeSlug(slug) : "";
    if (!safeSlug) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Slug inválido", "Error de validación");
    }

    const body = await readValidatedBody(event, bodySchema.parse);

    // Validar que todas las claves correspondan al slug del path
    const prefix = `cms.${safeSlug}.`;
    for (const field of body.fields) {
      if (!field.clave.startsWith(prefix)) {
        setResponseStatus(event, 400);
        return CustomResponse.error(
          `La clave '${field.clave}' no pertenece al slug '${safeSlug}'`,
          "Error de validación"
        );
      }
    }

    // Upsert en transacción
    const now = new Date();
    await prisma.$transaction(
      body.fields.map((field) =>
        prisma.configurations.upsert({
          where: { clave: field.clave },
          create: {
            clave: field.clave,
            valor: field.valor,
            tipo: field.tipo,
            categoria: CMS_CATEGORY,
            descripcion: field.descripcion ?? null,
            editable: true,
            required: false,
            created_at: now,
            updated_at: now
          },
          update: {
            valor: field.valor,
            tipo: field.tipo,
            descripcion: field.descripcion ?? null,
            updated_at: now
          }
        })
      )
    );

    const updated = await cmsPaginasService().getPageContent(safeSlug);
    return CustomResponse.success(updated, "Contenido actualizado exitosamente");
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        "Error de validación"
      );
    }
    const err = e as { message?: string };
    setResponseStatus(event, 500);
    return CustomResponse.error(
      err?.message || "Error al guardar contenido",
      "Error al guardar contenido"
    );
  }
});