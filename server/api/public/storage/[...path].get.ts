import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, sendStream, setResponseStatus } from "h3";
import { createReadStream, statSync } from "fs";
import { join, normalize, resolve } from "path";

const ALLOWED_ROOTS = ["cms"] as const;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};

export default defineEventHandler(async (event: H3Event) => {
  const path = getRouterParam(event, "path");
  if (!path) {
    setResponseStatus(event, 400);
    return { error: "Ruta requerida" };
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) {
    setResponseStatus(event, 400);
    return { error: "Ruta inválida" };
  }

  const root = segments[0];
  const rest = segments.slice(1);
  if (!root) {
    setResponseStatus(event, 400);
    return { error: "Ruta inválida" };
  }
  if (!ALLOWED_ROOTS.includes(root as (typeof ALLOWED_ROOTS)[number])) {
    setResponseStatus(event, 403);
    return { error: "Acceso denegado" };
  }

  const base = resolve(process.env.STORAGE_UPLOADS_PATH || "storage/");
  const fullPath = normalize(join(base, root, ...rest));

  // Defensa contra path traversal: el archivo resuelto debe estar dentro de base/root
  const expectedPrefix = `${normalize(join(base, root))}${process.platform === "win32" ? "\\" : "/"}`;
  if (!fullPath.startsWith(expectedPrefix)) {
    setResponseStatus(event, 403);
    return { error: "Acceso denegado" };
  }

  try {
    const stats = statSync(fullPath);
    if (!stats.isFile()) {
      setResponseStatus(event, 404);
      return { error: "Archivo no encontrado" };
    }

    const ext = fullPath.split(".").pop()?.toLowerCase() ?? "";
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";

    setResponseHeaders(event, {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600"
    });

    return sendStream(event, createReadStream(fullPath));
  } catch {
    setResponseStatus(event, 404);
    return { error: "Archivo no encontrado" };
  }
});