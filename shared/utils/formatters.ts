export const formatCurrency = (value: number): string => {
  return value.toLocaleString("es-CO");
};

export const formatCurrencyIntl = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

// Función para formatear valores
export const formatValue = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "number") {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

// Función para formatear las claves
export const formatRevisionKey = (key: string) => {
  // Mapeo de claves a nombres legibles en español
  const keyMap: Record<string, string> = {
    linea_credito: "Línea de Crédito",
    tipo_credito: "Tipo Crédito",
    modelo_xml4: "Modelo XML4",
    codigo_cre: "Código Cre",
    codigo_cap: "Código Cap",
    codigo_ser: "Código Ser",
    numero_cuotas: "Número Cuotas",
    estado: "Estado",
    monto_simulado: "Monto Simulado",
    plazo_meses: "Plazo Meses",
    tasa_anual: "Tasa Anual",
    cuota_mensual: "Cuota Mensual",
    fecha_radicado: "Fecha Radicado",
    valor_solicitud: "Valor Solicitud",
    categoria: "Categoría",
    tipcre: "Tipo Crédito",
    modxml4: "Modalidad Crédito",
    detalle_modalidad: "Modalidad de Crédito",
    nombres_apellidos: "Nombres y Apellidos",
    nombres: "Nombres",
    apellidos: "Apellidos",
    tipo_documento: "Tipo Identificación",
    numero_documento: "Número Identificación",
    fecha_nacimiento: "Fecha Nacimiento",
    telefono_movil: "Teléfono",
    email: "Email",
    barrio_residencia: "Dirección",
    ciudad_residencia: "Ciudad Residencia",
    empresa_razon_social: "Empresa",
    empresa_nit: "NIT",
    cargo: "Cargo",
    fecha_ingreso: "Fecha Ingreso",
    salario_basico_mensual: "Salario Básico",
    subsidio_transporte: "Subsidio Transporte",
    salud_pension: "Salud y Pensión"
  };

  return (
    keyMap[key]
    || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  );
};

// Función helper para formatear índices
export const formatRevisionIndex = (index: number | string) => {
  const numIndex = typeof index === "string" ? parseInt(index, 10) : index;
  return String(numIndex + 1);
};
