// Retorna los datos del usuario autenticado actual
export default defineEventHandler(async (event) => {
  // El middleware global ya verificó la sesión e inyectó el usuario
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "No autenticado",
    });
  }
  return {
    success: true,
    data: { user },
  };
});
