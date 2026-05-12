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
    } catch (err: any) {
      console.error("Error al cargar usuario:", err);
      error.value = err.message || "Error al cargar el usuario";
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
        = usuario.value.estado === "active" ? "inactive" : "active";

      const response = await putJson<{
        success: boolean
        message: string
      }>(`/api/admin/users/${usuario.value.id}/estado`, {}, { auth: true });

      if (response.success) {
        // Actualizar el usuario localmente
        usuario.value.estado = nuevoEstado;
      } else {
        error.value = response.message || "No se pudo cambiar el estado";
      }
    } catch (err: any) {
      console.error("Error al cambiar estado:", err);
      error.value = err.message || "Error al cambiar el estado";
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
      admin: "Administrador",
      user: "Usuario",
      trabajador: "Trabajador",
      empresa: "Empresa"
    };
    return roles[rol] || rol;
  };

  const getRolVariant = (
    rol: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<
      string,
      "default" | "destructive" | "outline" | "secondary"
    > = {
      admin: "destructive",
      user: "default",
      trabajador: "secondary",
      empresa: "outline"
    };
    return variants[rol] || "default";
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
  ): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<
      string,
      "default" | "destructive" | "outline" | "secondary"
    > = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive"
    };
    return variants[estado] || "default";
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
