import { ref } from "vue";
import { useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

export function useAdviser() {
  const route = useRoute();
  const { postJson } = useApi();
  const { isAuthenticated, setSession } = useSession();

  const adviserNumber = ref("");
  const username = ref("");
  const password = ref("");
  const loading = ref(false);
  const errorMsg = ref("");

  // Estados para la modal de puntos de asesoría
  const showPuntosModal = ref(false);
  const puntosAsesoria = ref<PuntoAsesoria[]>([]);
  const selectedPunto = ref<PuntoAsesoria | null>(null);
  const authData = ref<AdviserAuthResponse | null>(null);

  const login = async () => {
    loading.value = true;
    errorMsg.value = "";

    try {
      const response = await postJson<ApiResponse<AdviserAuthResponse>>(
        "/api/auth/adviser/autenticar",
        {
          username: username.value,
          password: password.value
        }
      );

      const data = response.data;
      authData.value = data;

      const accessToken = String(data?.access_token || "");
      const _tokenType = String(data?.token_type || "bearer");
      const user = data?.user;

      if (!accessToken) {
        throw new Error("Respuesta inválida de autenticación");
      }

      // Validar que el usuario tenga rol de asesor
      const userRoles = Array.isArray(user?.roles) ? user.roles : [];
      if (!userRoles.includes("adviser")) {
        throw new Error("El usuario no tiene rol de asesor");
      }

      // Verificar si hay puntos de asesoría disponibles
      if (user?.puntos_asesorias && user.puntos_asesorias.length > 0) {
        puntosAsesoria.value = user.puntos_asesorias;
        showPuntosModal.value = true;
        return true; // Mantener en la página hasta que seleccione un punto
      }

      // Si no hay puntos, continuar con el flujo normal
      return await completeLogin(data);
    } catch (e: unknown) {
      const err = e as { statusCode?: number; response?: { status?: number }; data?: { code?: string; error?: string }; message?: string };
      const status = Number(err?.statusCode || err?.response?.status || 0);
      const code = err?.data?.code;

      if (status === 404 && code === "USER_NOT_FOUND") {
        errorMsg.value
          = "Asesor no encontrado. Verifique el número de asesor y credenciales.";
      } else if (status === 401) {
        errorMsg.value = "Credenciales incorrectas. Intente nuevamente.";
      } else if (status === 403) {
        errorMsg.value = "El usuario no tiene permisos de asesor.";
      } else {
        errorMsg.value
          = err?.data?.error
            || err?.message
            || "No fue posible iniciar sesión como asesor";
      }

      return false;
    } finally {
      loading.value = false;
    }
  };

  const checkAuthAndRedirect = async () => {
    const { ready } = useSession();
    await ready;

    if (isAuthenticated.value) {
      const redirect
        = typeof route.query.redirect === "string"
          ? route.query.redirect
          : "/adviser/dashboard";
      await navigateTo(redirect.startsWith("/") ? redirect : "/");
    }
  };

  const validateForm = (): boolean => {
    errorMsg.value = "";

    if (!username.value.trim()) {
      errorMsg.value = "El nombre de usuario es requerido";
      return false;
    }

    if (!password.value) {
      errorMsg.value = "La contraseña es requerida";
      return false;
    }

    if (password.value.length < 6) {
      errorMsg.value = "La contraseña debe tener al menos 6 caracteres";
      return false;
    }

    return true;
  };

  const completeLogin = async (data: AdviserAuthResponse) => {
    const accessToken = String(data?.access_token || "");
    const tokenType = String(data?.token_type || "bearer");
    const user = data?.user;

    setSession({
      accessToken,
      tokenType,
      user: {
        username:
          typeof user?.username === "string" ? user.username : username.value,
        roles: Array.isArray(user?.roles) ? user.roles : [],
        permissions: Array.isArray(user?.permissions) ? user.permissions : [],
        email: typeof user?.email === "string" ? user.email : "",
        tipo_documento:
          typeof user?.tipo_documento === "string" ? user.tipo_documento : "",
        numero_documento:
          typeof user?.numero_documento === "string"
            ? user.numero_documento
            : "",
        nombres: typeof user?.nombres === "string" ? user.nombres : "",
        apellidos: typeof user?.apellidos === "string" ? user.apellidos : "",
        adviser_number: "",
        asesor: user?.asesor,
        trabajador: user?.trabajador,
        selected_punto: selectedPunto.value || undefined
      }
    });

    // Redirigir al dashboard de asesores
    const redirect
      = typeof route.query.redirect === "string" ? route.query.redirect : "/dash";
    await navigateTo(redirect.startsWith("/") ? redirect : "/");

    return true;
  };

  const selectPuntoAsesoria = async (punto: PuntoAsesoria) => {
    selectedPunto.value = punto;
    showPuntosModal.value = false;

    if (authData.value) {
      await completeLogin(authData.value);
    }
  };

  const cancelPuntoSelection = () => {
    showPuntosModal.value = false;
    selectedPunto.value = null;
    authData.value = null;
  };

  return {
    adviserNumber,
    username,
    password,
    loading,
    errorMsg,
    login,
    checkAuthAndRedirect,
    validateForm,
    // Estados para la modal
    showPuntosModal,
    puntosAsesoria,
    selectPuntoAsesoria,
    cancelPuntoSelection
  };
}
