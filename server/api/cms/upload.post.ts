import type { H3Event } from "h3";
import { defineEventHandler, readMultipartFormData, setResponseStatus } from "h3";
import { writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import prisma from "~~/lib/prisma";
import cmsPaginasService from "~~/server/services/cms-paginas.service";
import { CustomResponse } from "~~/server/utils/customResponse";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

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

    const formData = await readMultipartFormData(event);
    if (!formData) {
      setResponseStatus(event, 400);
      return CustomResponse.error("No se recibieron datos", "Error de validación");
    }

    const file = formData.find((f) => f.name === "file");
    const slugField = formData.find((f) => f.name === "slug");

    if (!file || !file.data || file.data.length === 0) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Archivo requerido", "Error de validación");
    }

    const slugRaw = slugField?.data?.toString() ?? "";
    const slug = cmsPaginasService().sanitizeSlug(slugRaw);
    if (!slug) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Slug inválido", "Error de validación");
    }

    const mime = file.type || "image/png";
    if (!ALLOWED_MIME.has(mime)) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        `Tipo de archivo no permitido: ${mime}`,
        "Error de validación"
      );
    }

    if (file.data.length > MAX_SIZE_BYTES) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        `El archivo supera el tamaño máximo (${MAX_SIZE_BYTES / 1024 / 1024}MB)`,
        "Error de validación"
      );
    }

    const originalName = file.filename || "imagen";
    const ext = (() => {
      if (originalName.includes(".")) {
        const e = originalName.split(".").pop()?.toLowerCase() ?? "";
        if (ALLOWED_EXT.has(e)) return e;
      }
      const fromMime = mime.split("/").pop() ?? "png";
      return ALLOWED_EXT.has(fromMime) ? fromMime : "png";
    })();

    const filename = `${crypto.randomUUID()}.${ext}`;
    const baseUploads = resolve(process.env.STORAGE_UPLOADS_PATH || "storage/");
    const targetDir = join(baseUploads, "cms", slug);
    await mkdir(targetDir, { recursive: true });

    const fullPath = join(targetDir, filename);
    await writeFile(fullPath, file.data);

    const publicUrl = `/api/public/storage/cms/${slug}/${filename}`;
    return CustomResponse.success(
      {
        url: publicUrl,
        filename,
        mime,
        size: file.data.length,
        slug
      },
      "Imagen subida exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { message?: string };
    setResponseStatus(event, 500);
    return CustomResponse.error(
      err?.message || "Error al subir la imagen",
      "Error al subir la imagen"
    );
  }
});