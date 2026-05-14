import { onMounted, watch, reactive, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useSimuladorWithLinea } from "./useSimuladorWithLinea";
import { useTrabajador } from "~/composables/useTrabajador";
import { useSimuladorStorage } from "~/composables/useSimuladorStorage";
import { useSimuladorConConvenio } from "./useSimuladorConConvenio";
import { useApi } from "~/composables/useApi";

export const useSimuladorConLineaPage = () => {
  const route = useRoute();
  const { getJson } = useApi();
  const { trabajador, salario } = useTrabajador();
  const { saveSimuladorDataSilent, clearSolicitudData } = useSimuladorStorage();

  // Composable de convenio
  const {
    nitEmpresa,
    cedulaTrabajador,
    convenioVerificado,
    isElegible,
    getMensajeError,
    validarConvenioAntesDSimular
  } = useSimuladorConConvenio();

  const tipcre = computed(() => route.params.tipcre as string);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const lineaSeleccionada = ref<any>(null);

  // Cache para líneas de crédito
  const lineasCache = ref<Map<string, any>>(new Map());

  // Objeto reactive para el input de monto con validación
  const montoInput = reactive<{
    val: string
    valid: boolean
    cls: string
    hint: string
    hintClass: string
    pct: number
    pctColor: "primary" | "secondary" | "accent" | "destructive" | "muted" | "neutral"
  }>({
    val: "",
    valid: false,
    cls: "",
    hint: "Ingresa un monto entre 200.000 y el máximo permitido",
    hintClass: "",
    pct: 0,
    pctColor: "neutral"
  });

  // Usar el hook especializado para líneas de crédito
  const {
    monto,
    plazoMeses,
    tasaEfectivaAnual,
    tasaMensualInput,
    tipoTasa,
    ingresosMensuales,
    descuentosMensuales,
    maxEndeudamientoPct,
    montoSan,
    plazoMesesSan,
    tasaEASan,
    tasaMensualSan,
    ingresosSan,
    ingresosBrutosSan,
    descuentosSan,
    tasaMensual,
    cuotaMensual,
    totalPagar,
    intereses,
    capacidadDisponible,
    maxCuotaPermitida,
    margen,
    apto,
    fmt,
    fmtPct,
    reset,
    cambiarTipoTasa
  } = useSimuladorWithLinea(lineaSeleccionada);

  const navigateToLineas = () => {
    clearSolicitudData();
    navigateTo("/dash/simulador/lineas-credito");
  };

  // Validar que el monto no exceda el valor máximo y la cantidad de dígitos
  const validarMontoMaximo = () => {
    if (lineaSeleccionada.value.valmax) {
      const valmax = Number(lineaSeleccionada.value.valmax);
      const montoActual = Number(monto.value);

      // Validar que el monto no exceda el valor máximo
      if (montoActual > valmax) {
        monto.value = valmax;
      }

      // Validar que la cantidad de dígitos no sea superior a la del valmax
      if (montoActual.toString().length > valmax.toString().length) {
        monto.value = valmax;
      }
    }
  };

  // Validación del input de monto
  const validarMonto = () => {
    // Asegurar que montoInput esté definido
    if (!montoInput) return;

    // Eliminar todo excepto números y puntos
    montoInput.val = montoInput.val
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    const valmax = lineaSeleccionada.value?.valmax || 999999999;
    const minimo = 200000;
    const v = parseFloat(montoInput.val);

    if (!montoInput.val) {
      montoInput.cls = "";
      montoInput.valid = false;
      montoInput.hint = "Ingresa un monto entre 200.000 y el máximo permitido";
      montoInput.hintClass = "";
      montoInput.pct = 0;
      montoInput.pctColor = "neutral";
      monto.value = 0;
    } else if (isNaN(v) || v < minimo) {
      montoInput.cls = "invalid";
      montoInput.valid = false;
      montoInput.hint = `✗ Mínimo permitido: ${fmt(minimo)}`;
      montoInput.hintClass = "error";
      montoInput.pct = 1;
      montoInput.pctColor = "destructive";
      monto.value = 0;
    } else if (v > valmax) {
      montoInput.cls = "invalid";
      montoInput.valid = false;
      montoInput.hint = `✗ Máximo permitido: ${fmt(valmax)}`;
      montoInput.hintClass = "error";
      montoInput.pct = 100;
      montoInput.pctColor = "destructive";
      monto.value = valmax;
    } else {
      montoInput.cls = "valid";
      montoInput.valid = true;
      montoInput.hint = "✓ Monto válido";
      montoInput.hintClass = "success";
      montoInput.pct = Math.round((v / valmax) * 100);
      montoInput.pctColor
        = v < valmax * 0.33
          ? "primary"
          : v < valmax * 0.66
            ? "secondary"
            : "accent";
      monto.value = v;
    }
  };

  // Cargar datos de la línea de crédito
  const cargarLineaCredito = async () => {
    try {
      loading.value = true;
      error.value = null;

      // Verificar cache primero
      if (lineasCache.value.has(tipcre.value)) {
        lineaSeleccionada.value = lineasCache.value.get(tipcre.value);
        console.log("Usando cache para línea:", tipcre.value);
      } else {
        // Consultar API si no está en cache
        const response = await getJson<{
          success: boolean
          message: string
          data: any[]
        }>("/api/lineas_credito/tipo-creditos", { auth: true });

        if (response.success) {
          // Guardar todas las líneas en cache
          response.data.forEach((linea) => {
            lineasCache.value.set(linea.tipcre, linea);
          });

          // Obtener la línea específica
          lineaSeleccionada.value = response.data.find(
            linea => linea.tipcre === tipcre.value
          );

          if (!lineaSeleccionada.value) {
            error.value = "Línea de crédito no encontrada";
          }
        } else {
          error.value
            = response.message || "Error al cargar la línea de crédito";
        }
      }

      // Establecer ingresos mensuales del trabajador si está disponible
      if (trabajador.value && trabajador.value.salario) {
        ingresosMensuales.value = trabajador.value.salario;
      }

      // Establecer descuentos mensuales por defecto en 0
      descuentosMensuales.value = 0;

      // Establecer tasa según categoría del trabajador
      if (
        trabajador.value?.codigo_categoria
        && lineaSeleccionada.value?.categorias
      ) {
        const categoriaTrabajador = String(
          trabajador.value.codigo_categoria
        ).toLowerCase();
        const categoriaLinea = lineaSeleccionada.value.categorias.find(
          (cat: any) =>
            cat
            && cat.codcat
            && String(cat.codcat).toLowerCase() === categoriaTrabajador
        );

        if (categoriaLinea && categoriaLinea.facfin) {
          tasaEfectivaAnual.value = parseFloat(categoriaLinea.facfin);
        }
      }

      // Validar convenio automáticamente si tiene datos del trabajador
      if (trabajador.value?.empresa?.nit && trabajador.value?.cedula) {
        nitEmpresa.value = trabajador.value.empresa.nit;
        cedulaTrabajador.value = trabajador.value.cedula;
        await validarConvenioAntesDSimular();
      }
    } catch (err) {
      console.error("Error cargando línea crédito:", err);
      error.value
        = "No se pudo cargar la línea de crédito. Por favor, intenta nuevamente.";
    } finally {
      loading.value = false;
    }
  };

  // Computed para manejar el v-model del input de monto de forma segura
  const montoInputModel = computed({
    get: () => montoInput?.val || "",
    set: (value) => {
      if (montoInput) {
        montoInput.val = value;
        validarMonto();
      }
    }
  });

  // Computed para manejar el v-model del input de tasa
  const tasaInput = computed({
    get: () =>
      tipoTasa.value === "anual"
        ? tasaEfectivaAnual.value
        : tasaMensualInput.value,
    set: (value) => {
      if (tipoTasa.value === "anual") {
        tasaEfectivaAnual.value = value;
      } else {
        tasaMensualInput.value = value;
      }
    }
  });

  // Función para guardar datos manualmente (solo cuando se pulse el botón)
  const saveDataManual = () => {
    if (lineaSeleccionada.value && monto.value > 0) {
      saveSimuladorDataSilent({
        lineaCredito: lineaSeleccionada.value,
        monto: monto.value,
        montoCredito: monto.value,
        plazoMeses: plazoMeses.value,
        tasaEfectivaAnual: tasaEfectivaAnual.value,
        ingresosMensuales: ingresosMensuales.value,
        descuentosMensuales: descuentosMensuales.value,
        maxEndeudamientoPct: maxEndeudamientoPct.value,
        tasaInteresAnual: tasaEfectivaAnual.value,
        cuotaMensual: cuotaMensual.value,
        totalIntereses: intereses.value,
        totalPagar: totalPagar.value,
        fechaSimulacion: new Date().toISOString(),
        // Datos del convenio
        tieneConvenio: isElegible.value,
        convenioVerificado: convenioVerificado.value,
        nitEmpresa: nitEmpresa.value,
        cedulaTrabajador: cedulaTrabajador.value
      });
    }
  };

  // Watch para sincronizar montoInput con monto existente
  watch(
    () => monto.value,
    (newValue) => {
      if (newValue && newValue > 0) {
        montoInput.val = newValue.toString();
        validarMonto();
      }
    },
    { immediate: true }
  );

  // Watch para validar convenio cuando el trabajador esté disponible
  watch(
    () => trabajador.value,
    async (newTrabajador) => {
      const t = newTrabajador as any;
      const nit = t?.nit || t?.empresa?.nit;
      const cedula = t?.cedtra || t?.cedula;

      console.log("Watch trabajador:", {
        nit,
        cedula,
        convenioVerificado: convenioVerificado.value
      });

      if (nit && cedula && !convenioVerificado.value) {
        nitEmpresa.value = nit;
        cedulaTrabajador.value = cedula;
        console.log("Validando convenio...");
        const resultado = await validarConvenioAntesDSimular();
        console.log("Resultado:", resultado);
      }
    },
    { immediate: true }
  );

  // Cargar datos al montar el componente
  onMounted(() => {
    cargarLineaCredito();
  });

  return {
    // Estado y datos de la página
    tipcre,
    loading,
    error,
    lineaSeleccionada,
    lineasCache,
    trabajador,

    // Datos del convenio
    nitEmpresa,
    cedulaTrabajador,
    convenioVerificado,
    isElegible,
    getMensajeError,

    // Datos del simulador
    monto,
    plazoMeses,
    tasaEfectivaAnual,
    tasaMensualInput,
    tipoTasa,
    ingresosMensuales,
    descuentosMensuales,
    maxEndeudamientoPct,
    montoSan,
    plazoMesesSan,
    tasaEASan,
    tasaMensualSan,
    ingresosSan,
    ingresosBrutosSan,
    descuentosSan,
    tasaMensual,
    cuotaMensual,
    totalPagar,
    intereses,
    capacidadDisponible,
    maxCuotaPermitida,
    margen,
    apto,
    fmt,
    fmtPct,
    reset,
    cambiarTipoTasa,

    // Computed y funciones específicas
    tasaInput,
    montoInput,
    montoInputModel,
    validarMonto,
    navigateToLineas,
    cargarLineaCredito,
    saveDataManual,
    validarMontoMaximo,
    clearSolicitudData
  };
};
