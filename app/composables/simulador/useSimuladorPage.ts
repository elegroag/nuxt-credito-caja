import { onMounted, watch } from "vue";
import { useSimulador } from "./useSimulador";
import { useSimuladorConConvenio } from "./useSimuladorConConvenio";
import { useTrabajador } from "~/composables/useTrabajador";
import { useSimuladorStorage } from "~/composables/useSimuladorStorage";

export const useSimuladorPage = () => {
  const { trabajador } = useTrabajador();
  const { saveSimuladorDataSilent } = useSimuladorStorage();

  // Composable de convenio
  const {
    nitEmpresa,
    cedulaTrabajador,
    loadingConvenio,
    convenioVerificado,
    isElegible,
    getMensajeError,
    validarConvenioAntesDSimular,
    mensajeBeneficios
  } = useSimuladorConConvenio();

  // Composable principal del simulador
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
  } = useSimulador();

  const navigateToLineas = () => {
    navigateTo("/dash/simulador/lineas-credito");
  };

  // Computed para manejar el v-model del input de tasa
  const tasaInput = computed({
    get: () => (tipoTasa.value === "anual" ? tasaEfectivaAnual.value : tasaMensualInput.value),
    set: (value) => {
      if (tipoTasa.value === "anual") {
        tasaEfectivaAnual.value = value;
      } else {
        tasaMensualInput.value = value;
      }
    }
  });

  // Cargar datos del trabajador y validar convenio al montar
  onMounted(async () => {
    // Cargar salario del trabajador
    if (trabajador.value?.salario) {
      ingresosMensuales.value = trabajador.value.salario;
    }

    // Validar convenio si tiene empresa
    if (trabajador.value?.empresa?.nit && trabajador.value?.cedula) {
      nitEmpresa.value = trabajador.value.empresa.nit;
      cedulaTrabajador.value = trabajador.value.cedula;
      await validarConvenioAntesDSimular();
    }
  });

  // Watch para guardar datos cuando cambien (con debounce)
  let saveTimeout: NodeJS.Timeout | null = null;

  const saveData = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      if (monto.value > 0) {
        saveSimuladorDataSilent({
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
          cedulaTrabajador: cedulaTrabajador.value,
          // Sin línea de crédito específica
          lineaCredito: undefined as unknown as LineaCreditoSimulador
        });
      }
    }, 500);
  };

  // Watch para guardar datos cuando cambien
  watch(
    [
      monto,
      plazoMeses,
      tasaEfectivaAnual,
      ingresosMensuales,
      descuentosMensuales,
      cuotaMensual,
      totalPagar,
      intereses,
      isElegible,
      convenioVerificado
    ],
    saveData,
    { deep: true }
  );

  return {
    // Datos del convenio
    nitEmpresa,
    cedulaTrabajador,
    loadingConvenio,
    convenioVerificado,
    isElegible,
    mensajeBeneficios,
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

    // Computed y funciones específicas de la página
    tasaInput,
    navigateToLineas
  };
};
