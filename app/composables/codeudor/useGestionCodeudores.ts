interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
  error?: string
}

export type CodeudorHallazgo
  = "YA_VINCULADO_AUTORIZADO"
    | "YA_VINCULADO_PENDIENTE"
    | null

export interface CodeudorVinculo {
  id: number
  estado: string
  autorizado_at?: string | null
  created_at?: string | null
  hallazgo?: CodeudorHallazgo
  mensaje?: string
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

export interface CrearCodeudorResult {
  vinculo: CodeudorVinculo | null
  hallazgo: CodeudorHallazgo
  mensaje: string | null
}

const extractApiErrorMessage = (e: unknown, fallback: string): string => {
  if (!e || typeof e !== "object") return fallback;

  const err = e as {
    data?: {
      error?: string
      message?: string
      data?: { mensaje?: string, hallazgo?: string }
    }
    statusMessage?: string
    message?: string
  };

  const fromBody
    = err.data?.error
      || err.data?.data?.mensaje
      || err.data?.message;

  if (typeof fromBody === "string" && fromBody.trim()) {
    if (
      !/^\s*\[(POST|GET|PUT|DELETE|PATCH)\]/i.test(fromBody)
      && !/^\d{3}\s+Conflict/i.test(fromBody)
    ) {
      return fromBody;
    }
  }

  if (
    typeof err.statusMessage === "string"
    && err.statusMessage.trim()
    && err.statusMessage !== "Conflict"
  ) {
    return err.statusMessage;
  }

  return fallback;
};

export const useGestionCodeudores = (options?: {
  titularUserId?: MaybeRefOrGetter<number | string | null | undefined>
}) => {
  const api = useApi();
  const loading = ref(false);
  const confirming = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const infoMessage = ref<string | null>(null);
  const vinculos = ref<CodeudorVinculo[]>([]);
  const pendingConfirmId = ref<number | null>(null);
  const codigo = ref("");

  const titularId = computed(() => {
    const raw = toValue(options?.titularUserId);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  });

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
      const qs = titularId.value
        ? `?titular_user_id=${titularId.value}`
        : "";
      const response = await api.getJson<ApiResponse<CodeudorVinculo[]>>(
        `/api/codeudores${qs}`,
        { auth: true }
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible listar codeudores");
      }
      vinculos.value = response.data;
    } catch (e: unknown) {
      error.value = extractApiErrorMessage(e, "Error al listar codeudores");
    } finally {
      loading.value = false;
    }
  };

  const crear = async (): Promise<CrearCodeudorResult> => {
    loading.value = true;
    error.value = null;
    successMessage.value = null;
    infoMessage.value = null;
    try {
      const payload: CrearCodeudorPayload = {
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        ...(titularId.value ? { titular_user_id: titularId.value } : {})
      };
      const response = await api.postJson<ApiResponse<CodeudorVinculo>>(
        "/api/codeudores",
        payload,
        { auth: true }
      );
      if (!response.success || !response.data) {
        throw new Error(
          response.error || response.message || "No fue posible registrar el codeudor"
        );
      }

      const hallazgo = response.data.hallazgo ?? null;
      const mensaje
        = response.data.mensaje || response.message || null;

      await listar();

      if (hallazgo === "YA_VINCULADO_AUTORIZADO") {
        infoMessage.value = mensaje;
        pendingConfirmId.value = null;
        codigo.value = "";
        return { vinculo: response.data, hallazgo, mensaje };
      }

      if (hallazgo === "YA_VINCULADO_PENDIENTE") {
        infoMessage.value = mensaje;
        pendingConfirmId.value = response.data.id;
        codigo.value = "";
        return { vinculo: response.data, hallazgo, mensaje };
      }

      pendingConfirmId.value = response.data.id;
      codigo.value = "";
      successMessage.value
        = "Se envió un código al correo del codeudor. Ingrésalo para autorizar el vínculo.";
      return { vinculo: response.data, hallazgo: null, mensaje: successMessage.value };
    } catch (e: unknown) {
      error.value = extractApiErrorMessage(
        e,
        "No fue posible registrar el codeudor. Verifica los datos e intenta de nuevo."
      );
      return { vinculo: null, hallazgo: null, mensaje: null };
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
        throw new Error(response.error || response.message || "Código inválido");
      }
      successMessage.value = "Codeudor autorizado correctamente.";
      pendingConfirmId.value = null;
      codigo.value = "";
      await listar();
      return true;
    } catch (e: unknown) {
      error.value = extractApiErrorMessage(e, "Error al confirmar código");
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
        throw new Error(response.error || response.message || "No fue posible reenviar el código");
      }
      pendingConfirmId.value = vinculoId;
      successMessage.value = "Código reenviado al correo del codeudor.";
      return true;
    } catch (e: unknown) {
      error.value = extractApiErrorMessage(e, "Error al reenviar código");
      return false;
    } finally {
      loading.value = false;
    }
  };

  const eliminar = async (vinculoId: number) => {
    loading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const response = await api.deleteJson<ApiResponse<{ id: number, eliminado: boolean }>>(
        `/api/codeudores/${vinculoId}`,
        {},
        { auth: true }
      );
      if (!response.success) {
        throw new Error(response.error || response.message || "No fue posible eliminar el vínculo");
      }
      if (pendingConfirmId.value === vinculoId) {
        pendingConfirmId.value = null;
        codigo.value = "";
      }
      successMessage.value = "Vínculo con codeudor eliminado.";
      await listar();
      return true;
    } catch (e: unknown) {
      error.value = extractApiErrorMessage(e, "Error al eliminar vínculo");
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
    infoMessage,
    vinculos,
    pendingConfirmId,
    codigo,
    form,
    titularId,
    listar,
    crear,
    confirmar,
    reenviar,
    eliminar
  };
};
