import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { getDefaultTipoDocumento } from "~/lib/tipos_documento";
import type { CreateUserForm } from "~~/shared/types/admin-usuarios";

export function useCreateUser() {
  const router = useRouter();
  const { postJson } = useApi();
  const { ready } = useSession();

  // Estado del formulario
  const loading = ref(false);
  const errors = ref<Record<string, string>>({});

  // Formulario reactivo
  const form = reactive<CreateUserForm>({
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

    // Validar contraseña
    if (!form.password) {
      errors.value.password = "La contraseña es requerida";
    } else if (form.password.length < 8) {
      errors.value.password = "La contraseña debe tener al menos 8 caracteres";
    }

    // Validar confirmación de contraseña
    if (!form.confirmPassword) {
      errors.value.confirmPassword
        = "La confirmación de contraseña es requerida";
    } else if (form.password !== form.confirmPassword) {
      errors.value.confirmPassword = "Las contraseñas no coinciden";
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
    errors.value = {};

    try {
      await ready;

      // Preparar payload para el backend
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        roles: form.roles,
        disabled: form.disabled,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        phone: form.phone.trim()
      };

      const response = await postJson<{
        success: boolean
        message: string
        data?: unknown
      }>("/api/admin/users/create", payload, { auth: true });

      if (response.success) {
        // Redirigir a la página de usuarios
        router.push("/admin/users");
      } else {
        // Mostrar error genérico
        errors.value.general = response.message || "Error al crear el usuario";
      }
    } catch (error: unknown) {
      console.error("Error al crear usuario:", error);

      // Manejar errores específicos del backend
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("username")) {
        errors.value.username = "El nombre de usuario ya existe";
      } else if (message.includes("email")) {
        errors.value.email = "El email ya está registrado";
      } else {
        errors.value.general = message || "Error al crear el usuario";
      }
    } finally {
      loading.value = false;
    }
  };

  // Resetear formulario
  const resetForm = () => {
    Object.assign(form, {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      roles: [],
      disabled: false,
      nombre: "",
      apellido: "",
      tipo_documento: getDefaultTipoDocumento(), // Cédula de Ciudadanía
      numero_documento: "",
      phone: ""
    });
    errors.value = {};
  };

  // Navegación
  const goBack = () => {
    router.back();
  };

  // Retornar todo lo necesario
  return {
    // Estado
    loading,
    errors,
    form,

    // Métodos
    validateForm,
    handleSubmit,
    resetForm,
    goBack
  };
}
