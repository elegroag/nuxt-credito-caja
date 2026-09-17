import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

export function useShowUser() {
  const router = useRouter();
  const route = useRoute();
  const { getJson, putJson } = useApi();
  const { ready } = useSession();

  // Estado
  const loading = ref(false);
  const error = ref("");
  const usuario = ref<Usuario | null>(null);

  // Cargar usuario
  const cargarUsuario = async () => {
    loading.value = true;
    error.value = "";

    try {
      await ready;

      const response = await getJson<{
        success: boolean
        data: Usuario
        message?: string
      }>(`/api/admin/users/${route.params.id}`, { auth: true });

      if (response.success && response.data) {
        usuario.value = response.data;
      } else {
        error.value
          = response.message || "No se pudo cargar la información del usuario";
      }
    } catch (err: unknown) {
      console.error("Error al cargar usuario:", err);
      const message = err instanceof Error ? err.message : String(err);
      error.value = message || "Error al cargar el usuario";
    } finally {
      loading.value = false;
    }
  };

  // Toggle estado de usuario
  const toggleEstadoUsuario = async () => {
    if (!usuario.value) return;

    try {
      await ready;

      const nuevoEstado
        = usuario.value.is_active ? "inactive" : "active";

      const response = await putJson<{
        success: boolean
        message: string
      }>(`/api/admin/users/${usuario.value.id}/estado`, {}, { auth: true });

      if (response.success) {
        usuario.value.is_active = nuevoEstado === "active";
        usuario.value.estado = nuevoEstado;
      } else {
        error.value = response.message || "No se pudo cambiar el estado";
      }
    } catch (err: unknown) {
      console.error("Error al cambiar estado:", err);
      const message = err instanceof Error ? err.message : String(err);
      error.value = message || "Error al cambiar el estado";
    }
  };

  // Navegación
  const goBack = () => {
    router.back();
  };

  const editarUsuario = () => {
    if (usuario.value) {
      router.push(`/admin/users/edit/${usuario.value.id}`);
    }
  };

  // Utilidades
  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      administrator: "Administrador",
      adviser: "Asesor",
      user_trabajador: "Trabajador",
      user_codeudor: "Codeudor",
      user_empresa: "Empresa",
      admin: "Administrador",
      user: "Usuario",
      trabajador: "Trabajador",
      empresa: "Empresa"
    };
    return roles[rol] || rol;
  };

  const getRolVariant = (
    rol: string
  ): "solid" | "outline" | "soft" | "subtle" => {
    const variants: Record<string, "solid" | "outline" | "soft" | "subtle"> = {
      administrator: "solid",
      adviser: "outline",
      user_trabajador: "soft",
      user_codeudor: "subtle",
      user_empresa: "outline",
      admin: "solid",
      user: "soft",
      trabajador: "soft",
      empresa: "outline"
    };
    return variants[rol] || "soft";
  };

  const getEstadoLabel = (estado: string) => {
    const estados: Record<string, string> = {
      active: "Activo",
      inactive: "Inactivo",
      suspended: "Suspendido"
    };
    return estados[estado] || estado;
  };

  const getEstadoVariant = (
    estado: string
  ): "solid" | "outline" | "soft" | "subtle" => {
    const variants: Record<string, "solid" | "outline" | "soft" | "subtle"> = {
      active: "soft",
      inactive: "outline",
      suspended: "solid"
    };
    return variants[estado] || "soft";
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      1: "Cédula de Ciudadanía",
      2: "Cédula de Extranjería",
      3: "Tarjeta de Identidad",
      4: "Pasaporte"
    };
    return tipos[tipo] || tipo;
  };

  const getTipoViviendaLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      propia: "Propia",
      arrendada: "Arrendada",
      familiar: "Casa de familiar",
      otra: "Otra"
    };
    return tipos[tipo] || tipo || "No especificada";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  // Retornar todo lo necesario
  return {
    // Estado
    loading,
    error,
    usuario,

    // Métodos
    cargarUsuario,
    toggleEstadoUsuario,
    goBack,
    editarUsuario,

    // Utilidades
    getRolLabel,
    getRolVariant,
    getEstadoLabel,
    getEstadoVariant,
    getTipoDocumentoLabel,
    getTipoViviendaLabel,
    formatDate
  };
}
