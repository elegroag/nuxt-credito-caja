// frontend/composables/simulador/useSimuladorWithLinea.ts
import { computed, ref, watch, type Ref } from "vue";
import { useSimuladorCore } from "./useSimuladorCore";

export interface LineaCreditoApiResponse {
  tipcre: string
  detalle: string
  modxml4: number
  numcuo: number
  estcre: number
  pagseg: string
  valmax: number
  estado?: string
  codcre?: string
  auxest?: string
  codcen?: string
  categorias?: Array<Record<string, unknown>>
}

export interface LineaCreditoData {
  tipcre: string
  detalle: string
  modxml4: number
  numcuo: number
  estcre: number
  pagseg: string
  valmax: number
  estado?: string
  codcre?: string
  auxest?: string
  codcen?: string
  categorias?: Array<Record<string, unknown>>
  // ... otras propiedades de la línea
}

export function useSimuladorWithLinea(lineaCredito?: Ref<LineaCreditoData | null>) {
  const {
    calcularCuotaMensual,
    calcularTotalPagar,
    calcularIntereses,
    calcularCapacidadDisponible,
    calcularMargen,
    calcularApto,
    calcularTasaMensual,
    fmt,
    fmtPct,
    calcularMontoSan,
    calcularPlazoSan,
    calcularTasaEASan,
    calcularTasaMensualSan,
    calcularIngresosBrutosSan,
    calcularDescuentosSan,
    calcularIngresosSan,
    calcularSeguridadSocialSan,
    convertirAnualAMensual,
    convertirMensualAAnual
  } = useSimuladorCore();

  // Valores reactivos del simulador
  const monto = ref(5_000_000);
  const plazoMeses = ref(36);
  const tasaEfectivaAnual = ref(24);
  const tasaMensualInput = ref(2);
  const tipoTasa = ref<"anual" | "mensual">("anual");
  const ingresosMensuales = ref(2_500_000);
  const descuentosMensuales = ref(500_000);
  const maxEndeudamientoPct = ref(50);

  // Watch para actualizar plazo cuando cambia la línea de crédito
  if (lineaCredito) {
    watch(lineaCredito, (nuevaLinea) => {
      if (nuevaLinea) {
        // Aplicar el número de cuotas de la línea de crédito
        if (nuevaLinea.numcuo) {
          plazoMeses.value = nuevaLinea.numcuo;
        }
      }
    }, { immediate: true });
  }

  // Computed properties usando las funciones core
  const montoSan = computed(() => calcularMontoSan(monto.value));
  const plazoMesesSan = computed(() => calcularPlazoSan(plazoMeses.value));
  const tasaEASan = computed(() => calcularTasaEASan(tasaEfectivaAnual.value));
  const tasaMensualSan = computed(() => calcularTasaMensualSan(tasaMensualInput.value));
  const ingresosBrutosSan = computed(() => calcularIngresosBrutosSan(ingresosMensuales.value));
  const descuentosSan = computed(() => calcularDescuentosSan(descuentosMensuales.value));
  const ingresosSan = computed(() => calcularIngresosSan(ingresosBrutosSan.value));
  const seguridadSocialSan = computed(() => calcularSeguridadSocialSan(ingresosBrutosSan.value));

  const tasaMensual = computed(() =>
    calcularTasaMensual(tasaEASan.value, tasaMensualSan.value, tipoTasa.value)
  );

  const cuotaMensual = computed(() =>
    calcularCuotaMensual(monto.value, plazoMeses.value, tasaMensual.value)
  );

  const totalPagar = computed(() =>
    calcularTotalPagar(cuotaMensual.value, plazoMeses.value)
  );

  const intereses = computed(() =>
    calcularIntereses(totalPagar.value, monto.value)
  );

  const capacidadDisponible = computed(() =>
    calcularCapacidadDisponible(ingresosBrutosSan.value, descuentosMensuales.value, maxEndeudamientoPct.value)
  );

  const maxCuotaPermitida = computed(() => capacidadDisponible.value);
  const margen = computed(() => calcularMargen(capacidadDisponible.value, cuotaMensual.value));
  const apto = computed(() => calcularApto(cuotaMensual.value, capacidadDisponible.value));

  // Función para cambiar el tipo de tasa con conversión.
  // Si se pasa `categoriaAplicada`, al volver a "Anual" se restaura la tasa
  // representativa (facfin) de la categoría en lugar de hacer la conversión inversa.
  const cambiarTipoTasa = (
    nuevoTipo: "anual" | "mensual",
    categoriaAplicada?: { codcat: string, facfin: number | string } | null
  ) => {
    if (nuevoTipo === tipoTasa.value) return;

    if (tipoTasa.value === "anual" && nuevoTipo === "mensual") {
      // Anual → Mensual: calcular la tasa mensual a partir de la anual actual
      const tasaMensualConvertida = convertirAnualAMensual(tasaEASan.value);
      tasaMensualInput.value = parseFloat(tasaMensualConvertida.toFixed(2));
    } else if (tipoTasa.value === "mensual" && nuevoTipo === "anual") {
      // Mensual → Anual: preferir la tasa representativa de la categoría del trabajador
      if (categoriaAplicada && categoriaAplicada.facfin !== undefined && categoriaAplicada.facfin !== null) {
        const facfinNum = parseFloat(String(categoriaAplicada.facfin));
        if (Number.isFinite(facfinNum)) {
          tasaEfectivaAnual.value = facfinNum;
          tipoTasa.value = nuevoTipo;
          return;
        }
      }
      // Sin categoría aplicable: convertir de vuelta desde la mensual
      const tasaAnualConvertida = convertirMensualAAnual(tasaMensualSan.value);
      tasaEfectivaAnual.value = parseFloat(tasaAnualConvertida.toFixed(2));
    }

    tipoTasa.value = nuevoTipo;
  };

  // Función de reset
  const reset = () => {
    monto.value = 5_000_000;
    // Usar el plazo máximo de la línea si existe, sino 36 meses por defecto
    plazoMeses.value = (lineaCredito?.value?.numcuo) || 36;
    tasaEfectivaAnual.value = 24;
    tasaMensualInput.value = 2;
    tipoTasa.value = "anual";
    ingresosMensuales.value = 2_500_000;
    descuentosMensuales.value = 500_000;
    maxEndeudamientoPct.value = 50;
  };

  // Función para actualizar valores
  const updateValues = (values: Partial<{
    monto: number
    plazoMeses: number
    tasaEfectivaAnual: number
    ingresosMensuales: number
    descuentosMensuales: number
    maxEndeudamientoPct: number
  }>) => {
    if (values.monto !== undefined) monto.value = values.monto;
    if (values.plazoMeses !== undefined) plazoMeses.value = values.plazoMeses;
    if (values.tasaEfectivaAnual !== undefined) tasaEfectivaAnual.value = values.tasaEfectivaAnual;
    if (values.ingresosMensuales !== undefined) ingresosMensuales.value = values.ingresosMensuales;
    if (values.descuentosMensuales !== undefined) descuentosMensuales.value = values.descuentosMensuales;
    if (values.maxEndeudamientoPct !== undefined) maxEndeudamientoPct.value = values.maxEndeudamientoPct;
  };

  return {
    // Reactive values
    monto,
    plazoMeses,
    tasaEfectivaAnual,
    tasaMensualInput,
    tipoTasa,
    ingresosMensuales,
    descuentosMensuales,
    maxEndeudamientoPct,

    // Computed properties
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

    // Functions
    fmt,
    fmtPct,
    reset,
    updateValues,
    cambiarTipoTasa
  };
}
