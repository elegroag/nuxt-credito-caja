// frontend/composables/simulador/useSimulador.ts
import { computed, ref } from "vue";

export function useSimulador() {
  // Valores por defecto
  const monto = ref(5_000_000);
  const plazoMeses = ref(36);
  const tasaEfectivaAnual = ref(24);
  const tasaMensualInput = ref(2);
  const tipoTasa = ref<"anual" | "mensual">("anual");
  const ingresosMensuales = ref(2_500_000);
  const descuentosMensuales = ref(500_000);
  const maxEndeudamientoPct = ref(50);

  // Función helper para validar números
  const _num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Computed properties con validación y saneamiento
  const montoSan = computed(() => Math.max(0, _num(monto.value)));
  const plazoMesesSan = computed(() =>
    Math.max(1, Math.floor(_num(plazoMeses.value) || 1)),
  );
  const tasaEASan = computed(() => Math.max(0, _num(tasaEfectivaAnual.value)));
  const tasaMensualSan = computed(() =>
    Math.max(0, _num(tasaMensualInput.value)),
  );

  const ingresosBrutosSan = computed(() =>
    Math.max(0, _num(ingresosMensuales.value)),
  );
  const descuentosSan = computed(() =>
    Math.max(0, _num(descuentosMensuales.value)),
  );

  const capacidadPagoMaxima = computed(() => {
    const bruto = ingresosBrutosSan.value;
    // Capacidad de Pago Mensual Máximo endeudamiento (50%) por default, del salario menos el 8% de descuentos de Ley
    return (bruto * maxEndeudamientoSan.value) / 100 - bruto * 0.08;
  });

  const ingresosSan = computed(() => {
    // Ingresos netos aproximados para cálculos internos si fuera necesario
    return ingresosBrutosSan.value * 0.92;
  });
  const maxEndeudamientoSan = computed(() => {
    const v = _num(maxEndeudamientoPct.value);
    return Math.min(100, Math.max(0, v));
  });

  // Cálculos financieros
  const tasaMensual = computed(() => {
    if (tipoTasa.value === "mensual") {
      // Si el usuario selecciona tasa mensual, usar directamente ese valor
      return tasaMensualSan.value / 100;
    }
    // Si es tasa anual, convertir a mensual
    const ea = tasaEASan.value / 100;
    if (ea <= 0) return 0;
    return Math.pow(1 + ea, 1 / 12) - 1;
  });

  // Computed para mostrar la tasa según el tipo seleccionado
  const tasaMostrada = computed(() => {
    if (tipoTasa.value === "mensual") {
      return tasaMensualSan.value;
    }
    return tasaEASan.value;
  });

  const cuotaMensual = computed(() => {
    const P = montoSan.value;
    const n = plazoMesesSan.value;
    const r = tasaMensual.value;

    if (P <= 0 || n <= 0) return 0;
    if (r <= 0) return P / n;

    const denom = 1 - Math.pow(1 + r, -n);
    if (denom <= 0) return 0;

    return (P * r) / denom;
  });

  const totalPagar = computed(() => cuotaMensual.value * plazoMesesSan.value);
  const intereses = computed(() =>
    Math.max(0, totalPagar.value - montoSan.value),
  );

  // Cálculos de capacidad
  const capacidadDisponible = computed(() =>
    Math.max(0, capacidadPagoMaxima.value - descuentosSan.value),
  );
  const maxCuotaPermitida = computed(() => capacidadDisponible.value);
  const margen = computed(() => maxCuotaPermitida.value - cuotaMensual.value);
  const apto = computed(() => cuotaMensual.value <= maxCuotaPermitida.value);

  // Funciones de formateo
  const fmt = (value: number) => {
    const n = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  };

  const fmtPct = (value: number) => {
    const n = Number.isFinite(value) ? value : 0;
    return `${n.toFixed(2)}%`;
  };

  // Función de reset
  const reset = () => {
    monto.value = 5_000_000;
    plazoMeses.value = 36;
    tasaEfectivaAnual.value = 24;
    tasaMensualInput.value = 2;
    tipoTasa.value = "anual";
    ingresosMensuales.value = 2_500_000;
    descuentosMensuales.value = 500_000;
    maxEndeudamientoPct.value = 50;
  };

  // Función para cambiar el tipo de tasa con conversión
  const cambiarTipoTasa = (nuevoTipo: "anual" | "mensual") => {
    if (nuevoTipo === tipoTasa.value) return;

    if (tipoTasa.value === "anual" && nuevoTipo === "mensual") {
      // Convertir de anual a mensual
      const ea = tasaEASan.value / 100;
      if (ea > 0) {
        const tasaMensualConvertida = (Math.pow(1 + ea, 1 / 12) - 1) * 100;
        tasaMensualInput.value = parseFloat(tasaMensualConvertida.toFixed(2));
      }
    } else if (tipoTasa.value === "mensual" && nuevoTipo === "anual") {
      // Convertir de mensual a anual
      const tm = tasaMensualSan.value / 100;
      if (tm > 0) {
        const tasaAnualConvertida = (Math.pow(1 + tm, 12) - 1) * 100;
        tasaEfectivaAnual.value = parseFloat(tasaAnualConvertida.toFixed(2));
      }
    }

    tipoTasa.value = nuevoTipo;
  };

  // Función para actualizar valores
  const updateValues = (values: Partial<SimuladorData>) => {
    if (values.monto !== undefined) monto.value = values.monto;
    if (values.plazoMeses !== undefined) plazoMeses.value = values.plazoMeses;
    if (values.tasaEfectivaAnual !== undefined)
      tasaEfectivaAnual.value = values.tasaEfectivaAnual;
    if (values.ingresosMensuales !== undefined)
      ingresosMensuales.value = values.ingresosMensuales;
    if (values.descuentosMensuales !== undefined)
      descuentosMensuales.value = values.descuentosMensuales;
    if (values.maxEndeudamientoPct !== undefined)
      maxEndeudamientoPct.value = values.maxEndeudamientoPct;
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
    descuentosSan,
    maxEndeudamientoSan,
    tasaMensual,
    tasaMostrada,
    cuotaMensual,
    totalPagar,
    intereses,
    capacidadPagoMaxima,
    capacidadDisponible,
    maxCuotaPermitida,
    margen,
    apto,

    // Functions
    fmt,
    fmtPct,
    reset,
    updateValues,
    cambiarTipoTasa,
  };
}
