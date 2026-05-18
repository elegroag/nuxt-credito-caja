// frontend/composables/auth/useLogin.ts
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

interface LoginResponseData {
  access_token?: string
  token_type?: string
  user?: {
    username?: string
    roles?: string[]
    permissions?: string[]
    email?: string
    tipo_documento?: string
    numero_documento?: string
    nombres?: string
    apellidos?: string
    trabajador?: Record<string, unknown>
  }
}

export function useLogin() {
  const route = useRoute();
  const { postJson } = useApi();
  const { isAuthenticated, setSession } = useSession();

  const username = ref("");
  const password = ref("");
  const loading = ref(false);
  const errorMsg = ref("");

  const login = async () => {
    loading.value = true;
    errorMsg.value = "";

    try {
      const response = await postJson<{
        success: boolean
        data?: unknown
      }>("/api/auth/login", {
        username: username.value,
        password: password.value
      });
      const data = response.data as LoginResponseData | undefined;

      const accessToken = String(data?.access_token || "");
      const tokenType = String(data?.token_type || "bearer");
      const user = data?.user;
      const trabajadorData = user?.trabajador;

      if (!accessToken) {
        throw new Error("Respuesta inválida de autenticación");
      }

      // Validar y extraer datos del trabajador
      let trabajador: Trabajador | undefined;
      if (trabajadorData && typeof trabajadorData === "object") {
        trabajador = {
          cargo:
            typeof trabajadorData.cargo === "string"
              ? trabajadorData.cargo
              : "",
          cedula:
            typeof trabajadorData.cedula === "string"
              ? trabajadorData.cedula
              : "",
          ciudad_codigo:
            typeof trabajadorData.ciudad_codigo === "string"
              ? trabajadorData.ciudad_codigo
              : "",
          ciudad_nacimiento:
            typeof trabajadorData.ciudad_nacimiento === "string"
              ? trabajadorData.ciudad_nacimiento
              : "",
          direccion:
            typeof trabajadorData.direccion === "string"
              ? trabajadorData.direccion
              : "",
          email:
            typeof trabajadorData.email === "string"
              ? trabajadorData.email
              : "",
          empresa:
          typeof trabajadorData.empresa === "object" && trabajadorData.empresa !== null
          ? {
          ciudad_codigo:
          typeof (trabajadorData.empresa as { ciudad_codigo?: unknown }).ciudad_codigo === "string"
          ? (trabajadorData.empresa as { ciudad_codigo: string }).ciudad_codigo
          : "",
          direccion:
          typeof (trabajadorData.empresa as { direccion?: unknown }).direccion === "string"
          ? (trabajadorData.empresa as { direccion: string }).direccion
          : "",
          nit:
          typeof (trabajadorData.empresa as { nit?: unknown }).nit === "string"
          ? (trabajadorData.empresa as { nit: string }).nit
          : "",
          razon_social:
          typeof (trabajadorData.empresa as { razon_social?: unknown }).razon_social === "string"
          ? (trabajadorData.empresa as { razon_social: string }).razon_social
          : "",
          telefono:
          typeof (trabajadorData.empresa as { telefono?: unknown }).telefono === "string"
          ? (trabajadorData.empresa as { telefono: string }).telefono
          : ""
          }
          : {
          ciudad_codigo: "",
          direccion: "",
          nit: "",
          razon_social: "",
          telefono: ""
          },
          estado:
            typeof trabajadorData.estado === "string"
              ? trabajadorData.estado
              : "",
          estado_civil:
            typeof trabajadorData.estado_civil === "string"
              ? trabajadorData.estado_civil
              : "",
          fecha_afiliacion:
            typeof trabajadorData.fecha_afiliacion === "string"
              ? trabajadorData.fecha_afiliacion
              : "",
          fecha_nacimiento:
            typeof trabajadorData.fecha_nacimiento === "string"
              ? trabajadorData.fecha_nacimiento
              : "",
          fecha_salario:
            typeof trabajadorData.fecha_salario === "string"
              ? trabajadorData.fecha_salario
              : "",
          nivel_educativo:
            typeof trabajadorData.nivel_educativo === "string"
              ? trabajadorData.nivel_educativo
              : "",
          primer_apellido:
            typeof trabajadorData.primer_apellido === "string"
              ? trabajadorData.primer_apellido
              : "",
          primer_nombre:
            typeof trabajadorData.primer_nombre === "string"
              ? trabajadorData.primer_nombre
              : "",
          salario:
            typeof trabajadorData.salario === "number"
              ? trabajadorData.salario
              : 0,
          segundo_apellido:
            typeof trabajadorData.segundo_apellido === "string"
              ? trabajadorData.segundo_apellido
              : "",
          segundo_nombre:
            typeof trabajadorData.segundo_nombre === "string"
              ? trabajadorData.segundo_nombre
              : "",
          sexo:
            typeof trabajadorData.sexo === "string" ? trabajadorData.sexo : "",
          telefono:
            typeof trabajadorData.telefono === "string"
              ? trabajadorData.telefono
              : "",
          tipo_documento:
            typeof trabajadorData.tipo_documento === "string"
              ? trabajadorData.tipo_documento
              : "",
          codigo_categoria:
            typeof trabajadorData.codigo_categoria === "string"
              ? trabajadorData.codigo_categoria
              : "",
          tipo_contrato:
            typeof trabajadorData.tipo_contrato === "string"
              ? trabajadorData.tipo_contrato
              : "",
          antiguedad_meses:
            typeof trabajadorData.antiguedad_meses === "number"
              ? trabajadorData.antiguedad_meses
              : 0
        };
      }

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
          trabajador
        }
      });

      const redirect
        = typeof route.query.redirect === "string"
          ? route.query.redirect
          : "/dash";
      await navigateTo(redirect.startsWith("/") ? redirect : "/dash");

      return true;
    } catch (e: unknown) {
      const err = e as { statusCode?: number; response?: { status?: number }; data?: { code?: string; error?: string }; message?: string };
      const status = Number(err?.statusCode || err?.response?.status || 0);
      const _code = err?.data?.code;

      if (status === 404 && _code === "USER_NOT_FOUND") {
        const redirect
          = typeof route.query.redirect === "string" ? route.query.redirect : "/";
        const q = new URLSearchParams();
        if (username.value.trim()) q.set("username", username.value.trim());
        if (redirect) q.set("redirect", redirect);
        await navigateTo(`/registro?${q.toString()}`);
        return false;
      }

      errorMsg.value
        = err?.data?.error || err?.message || "No fue posible iniciar sesión";
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
          : "/dash";
      await navigateTo(redirect.startsWith("/") ? redirect : "/dash");
    }
  };

  return {
    username,
    password,
    loading,
    errorMsg,
    login,
    checkAuthAndRedirect
  };
}
