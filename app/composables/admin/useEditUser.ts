import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { getDefaultTipoDocumento } from "~/lib/tipos_documento";
import type { EditUserForm } from "~~/shared/types/admin-usuarios";

export function useEditUser() {
  const router = useRouter();
  const route = useRoute();
  const { getJson, putJson } = useApi();
  const { ready } = useSession();

  // Estado
  const loading = ref(false);
  const error = ref("");
  const usuario = ref<{
    nombres?: string
    apellidos?: string
  } | null>(null);

  // Formulario reactivo
  const form = reactive<EditUserForm>({
    // Información básica
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [],
    disabled: false,

    // Datos personales
    nombre: "",
    apellido: "",
    tipo_documento: getDefaultTipoDocumento(), // Cédula de Ciudadanía
    numero_documento: "",
    phone: ""
  });

  // Errores
  const errors = ref<Record<string, string>>({});

  // Cargar usuario
  const cargarUsuario = async () => {
    loading.value = true;
    error.value = "";

    try {
      await ready;

      const response = await getJson<{
        success: boolean
        data: {
          username?: string
          email?: string
          nombres?: string
          nombre?: string
          apellidos?: string
          apellido?: string
          roles?: string[]
          disabled?: boolean
          tipo_documento?: string
          numero_documento?: string
          phone?: string
          telefono?: string
        }
        message?: string
      }>(`/api/admin/users/${route.params.id}`, { auth: true });

      if (response.success && response.data) {
        usuario.value = response.data;

        // Cargar formulario con datos del usuario
        form.username = response.data.username || "";
        form.email = response.data.email || "";
        form.nombre = response.data.nombres || response.data.nombre || "";
        form.apellido = response.data.apellidos || response.data.apellido || "";
        form.roles = response.data.roles || [];
        form.disabled = response.data.disabled || false;
        form.tipo_documento
          = response.data.tipo_documento || getDefaultTipoDocumento();
        form.numero_documento = response.data.numero_documento || "";
        form.phone = response.data.phone || response.data.telefono || "";
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

  // Validaciones
  const validateForm = (): boolean => {
    errors.value = {};

    // Validar username
    if (!form.username.trim()) {
      errors.value.username = "El nombre de usuario es requerido";
    } else if (form.username.length < 3) {
      errors.value.username
        = "El nombre de usuario debe tener al menos 3 caracteres";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      errors.value.email = "El email es requerido";
    } else if (!emailRegex.test(form.email)) {
      errors.value.email = "El formato del email no es válido";
    }

    // Validar contraseña solo si se proporciona
    if (form.password) {
      if (form.password.length < 8) {
        errors.value.password
          = "La contraseña debe tener al menos 8 caracteres";
      }

      if (form.confirmPassword) {
        if (form.password !== form.confirmPassword) {
          errors.value.confirmPassword = "Las contraseñas no coinciden";
        }
      }
    }

    // Validar roles
    if (!form.roles || form.roles.length === 0) {
      errors.value.roles = "Debe seleccionar al menos un rol";
    }

    // Validar nombre
    if (!form.nombre.trim()) {
      errors.value.nombre = "El nombre es requerido";
    }

    // Validar apellido
    if (!form.apellido.trim()) {
      errors.value.apellido = "El apellido es requerido";
    }

    // Validar número de documento si se proporciona tipo
    if (form.tipo_documento && !form.numero_documento.trim()) {
      errors.value.numero_documento
        = "El número de documento es requerido cuando se especifica el tipo";
    }

    return Object.keys(errors.value).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    loading.value = true;

    try {
      await ready;

      // Preparar payload para el backend
      const payload: Record<string, unknown> = {
        username: form.username.trim(),
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        roles: form.roles,
        disabled: form.disabled,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        phone: form.phone.trim()
      };

      // Agregar contraseña solo si se proporciona
      if (form.password) {
        payload.password = form.password;
      }

      const response = await putJson<{
        success: boolean
        message: string
      }>(`/api/admin/users/${route.params.id}`, payload, { auth: true });

      if (response.success) {
        // Redirigir a la página de detalle
        router.push(`/admin/users/show/${route.params.id}`);
      } else {
        // Mostrar error genérico
        errors.value.general
          = response.message || "Error al actualizar el usuario";
      }
    } catch (error: unknown) {
      console.error("Error al actualizar usuario:", error);

      // Manejar errores específicos del backend
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("username")) {
        errors.value.username = "El nombre de usuario ya existe";
} else if (message.includes("email")) {
        errors.value.email = "El email ya está registrado";
      } else {
        errors.value.general = message || "Error al actualizar el usuario";
      }
    } finally {
      loading.value = false;
    }
  };

  // Resetear formulario a datos originales
  const resetForm = () => {
    if (usuario.value && typeof usuario.value === 'object') {
      const userData = usuario.value as {
        username?: string
        email?: string
        nombres?: string
        nombre?: string
        apellidos?: string
        apellido?: string
        roles?: string[]
        disabled?: boolean
        tipo_documento?: string
        numero_documento?: string
        phone?: string
        telefono?: string
      };
      form.username = userData.username || "";
      form.email = userData.email || "";
      form.nombre = userData.nombres || userData.nombre || "";
      form.apellido = userData.apellidos || userData.apellido || "";
      form.roles = userData.roles || [];
      form.disabled = userData.disabled || false;
      form.tipo_documento
        = userData.tipo_documento || getDefaultTipoDocumento();
      form.numero_documento = userData.numero_documento || "";
      form.phone = userData.phone || userData.telefono || "";
      form.password = "";
      form.confirmPassword = "";
    }
    errors.value = {};
  };

  // Navegación
  const goBack = () => {
    router.back();
  };

  // Lifecycle
  onMounted(() => {
    cargarUsuario();
  });

  // Retornar todo lo necesario
  return {
    // Estado
    loading,
    error,
    usuario,
    errors,
    form,

    // Métodos
    cargarUsuario,
    validateForm,
    handleSubmit,
    resetForm,
    goBack
  };
}
