import { ref } from "vue";

export const useRevisionStep = (props: RevisionProps) => {
  // Estado para controlar la visibilidad del payload
  const mostrarPayload = ref(false);

  // Función para toggle del payload
  const togglePayload = () => {
    mostrarPayload.value = !mostrarPayload.value;
  };

  // Función para parsear el payload JSON
  const parsePayload = () => {
    try {
      return JSON.parse(props.prettyPayload);
    } catch {
      return {};
    }
  };

  // Funciones para obtener resúmenes de datos
  const getResumenEncabezado = () => {
    const data = parsePayload();
    return data.encabezado || {};
  };

  const getResumenSolicitud = () => {
    const data = parsePayload();
    return data.solicitud || {};
  };

  const getResumenSolicitante = () => {
    const data = parsePayload();
    console.log("Data solicitante", data.solicitante);
    return data.solicitante || {};
  };

  const getResumenSimulador = () => {
    if (typeof window === "undefined") return null;

    try {
      const simuladorData = localStorage.getItem("comfaca_simulador_data");
      if (!simuladorData) return null;

      // Decodificar los datos para corregir problemas de codificación
      const decodedData = decodeURIComponent(simuladorData);
      const parsed = JSON.parse(decodedData);
      const lineaCredito = parsed.lineaCredito;

      if (!lineaCredito) return null;

      // Función para corregir texto
      const corregirTexto = (texto: string | undefined) => {
        if (!texto) return "";
        try {
          // Decodificar caracteres especiales
          return decodeURIComponent(texto);
        } catch {
          return texto;
        }
      };

      // Extraer campos relevantes del simulador con corrección de codificación
      return {
        linea_credito: corregirTexto(lineaCredito.detalle),
        tipo_credito: lineaCredito.tipcre || "",
        modelo_xml4: lineaCredito.modxml4 || "",
        codigo_cre: lineaCredito.codcre || "",
        codigo_cap: lineaCredito.codcap || "",
        codigo_ser: lineaCredito.codser || "",
        numero_cuotas: lineaCredito.numcuo || "",
        estado: lineaCredito.estado || "",
        monto_simulado: parsed.monto
          ? `$${parsed.monto.toLocaleString("es-CO")}`
          : "",
        plazo_meses: parsed.plazoMeses || "",
        tasa_anual: parsed.tasaInteresAnual
          ? `${parsed.tasaInteresAnual}%`
          : "",
        cuota_mensual: parsed.cuotaMensual
          ? `$${parsed.cuotaMensual.toLocaleString("es-CO")}`
          : ""
      };
    } catch (error) {
      console.error("Error obteniendo datos del simulador:", error);
      return null;
    }
  };

  const getResumenConyuge = () => {
    const data = parsePayload();
    return data.conyuge || null;
  };

  const getResumenLaboral = () => {
    const data = parsePayload();
    return data.informacion_laboral || {};
  };

  const getResumenIngresos = () => {
    const data = parsePayload();
    return data.ingresos_descuentos || {};
  };

  const getResumenEconomica = () => {
    const data = parsePayload();
    return data.informacion_economica || {};
  };

  const getResumenPropiedades = () => {
    const data = parsePayload();
    return data.propiedades || [];
  };

  const getResumenDeudas = () => {
    const data = parsePayload();
    return data.deudas || [];
  };

  const getResumenReferenciasFamiliares = () => {
    const data = parsePayload();
    return data.referencias?.familiares || [];
  };

  const getResumenReferenciasPersonales = () => {
    const data = parsePayload();
    return data.referencias?.personales || [];
  };

  return {
    // Estado
    mostrarPayload,

    // Funciones principales
    togglePayload,
    parsePayload,

    // Funciones de resumen
    getResumenEncabezado,
    getResumenSolicitud,
    getResumenSolicitante,
    getResumenSimulador,
    getResumenConyuge,
    getResumenLaboral,
    getResumenIngresos,
    getResumenEconomica,
    getResumenPropiedades,
    getResumenDeudas,
    getResumenReferenciasFamiliares,
    getResumenReferenciasPersonales
  };
};
