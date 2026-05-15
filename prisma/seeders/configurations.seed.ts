export const configurations = [
  {
    clave: "limite_solicitudes",
    valor: "10",
    descripcion: "Límite máximo de solicitudes activas por usuario",
    tipo: "number",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "limite_cuotas",
    valor: "60",
    descripcion: "Límite máximo de cuotas para un crédito",
    tipo: "number",
    categoria: "credito",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "minimo_endeudamiento",
    valor: "30",
    descripcion: "Porcentaje mínimo de endeudamiento permitido",
    tipo: "percentage",
    categoria: "credito",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "minimo_salario",
    valor: "1300000",
    descripcion: "Salario mínimo requerido para solicitar crédito (en pesos)",
    tipo: "currency",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "status_online",
    valor: "true",
    descripcion: "Indica si el sistema está operando normalmente",
    tipo: "boolean",
    categoria: "sistema",
    editable: true,
    required: false,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "minima_referencias",
    valor: "2",
    descripcion: "Cantidad mínima de referencias requeridas por solicitante",
    tipo: "number",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "tiempo_response",
    valor: "30",
    descripcion: "Tiempo máximo de respuesta en dias para servicios externos",
    tipo: "number",
    categoria: "sistema",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "notificacion_firma",
    valor: "true",
    descripcion: "Habilitar notificaciones de firma digital",
    tipo: "boolean",
    categoria: "notificaciones",
    editable: true,
    required: false,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "notificacion_estado",
    valor: "true",
    descripcion: "Habilitar notificaciones de cambio de estado de solicitud",
    tipo: "boolean",
    categoria: "notificaciones",
    editable: true,
    required: false,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "notificacion_plazo",
    valor: "true",
    descripcion: "Habilitar recordatorios de plazo para obligaciones",
    tipo: "boolean",
    categoria: "notificaciones",
    editable: true,
    required: false,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  }
];
