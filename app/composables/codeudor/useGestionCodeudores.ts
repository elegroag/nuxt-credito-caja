interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
}

export interface CodeudorVinculo {
  id: number
  estado: string
  autorizado_at?: string | null
  created_at?: string | null
  codeudor: {
    id: number
    username: string
    email: string
    full_name: string | null
    tipo_documento: string | null
    numero_documento: string | null
    phone?: string | null
  }
}

export interface CrearCodeudorPayload {
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  email: string
  phone?: string | null
  titular_user_id?: number
}

export const useGestionCodeudores = () => {
  const api = useApi();
  const loading = ref(false);
  const confirming = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const vinculos = ref<CodeudorVinculo[]>([]);
  const pendingConfirmId = ref<number | null>(null);
  const codigo = ref("");

  const form = reactive({
    tipo_documento: "1",
    numero_documento: "",
    nombres: "",
    apellidos: "",
    email: "",
    phone: ""
  });

  const listar = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.getJson<ApiResponse<CodeudorVinculo[]>>(
        "/api/codeudores",
        { auth: true }
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible listar codeudores");
      }
      vinculos.value = response.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Error al listar codeudores";
    } finally {
      loading.value = false;
    }
  };

  const crear = async () => {
    loading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const payload: CrearCodeudorPayload = {
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null
      };
      const response = await api.postJson<ApiResponse<CodeudorVinculo>>(
        "/api/codeudores",
        payload,
        { auth: true }
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible registrar el codeudor");
      }
      pendingConfirmId.value = response.data.id;
      codigo.value = "";
      successMessage.value
        = "Se envió un código al correo del codeudor. Ingrésalo para autorizar el vínculo.";
      await listar();
      return response.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Error al registrar codeudor";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const confirmar = async (vinculoId?: number) => {
    const id = vinculoId ?? pendingConfirmId.value;
    if (!id) return false;
    confirming.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const response = await api.postJson<ApiResponse<{ id: number, estado: string }>>(
        `/api/codeudores/${id}/confirmar`,
        { codigo: codigo.value.trim() },
        { auth: true }
      );
      if (!response.success) {
        throw new Error(response.message || "Código inválido");
      }
      successMessage.value = "Codeudor autorizado correctamente.";
      pendingConfirmId.value = null;
      codigo.value = "";
      await listar();
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Error al confirmar código";
      return false;
    } finally {
      confirming.value = false;
    }
  };

  const reenviar = async (vinculoId: number) => {
    loading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const response = await api.postJson<ApiResponse<{ codigo_enviado: boolean }>>(
        `/api/codeudores/${vinculoId}/reenviar-codigo`,
        {},
        { auth: true }
      );
      if (!response.success) {
        throw new Error(response.message || "No fue posible reenviar el código");
      }
      pendingConfirmId.value = vinculoId;
      successMessage.value = "Código reenviado al correo del codeudor.";
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Error al reenviar código";
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    confirming,
    error,
    successMessage,
    vinculos,
    pendingConfirmId,
    codigo,
    form,
    listar,
    crear,
    confirmar,
    reenviar
  };
};
