// frontend/composables/simulador/useSimuladorCore.ts

// Funciones puras reutilizables para cálculos financieros
export function useSimuladorCore() {
  // Función helper para validar números
  const _num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Funciones de cálculo puras
  const calcularMontoSan = (monto: number) => Math.max(0, _num(monto));

  const calcularPlazoSan = (plazo: number) => Math.max(1, Math.floor(_num(plazo) || 1));

  const calcularTasaEASan = (tasaEA: number) => Math.max(0, _num(tasaEA));

  const calcularTasaMensualSan = (tasaMensual: number) => Math.max(0, _num(tasaMensual));

  const calcularIngresosBrutosSan = (ingresos: number) => Math.max(0, _num(ingresos));

  const calcularDescuentosSan = (descuentos: number) => Math.max(0, _num(descuentos));

  const calcularMaxEndeudamientoSan = (maxEndeudamientoPct: number) => {
    const v = _num(maxEndeudamientoPct);
    return Math.min(100, Math.max(0, v));
  };

  const calcularIngresosSan = (ingresosBrutos: number) => ingresosBrutos * 0.92;

  // Deducción de ley por seguridad social (8% del salario bruto: 4% salud + 4% pensión)
  const calcularSeguridadSocialSan = (ingresosBrutos: number) =>
    Math.round(ingresosBrutos * 0.08);

  const calcularCapacidadPagoMaxima = (ingresosBrutos: number, maxEndeudamientoPct: number) => {
    const bruto = calcularIngresosBrutosSan(ingresosBrutos);
    const maxEnd = calcularMaxEndeudamientoSan(maxEndeudamientoPct);
    return (bruto * maxEnd / 100) - (bruto * 0.08);
  };

  // La tasa mensual usada para los cálculos (cuota, total, intereses) se deriva
  // SIEMPRE de la tasa anual con la fórmula compuesta (1 + EA)^(1/12) - 1.
  // Esto garantiza que `cuotaMensual`, `totalPagar` e `intereses` sean estables
  // independientemente del `tipoTasa` seleccionado en el formulario. La
  // selección "Mensual" del radio sólo afecta al input (que muestra una
  // conversión simple /12) pero no al cálculo financiero.
  const calcularTasaMensual = (tasaEASan: number, _tasaMensualSan?: number, _tipoTasa?: "anual" | "mensual") => {
    const ea = tasaEASan / 100;
    if (!Number.isFinite(ea) || ea <= 0) return 0;
    return Math.pow(1 + ea, 1 / 12) - 1;
  };

  const calcularCuotaMensual = (monto: number, plazo: number, tasaMensual: number) => {
    const P = calcularMontoSan(monto);
    const n = calcularPlazoSan(plazo);
    const r = tasaMensual;

    if (P <= 0 || n <= 0) return 0;
    if (r <= 0) return P / n;

    const denom = 1 - Math.pow(1 + r, -n);
    if (denom <= 0) return 0;

    return (P * r) / denom;
  };

  const calcularTotalPagar = (cuotaMensual: number, plazo: number) => {
    return cuotaMensual * calcularPlazoSan(plazo);
  };

  const calcularIntereses = (totalPagar: number, monto: number) => {
    return Math.max(0, totalPagar - calcularMontoSan(monto));
  };

  const calcularCapacidadDisponible = (ingresosBrutos: number, descuentos: number, maxEndeudamientoPct: number) => {
    const capacidadMax = calcularCapacidadPagoMaxima(ingresosBrutos, maxEndeudamientoPct);
    const descSan = calcularDescuentosSan(descuentos);
    return Math.max(0, capacidadMax - descSan);
  };

  const calcularMargen = (capacidadDisponible: number, cuotaMensual: number) => {
    return capacidadDisponible - cuotaMensual;
  };

  const calcularApto = (cuotaMensual: number, capacidadDisponible: number) => {
    return cuotaMensual <= capacidadDisponible;
  };

  // Funciones de conversión de tasas (división simple por 12, 4 decimales)
  const convertirAnualAMensual = (tasaEA: number) => {
    if (!Number.isFinite(tasaEA) || tasaEA <= 0) return 0;
    return Math.round((tasaEA / 12) * 10000) / 10000;
  };

  const convertirMensualAAnual = (tasaMensual: number) => {
    if (!Number.isFinite(tasaMensual) || tasaMensual <= 0) return 0;
    return Math.round(tasaMensual * 12 * 10000) / 10000;
  };

  // Funciones de formateo
  const fmt = (value: number) => {
    const n = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(n);
  };

  const fmtPct = (value: number) => {
    const n = Number.isFinite(value) ? value : 0;
    return `${n.toFixed(2)}%`;
  };

  return {
    // Funciones de cálculo
    calcularMontoSan,
    calcularPlazoSan,
    calcularTasaEASan,
    calcularTasaMensualSan,
    calcularIngresosBrutosSan,
    calcularDescuentosSan,
    calcularMaxEndeudamientoSan,
    calcularIngresosSan,
    calcularSeguridadSocialSan,
    calcularCapacidadPagoMaxima,
    calcularTasaMensual,
    calcularCuotaMensual,
    calcularTotalPagar,
    calcularIntereses,
    calcularCapacidadDisponible,
    calcularMargen,
    calcularApto,

    // Funciones de conversión
    convertirAnualAMensual,
    convertirMensualAAnual,

    // Funciones de formateo
    fmt,
    fmtPct
  };
}
