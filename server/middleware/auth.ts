const PUBLIC_ROUTES: string[] = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/recovery",
  "/api/auth/adviser",
  "/api/auth/verify",
  "/api/health"
];

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const path = url.pathname;

  // Solo intercepta rutas de la API (no páginas SSR)
  if (!path.startsWith("/api/")) return;

  // Excluir rutas internas de Nuxt (_nuxt)
  if (path.includes("/_nuxt")) return;

  // Excluir rutas de payload (_payload.json)
  if (path.endsWith("_payload.json")) return;

  // Permite rutas públicas sin autenticación
  if (PUBLIC_ROUTES.includes(path)) return;

  const session = await getUserSession(event).catch(() => null);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "No autenticado",
      message: "Debe iniciar sesión para acceder a este recurso"
    });
  }

  // ─── Inyectar el usuario en el contexto del evento ────────────────────────
  // Los handlers de la API acceden al usuario autenticado mediante
  // event.context.user sin necesidad de re-leer la cookie.
  event.context.user = session.user;
});
