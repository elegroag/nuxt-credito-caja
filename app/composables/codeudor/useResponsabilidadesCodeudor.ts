interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
}

export interface ResponsabilidadItem {
  solicitud_id: string
  valor_solicitud: number
  plazo_meses: number
  estado: string
  fecha_radicado: string | null
  cuota_mensual: number | null
  tipo_credito: string | null
  detalle_modalidad: string | null
  rol_firmante: string
  orden_firmante: number
  nombre_firmante: string
  email_firmante: string
}

export interface ResponsabilidadesResumen {
  total: number
  valor_total: number
  items: ResponsabilidadItem[]
}

export interface ResponsabilidadDetalle {
  solicitud_id: string
  valor_solicitud: number
  plazo_meses: number
  tasa_interes: number
  estado: string
  fecha_radicado: string | null
  cuota_mensual: number | null
  tipo_credito: string | null
  detalle_modalidad: string | null
  moneda: string
  firmante: {
    rol: string
    orden: number
    nombre_completo: string
    numero_documento: string
    email: string
    telefono: string | null
  }
  solicitante: {
    nombres: string | null
    apellidos: string | null
    numero_documento: string | null
    tipo_documento: string | null
  } | null
}

export const useResponsabilidadesCodeudor = () => {
  const api = useApi();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const resumen = ref<ResponsabilidadesResumen>({
    total: 0,
    valor_total: 0,
    items: []
  });
  const detalle = ref<ResponsabilidadDetalle | null>(null);

  const cargarResumen = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.getJson<ApiResponse<ResponsabilidadesResumen>>(
        "/api/codeudores/responsabilidades",
        { auth: true }
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible cargar responsabilidades");
      }
      resumen.value = response.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Error al cargar responsabilidades";
    } finally {
      loading.value = false;
    }
  };

  const cargarDetalle = async (solicitudId: string) => {
    loading.value = true;
    error.value = null;
    detalle.value = null;
    try {
      const encoded = encodeURIComponent(solicitudId);
      const response = await api.getJson<ApiResponse<ResponsabilidadDetalle>>(
        `/api/codeudores/responsabilidades/${encoded}`,
        { auth: true }
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || "No fue posible cargar el detalle");
      }
      detalle.value = response.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Error al cargar detalle";
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    resumen,
    detalle,
    cargarResumen,
    cargarDetalle
  };
};
