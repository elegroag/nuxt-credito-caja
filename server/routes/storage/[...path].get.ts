import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam } from "h3";
import { servePublicStorage } from "~~/server/utils/public-storage";

// URLs /storage/cms/... que guarda el CMS (upload.post.ts)
export default defineEventHandler(async (event: H3Event) => {
  return servePublicStorage(event, getRouterParam(event, "path"));
});
