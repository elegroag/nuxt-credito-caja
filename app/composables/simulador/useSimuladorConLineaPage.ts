import { onMounted, watch, reactive, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useSimuladorWithLinea, type LineaCreditoData, type LineaCreditoApiResponse } from "./useSimuladorWithLinea";
import { useTrabajador } from "~/composables/useTrabajador";
import { useSimuladorStorage } from "~/composables/useSimuladorStorage";
import { useSimuladorConConvenio } from "./useSimuladorConConvenio";
import { useApi } from "~/composables/useApi";

export const useSimuladorConLineaPage = () => {
  const route = useRoute();
  const { getJson } = useApi();
  const { trabajador } = useTrabajador();
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
  const lineaSeleccionada = ref<LineaCreditoData | null>(null);

  // Cache para líneas de crédito
  const lineasCache = ref<Map<string, LineaCreditoData>>(new Map());

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
    seguridadSocialSan,
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
    if (lineaSeleccionada.value?.valmax) {
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
        lineaSeleccionada.value = lineasCache.value.get(tipcre.value) ?? null;
        console.log("Usando cache para línea:", tipcre.value);
      } else {
        // Consultar API si no está en cache
        const response = await getJson<{
          success: boolean
          message: string
          data: LineaCreditoApiResponse[]
        }>("/api/lineas_credito/tipo-creditos", { auth: true });

        if (response.success) {
          // Guardar todas las líneas en cache
          response.data.forEach((linea) => {
            lineasCache.value.set(linea.tipcre, linea as LineaCreditoData);
          });

          // Obtener la línea específica
          lineaSeleccionada.value = response.data.find(
            (linea): linea is LineaCreditoApiResponse => linea.tipcre === tipcre.value
          ) ?? null;

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

      // La tasa según categoría del trabajador se asigna reactivamente
      // desde el watch sobre `categoriaTrabajadorAplicada` (más abajo), para
      // cubrir el caso en que el trabajador se hidrate después de este método.

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

  // Resuelve la categoría del trabajador dentro de las categorías de la línea.
  // Devuelve { codcat, facfin } si hay match, o null si no hay match o no hay datos.
  const categoriaTrabajadorAplicada = computed<
    { codcat: string, facfin: number | string } | null
  >(() => {
    // El campo del trabajador es `codcat`; se conserva fallback a
    // `codigo_categoria` para datos antiguos que aún usen el nombre previo.
    const codcatTrabajador
      = trabajador.value?.codcat ?? trabajador.value?.codigo_categoria;
    const categorias = lineaSeleccionada.value?.categorias;
    if (!codcatTrabajador || !Array.isArray(categorias) || categorias.length === 0) {
      return null;
    }
    const target = String(codcatTrabajador).toLowerCase();
    const match = categorias.find(
      (cat: Record<string, unknown>) =>
        cat
        && cat.codcat
        && String(cat.codcat).toLowerCase() === target
    );
    if (!match) return null;
    return {
      codcat: String((match as Record<string, unknown>).codcat),
      facfin: (match as Record<string, unknown>).facfin as number | string
    };
  });

  // Código de categoría del trabajador (con fallback al nombre previo `codigo_categoria`).
  const trabajadorCodcat = computed<string | null>(
    () => trabajador.value?.codcat ?? trabajador.value?.codigo_categoria ?? null
  );

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
        lineaCredito: lineaSeleccionada.value as LineaCreditoSimulador,
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

  // Watch para forzar la tasa según la categoría del trabajador.
  // Se re-evalúa cada vez que cambia `categoriaTrabajadorAplicada`
  // (incluso cuando el trabajador se hidrata desde localStorage después del mount).
  watch(
    () => categoriaTrabajadorAplicada.value,
    (categoria) => {
      if (categoria && categoria.facfin !== undefined && categoria.facfin !== null) {
        const nuevaTasa = parseFloat(String(categoria.facfin));
        if (Number.isFinite(nuevaTasa) && nuevaTasa !== tasaEfectivaAnual.value) {
          tasaEfectivaAnual.value = nuevaTasa;
        }
      }
    },
    { immediate: true }
  );

  // Watch para aplicar la conversión correcta al cambiar entre tasa anual y mensual.
  // Usa `(newValue, oldValue)` para detectar la dirección del cambio.
  // Esto reemplaza al handler `@update:model-value` del radio, que corría
  // DESPUÉS de v-model y nunca veía el valor anterior.
  watch(
    () => tipoTasa.value,
    (nuevoTipo, viejoTipo) => {
      if (nuevoTipo === viejoTipo) return;

      if (viejoTipo === "anual" && nuevoTipo === "mensual") {
        // Anual → Mensual: calcular la tasa mensual a partir de la anual actual
        const nuevaTasaMensual
          = Math.round((tasaEASan.value / 12) * 10000) / 10000;
        tasaMensualInput.value = nuevaTasaMensual;
      } else if (viejoTipo === "mensual" && nuevoTipo === "anual") {
        // Mensual → Anual: preferir la tasa representativa de la categoría
        const cat = categoriaTrabajadorAplicada.value;
        if (cat && cat.facfin !== undefined && cat.facfin !== null) {
          const facfinNum = parseFloat(String(cat.facfin));
          if (Number.isFinite(facfinNum)) {
            tasaEfectivaAnual.value = facfinNum;
          }
        }
      }
    }
  );

  // Watch para validar convenio cuando el trabajador esté disponible
  watch(
    () => trabajador.value,
    async (newTrabajador) => {
      const t = newTrabajador as {
        nit?: string
        empresa?: { nit?: string }
        cedtra?: string
        cedula?: string
      };
      const nit = String(t?.nit || t?.empresa?.nit || "");
      const cedula = String(t?.cedtra || t?.cedula || "");

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
    seguridadSocialSan,
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
    categoriaTrabajadorAplicada,
    trabajadorCodcat,
    validarMonto,
    navigateToLineas,
    cargarLineaCredito,
    saveDataManual,
    validarMontoMaximo,
    clearSolicitudData
  };
};
