import { ref, computed, readonly } from "vue";
import { useApi } from "~/composables/useApi";

const parametrosCache = ref<ParametrosResponse["data"] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

export const useParametros = () => {
  const { getJson } = useApi();

  const cargarParametros = async () => {
    if (parametrosCache.value) {
      return parametrosCache.value;
    }

    try {
      loading.value = true;
      error.value = null;

      const response = await getJson<ParametrosResponse>(
        "/api/lineas_credito/parametros",
        { auth: true }
      );

      if (response.success) {
        parametrosCache.value = response.data;
        return response;
      } else {
        throw new Error(response.message || "Error al cargar parámetros");
      }
    } catch (err: any) {
      console.error("Error cargando parámetros:", err);
      error.value = err.message || "No se pudieron cargar los parámetros";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getAuxiliaresContables = computed(() => {
    return parametrosCache.value?.auxiliares_contables || [];
  });

  const getCentrosCostos = computed(() => {
    return parametrosCache.value?.centros_de_costos || [];
  });

  const getDatosGeneralesCredito = computed(() => {
    return parametrosCache.value?.datos_generales_del_creditos[0] || null;
  });

  const getFormasPago = computed(() => {
    return parametrosCache.value?.formas_de_pago || [];
  });

  const getGarantiasPago = computed(() => {
    return parametrosCache.value?.garantia_de_pagos || [];
  });

  const getTiposCreditoVigencia = computed(() => {
    return parametrosCache.value?.tipos_de_credito_en_vigencia || [];
  });

  const getTiposInversion = computed(() => {
    return parametrosCache.value?.tipos_de_inversion || [];
  });

  const getTiposDocumentosRequeridos = computed(() => {
    return parametrosCache.value?.tipos_documentos_requeridos || [];
  });

  const getMotivosRechazo = computed(() => {
    return parametrosCache.value?.motivos_de_rechazos || [];
  });

  const getOficinasCredito = computed(() => {
    return parametrosCache.value?.oficinas_de_credito || [];
  });

  const getPeriodosPago = computed(() => {
    return parametrosCache.value?.periodos_de_pago || [];
  });

  const getPeriodosPagoDesembolsos = computed(() => {
    return parametrosCache.value?.periodos_de_pago_desembolsos || [];
  });

  const getEmpresasSeguros = computed(() => {
    return parametrosCache.value?.empresa_de_seguros || [];
  });

  const getMarcasRecibosCaja = computed(() => {
    return parametrosCache.value?.marcas_de_recibos_de_caja || [];
  });

  const getTiposDistribucion = computed(() => {
    return parametrosCache.value?.tipos_de_distribucion || [];
  });

  const getFondosCreditoSocial = computed(() => {
    return parametrosCache.value?.fondos_de_credito_social || [];
  });

  const getFormasPagoTesoreria = computed(() => {
    return parametrosCache.value?.formas_de_pagos_tesoreria || [];
  });

  const getTiposTerceros = computed(() => {
    return parametrosCache.value?.tipos_de_terceros || [];
  });

  const getDatosPeriodos = computed(() => {
    return parametrosCache.value?.datos_de_periodos || [];
  });

  const getOficinasAfiliacionUsuario = computed(() => {
    return parametrosCache.value?.oficinas_de_afiliacion_por_usuario || [];
  });

  // Función para obtener auxiliar por código
  const getAuxiliarPorCodigo = (codigo: string) => {
    return getAuxiliaresContables.value.find(aux => aux.auxiliar === codigo);
  };

  // Función para obtener tipo de crédito por tipcre
  const getTipoCreditoPorTipcre = (tipcre: string) => {
    return getTiposCreditoVigencia.value.find(cred => cred.tipcre === tipcre);
  };

  // Función para obtener oficina por código
  const getOficinaPorCodigo = (codigo: string) => {
    return getOficinasCredito.value.find(
      oficina => oficina.ofiafi === codigo
    );
  };

  // Función para obtener forma de pago por código
  const getFormaPagoPorCodigo = (codigo: string) => {
    return getFormasPago.value.find(forma => forma.forpag === codigo);
  };

  // Función para obtener garantía por código
  const getGarantiaPorCodigo = (codigo: string) => {
    return getGarantiasPago.value.find(
      garantia => garantia.codgar === codigo
    );
  };

  // Función para obtener tipo de inversión por código
  const getTipoInversionPorCodigo = (codigo: string) => {
    return getTiposInversion.value.find(tipo => tipo.tipinv === codigo);
  };

  // Función para obtener tipo de documento por código
  const getTipoDocumentoPorCodigo = (codigo: string) => {
    return getTiposDocumentosRequeridos.value.find(
      doc => doc.tipdoc === codigo
    );
  };

  // Función para obtener motivo de rechazo por código
  const getMotivoRechazoPorCodigo = (codigo: string) => {
    return getMotivosRechazo.value.find(motivo => motivo.modrec === codigo);
  };

  // Función para obtener periodo actual (no cerrado)
  const getPeriodoActual = () => {
    return getDatosPeriodos.value.find(periodo => periodo.cierre === "N");
  };

  // Función para obtener centro de costo por código
  const getCentroCostoPorCodigo = (codigo: string) => {
    return getCentrosCostos.value.find(centro => centro.codcen === codigo);
  };

  // Función para obtener empresa de seguros por NIT
  const getEmpresaSeguroPorNit = (nit: string) => {
    return getEmpresasSeguros.value.find(empresa => empresa.nit === nit);
  };

  // Función para obtener marca de recibo por marca
  const getMarcaReciboPorMarca = (marca: string) => {
    return getMarcasRecibosCaja.value.find(recibo => recibo.marca === marca);
  };

  // Función para obtener tipo de distribución por código
  const getTipoDistribucionPorCodigo = (codigo: string) => {
    return getTiposDistribucion.value.find(dist => dist.coddis === codigo);
  };

  // Función para obtener fondo de crédito social por código
  const getFondoCreditoSocialPorCodigo = (codigo: string) => {
    return getFondosCreditoSocial.value.find(
      fondo => fondo.codcre === codigo
    );
  };

  // Función para obtener forma de pago tesorería por código
  const getFormaPagoTesoreriaPorCodigo = (codigo: string) => {
    return getFormasPagoTesoreria.value.find(
      forma => forma.forpag === codigo
    );
  };

  // Función para obtener tipo de tercero por código
  const getTipoTerceroPorCodigo = (codigo: string) => {
    return getTiposTerceros.value.find(tipo => tipo.tipter === codigo);
  };

  // Función para obtener oficina de afiliación por usuario
  const getOficinasAfiliacionPorUsuario = (usuarioId: number) => {
    return getOficinasAfiliacionUsuario.value.filter(
      oficina => oficina.usuario === usuarioId
    );
  };

  // Limpiar cache
  const limpiarCache = () => {
    parametrosCache.value = null;
    error.value = null;
  };

  return {
    // Estado
    loading: readonly(loading),
    error: readonly(error),
    parametrosCache: readonly(parametrosCache),

    // Acciones
    cargarParametros,
    limpiarCache,

    // Computed properties
    getAuxiliaresContables,
    getCentrosCostos,
    getDatosGeneralesCredito,
    getFormasPago,
    getGarantiasPago,
    getTiposCreditoVigencia,
    getTiposInversion,
    getTiposDocumentosRequeridos,
    getMotivosRechazo,
    getOficinasCredito,
    getPeriodosPago,
    getPeriodosPagoDesembolsos,
    getEmpresasSeguros,
    getMarcasRecibosCaja,
    getTiposDistribucion,
    getFondosCreditoSocial,
    getFormasPagoTesoreria,
    getTiposTerceros,
    getDatosPeriodos,
    getOficinasAfiliacionUsuario,

    // Funciones de búsqueda
    getAuxiliarPorCodigo,
    getTipoCreditoPorTipcre,
    getOficinaPorCodigo,
    getFormaPagoPorCodigo,
    getGarantiaPorCodigo,
    getTipoInversionPorCodigo,
    getTipoDocumentoPorCodigo,
    getMotivoRechazoPorCodigo,
    getPeriodoActual,
    getCentroCostoPorCodigo,
    getEmpresaSeguroPorNit,
    getMarcaReciboPorMarca,
    getTipoDistribucionPorCodigo,
    getFondoCreditoSocialPorCodigo,
    getFormaPagoTesoreriaPorCodigo,
    getTipoTerceroPorCodigo,
    getOficinasAfiliacionPorUsuario
  };
};
