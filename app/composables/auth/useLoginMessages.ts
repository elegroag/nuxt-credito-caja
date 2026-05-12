/**
 * Composable para manejar mensajes de login
 * Detecta si la sesión expiró y muestra mensajes apropiados
 */
export const useLoginMessages = () => {
  const route = useRoute();

  /**
     * Verifica si la sesión expiró
     */
  const isSessionExpired = computed(() => {
    return route.query.expired === "true";
  });

  /**
     * Obtiene el mensaje apropiado para mostrar
     */
  const getLoginMessage = computed(() => {
    if (isSessionExpired.value) {
      return {
        type: "warning",
        title: "Sesión Expirada",
        message: "Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente."
      };
    }

    return null;
  });

  /**
     * Limpia los parámetros de la URL después de mostrar el mensaje
     */
  const clearExpiredParam = () => {
    if (isSessionExpired.value) {
      const router = useRouter();
      const query = { ...route.query };
      delete query.expired;
      delete query.redirect;

      router.replace({
        path: route.path,
        query
      });
    }
  };

  return {
    isSessionExpired,
    getLoginMessage,
    clearExpiredParam
  };
};
