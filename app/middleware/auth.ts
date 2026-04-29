import type { RouteLocationNormalized } from "vue-router";
import { useSession } from "~/composables/useSession";
import {
  shouldApplyAuthMiddleware,
  hasPermissionForRoute,
} from "~/config/auth.config";

export default defineNuxtRouteMiddleware(
  async (to: RouteLocationNormalized) => {
    if (process.server) return;

    // Verificar si se debe aplicar middleware de autenticación
    if (!shouldApplyAuthMiddleware(to.path)) {
      return;
    }

    const { isAuthenticated, validateToken, clearSession, ready } =
      useSession();

    // Esperar a que la sesión se cargue desde el storage
    await ready;

    // Verificar si hay token localmente
    if (!isAuthenticated.value) {
      const redirect = encodeURIComponent(to.fullPath || "/");
      return navigateTo(`/login?redirect=${redirect}`);
    }

    // Validar token con backend en cada recarga/navegación
    const isValid = await validateToken();
    if (!isValid) {
      // Limpiar completamente todos los datos de sesión
      await clearSession();

      // Redirigir con indicador de sesión expirada
      const redirect = encodeURIComponent(to.fullPath || "/");
      return navigateTo(`/login?redirect=${redirect}&expired=true`);
    }

    // Verificar permisos específicos para la ruta
    if (
      !hasPermissionForRoute(
        to.path,
        useSession().session.value.user?.roles || [],
      )
    ) {
      return navigateTo("/dash");
    }

    // Token válido y permisos correctos, permitir acceso
    return;
  },
);
