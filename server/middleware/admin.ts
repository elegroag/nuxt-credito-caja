export default defineEventHandler(async (event) => {
  // Solo intercepta rutas de la API de acceso administrator
  if (!event.path.startsWith("/api/admin")) {
    return;
  }

  const session = await requireUserSession(event);
  const hasAdminRole = session.user.roles.includes("administrator");

  if (!hasAdminRole) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  return;
});
