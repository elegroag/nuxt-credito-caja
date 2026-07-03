import { ref, computed, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { storage } from "~/composables/useStorage";
import {
  getTiposDocumentoOptions,
  getDefaultTipoDocumento
} from "~/lib/tipos_documento";

interface RegistroResponseData {
  user?: {
    username?: string
    roles?: string[]
  }
  access_token?: string
  token_type?: string
}

export function useRegistro() {
  const { postJson } = useApi();
  const errorMsg = ref("");

  const formData = ref<RegistroData>({
    tipo_documento: getDefaultTipoDocumento(), // Cédula de Ciudadanía por defecto
    numero_documento: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    email: "",
    username: "",
    password: "",
    confirmar_password: ""
  });

  const loading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);
  const pasoActual = ref(1);

  const tiposDocumento = getTiposDocumentoOptions();

  // Validaciones para cada paso
  const validarPaso1 = computed(() => {
    return (
      formData.value.tipo_documento
      && formData.value.numero_documento
      && formData.value.nombres
      && formData.value.apellidos
    );
  });

  const validarPaso2 = computed(() => {
    return formData.value.email && formData.value.telefono;
  });

  const validarPaso3 = computed(() => {
    return (
      formData.value.username
      && formData.value.password
      && formData.value.confirmar_password
      && formData.value.password.length >= 8
      && formData.value.password === formData.value.confirmar_password
    );
  });

  // Generar username por defecto
  watch(
    [() => formData.value.nombres, () => formData.value.apellidos],
    ([nombres, apellidos]) => {
      if (nombres && apellidos && !formData.value.username) {
        const nombrePart = nombres
          .trim()
          .replace(/\s/g, "")
          .substring(0, 4)
          .toLowerCase();
        const apellidoPart = apellidos
          .trim()
          .replace(/\s/g, "")
          .substring(0, 3)
          .toLowerCase();
        formData.value.username = `${nombrePart}${apellidoPart}`;
      }
    }
  );

  const pasoSiguiente = () => {
    if (pasoActual.value < 3) {
      pasoActual.value++;
    }
  };

  const pasoAnterior = () => {
    if (pasoActual.value > 1) {
      pasoActual.value--;
    }
  };

  const registrar = async () => {
    if (pasoActual.value !== 3) return false;

    errorMsg.value = "";

    if (formData.value.password !== formData.value.confirmar_password) {
      error.value = "Las contraseñas no coinciden";
      return false;
    }

    try {
      loading.value = true;
      error.value = null;

      const response = await postJson<{
        success: boolean
        data?: unknown
      }>(
        "/api/auth/register",
        formData.value
      );

      if (response) {
        success.value = true;
        const responseData = response.data as RegistroResponseData | undefined;
        const userData = {
          username: responseData?.user?.username || "",
          email: formData.value.email,
          tipo_documento: formData.value.tipo_documento,
          numero_documento: formData.value.numero_documento,
          nombres: formData.value.nombres,
          apellidos: formData.value.apellidos,
          roles: responseData?.user?.roles || ["user"]
        };

        // Guardar token y usuario en storage con las claves que usa useSession
        if (responseData?.access_token) {
          await storage.setItem("comfaca_credito_access_token", responseData.access_token);
          await storage.setItem(
            "comfaca_credito_token_type",
            responseData.token_type || "bearer"
          );
        }
        await storage.setItem("comfaca_credito_user", JSON.stringify(userData));

        const q = new URLSearchParams();
        q.set("coddoc", userData.tipo_documento);
        q.set("documento", userData.numero_documento);
        await navigateTo(`/verify?${q.toString()}`);
        return true;
      }
      errorMsg.value = "Error en el registro. Por favor, inténtalo de nuevo.";
      return false;
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number; data?: { error?: string } }; data?: { error?: string }; message?: string };
      if (errObj.response?.status === 409) {
        error.value = "El usuario ya existe. Por favor, usa otro nombre de usuario o inicia sesión.";
      } else if (errObj.response?.data?.error) {
        error.value = errObj.response.data.error;
      } else {
        error.value = "Error en el registro. Por favor, inténtalo de nuevo.";
      }

      errorMsg.value = errObj.data?.error || errObj.message || "No fue posible registrar el usuario";
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    formData,
    loading,
    error,
    errorMsg,
    success,
    pasoActual,
    tiposDocumento,
    validarPaso1,
    validarPaso2,
    validarPaso3,
    pasoSiguiente,
    pasoAnterior,
    registrar
  };
}