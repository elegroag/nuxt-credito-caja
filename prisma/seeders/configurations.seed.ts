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
  },
  {
    clave: "salario_minimo",
    valor: "1750905",
    descripcion: "Valor del salario minimo actual",
    tipo: "number",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "auxilio_transporte",
    valor: "249095",
    descripcion: "Valor del auxilio de transporte",
    tipo: "number",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "referencias_familiares",
    valor: "1",
    descripcion: "Se especifica la cantidad de referencias familiares minimas",
    tipo: "number",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "referencias_personales",
    valor: "1",
    descripcion: "Se especifica la cantidad de referencias personales minimas",
    tipo: "number",
    categoria: "solicitudes",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "firma_digital_local",
    valor: "false",
    descripcion:
      "Indica si el proceso de firma digital se realiza localmente o mediante proveedor externo",
    tipo: "boolean",
    categoria: "firma_digital",
    editable: true,
    required: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    clave: "form_contact",
    valor: JSON.stringify({
      email: "creditos@comfaca.com",
      telefono: "1234567",
      extension: "1020",
      ciudad: "Florencia Cáqueta",
      horarios: "Lunes a Viernes 8:00 AM - 5:00 PM"
    }),
    descripcion: "Configuración de contacto del formulario de crédito",
    tipo: "json",
    categoria: "contacto",
    editable: true,
    required: false,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  }
];
