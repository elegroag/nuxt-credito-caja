// frontend/pages/perfil/usePerfil.ts
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useSession } from "~/composables/useSession";
import { useApi } from "~/composables/useApi";

type ApiSuccessResponse<T> = {
  success: boolean
  message?: string
  data?: T
};

type PerfilApiData = {
  id: string
  username: string
  email: string
  full_name?: string | null
  phone?: string | null
  tipo_documento?: string | null
  numero_documento?: string | null
  nombres?: string | null
  apellidos?: string | null
};

export function usePerfil() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const { getJson, putJson } = useApi();

  const perfil = ref<Perfil>({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    tipo_documento: "",
    numero_documento: "",
    nombres: "",
    apellidos: ""
  });

  const passwordData = ref<PasswordData>({
    password_actual: "",
    nueva_password: "",
    confirmar_password: ""
  });

  const loading = ref(false);
  const guardando = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);

  const hasPasswordChange = computed(() => {
    return Boolean(
      passwordData.value.password_actual
      || passwordData.value.nueva_password
      || passwordData.value.confirmar_password
    );
  });

  const validarPassword = () => {
    if (!hasPasswordChange.value) {
      return true;
    }

    if (!passwordData.value.password_actual) {
      error.value = "Debes ingresar la contraseña actual";
      return false;
    }

    if (!passwordData.value.nueva_password) {
      error.value = "Debes ingresar la nueva contraseña";
      return false;
    }

    if (passwordData.value.nueva_password.length < 8) {
      error.value = "La nueva contraseña debe tener al menos 8 caracteres";
      return false;
    }

    const pwd = passwordData.value.nueva_password;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    if (!(hasUpper && hasLower && hasDigit)) {
      error.value
        = "La nueva contraseña debe contener mayúsculas, minúsculas y números";
      return false;
    }

    if (
      passwordData.value.nueva_password
      !== passwordData.value.confirmar_password
    ) {
      error.value = "Las contraseñas no coinciden";
      return false;
    }

    return true;
  };

  const sync_full_name = () => {
    const fullName = `${perfil.value.nombres} ${perfil.value.apellidos}`.trim();
    perfil.value.full_name = fullName;
  };

  watch(
    () => [perfil.value.nombres, perfil.value.apellidos],
    () => {
      sync_full_name();
    }
  );

  const cargarPerfil = async () => {
    try {
      loading.value = true;
      error.value = null;

      const data = await getJson<ApiSuccessResponse<PerfilApiData>>(
        "/api/user/perfil",
        { auth: true }
      );
      if (data?.success && data.data) {
        perfil.value = {
          username: String(data.data.username || ""),
          email: String(data.data.email || ""),
          full_name: String(data.data.full_name || ""),
          phone: String(data.data.phone || ""),
          tipo_documento: String(data.data.tipo_documento || ""),
          numero_documento: String(data.data.numero_documento || ""),
          nombres: String(data.data.nombres || ""),
          apellidos: String(data.data.apellidos || "")
        };
      } else if (session.value.user) {
        const user = session.value.user;
        perfil.value.username = user.username || "";
        perfil.value.email = user.email || "";
        perfil.value.tipo_documento = user.tipo_documento || "";
        perfil.value.numero_documento = user.numero_documento || "";
        perfil.value.nombres = user.nombres || "";
        perfil.value.apellidos = user.apellidos || "";
        sync_full_name();
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      error.value = "No se pudo cargar el perfil. Intenta de nuevo.";
      if (session.value.user) {
        const user = session.value.user;
        perfil.value.username = user.username || "";
        perfil.value.email = user.email || "";
        perfil.value.tipo_documento = user.tipo_documento || "";
        perfil.value.numero_documento = user.numero_documento || "";
        perfil.value.nombres = user.nombres || "";
        perfil.value.apellidos = user.apellidos || "";
        sync_full_name();
      }
    } finally {
      loading.value = false;
    }
  };

  const recargarPerfil = async () => {
    await cargarPerfil();
  };

  const guardarPerfil = async () => {
    try {
      guardando.value = true;
      error.value = null;
      success.value = false;

      sync_full_name();

      if (!validarPassword()) {
        guardando.value = false;
        return;
      }

      const updatePayload: Record<string, string> = {
        email: perfil.value.email,
        phone: perfil.value.phone,
        full_name: perfil.value.full_name
      };

      const updateResp = await putJson<ApiSuccessResponse<PerfilApiData>>(
        "/api/user/perfil",
        updatePayload,
        { auth: true }
      );
      if (updateResp?.success && updateResp.data) {
        perfil.value = {
          username: String(updateResp.data.username || ""),
          email: String(updateResp.data.email || ""),
          full_name: String(updateResp.data.full_name || ""),
          phone: String(updateResp.data.phone || ""),
          tipo_documento: String(updateResp.data.tipo_documento || ""),
          numero_documento: String(updateResp.data.numero_documento || ""),
          nombres: String(updateResp.data.nombres || ""),
          apellidos: String(updateResp.data.apellidos || "")
        };
      }

      if (hasPasswordChange.value) {
        await putJson<ApiSuccessResponse<null>>(
          "/api/user/perfil/password-change",
          {
            current_password: passwordData.value.password_actual,
            new_password: passwordData.value.nueva_password
          },
          { auth: true }
        );
      }

      if (session.value.user) {
        await setSession({
          ...session.value,
          user: {
            ...session.value.user,
            email: perfil.value.email,
            nombres: perfil.value.nombres,
            apellidos: perfil.value.apellidos
          }
        });
      }

      success.value = true;
      passwordData.value = {
        password_actual: "",
        nueva_password: "",
        confirmar_password: ""
      };

      setTimeout(() => {
        success.value = false;
      }, 3000);
    } catch (err: unknown) {
      console.error("Error al guardar perfil:", err);
      error.value = "Error al guardar los cambios. Intenta de nuevo.";
    } finally {
      guardando.value = false;
    }
  };

  // Resetear formulario de contraseña
  const resetPasswordForm = () => {
    passwordData.value = {
      password_actual: "",
      nueva_password: "",
      confirmar_password: ""
    };
  };

  onMounted(async () => {
    if (!session.value || !session.value.user) {
      console.error("Usuario no autenticado");
      router.push("/login");
      return;
    }

    const user = session.value.user;
    perfil.value.username = user.username || "";
    perfil.value.email = user.email || "";
    perfil.value.tipo_documento = user.tipo_documento || "";
    perfil.value.numero_documento = user.numero_documento || "";
    perfil.value.nombres = user.nombres || "";
    perfil.value.apellidos = user.apellidos || "";
    sync_full_name();

    await cargarPerfil();
  });

  return {
    perfil,
    passwordData,
    loading,
    guardando,
    error,
    success,
    guardarPerfil,
    recargarPerfil,
    resetPasswordForm
  };
}
