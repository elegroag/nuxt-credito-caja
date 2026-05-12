// Utilidades de formateo
export const fmtMoney = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(v);
};

export const fmtDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d);
};

export const normalizeEstado = (estado: string) => {
  return (estado || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const fmtPercent = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

export const fmtMoneySimple = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
};

export const fmtNumber = (value: number) => {
  return new Intl.NumberFormat("es-CO").format(value);
};

export const fmtDateSimple = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
};
