export interface LineaCreditoSimulador {
  tipcre: string
  codcre: string
  detalle: string
  modxml4: number
  tipfin?: string
  pagseg: string
  codcap?: string
  codint?: string
  codmor?: string
  repdcr?: string
  codcon?: string
  codser?: string
  numcuo: number
  estcre: number
  auxest: string
  estado: string
  codcen: string
  documentos?: LineaCreditoDocumento[]
  categorias?: LineaCreditoCategoria[]
}

export type LineaCreditoSimuladorType = LineaCreditoSimulador;

export interface LineaCreditoDocumento {
  tipdoc: string
  obliga: string
  detalle: string
}

export interface LineaCreditoCategoria {
  tipcre: string
  codcat: string
  facfin: string
  facmor: string
  facpig: string
}

export interface Modalidad {
  modxml4: number
  nombre: string
  descripcion: string
  icono: string
  lineas: LineaCreditoSimulador[]
}

export interface SimuladorData {
  monto: number
  plazoMeses: number
  tasaEfectivaAnual: number
  ingresosMensuales: number
  descuentosMensuales: number
  maxEndeudamientoPct: number
}

export interface SimuladorResultados {
  cuotaMensual: number
  totalPagar: number
  intereses: number
  capacidadDisponible: number
  maxCuotaPermitida: number
  margen: number
  apto: boolean
}

// Interface extendida para almacenamiento en localStorage
export interface SimuladorStorageData extends SimuladorData {
  lineaCredito: LineaCreditoSimulador // Datos de la línea de crédito seleccionada
  montoCredito: number // Alias para monto
  tasaInteresAnual: number // Alias para tasaEfectivaAnual
  cuotaMensual: number // Resultado del cálculo
  totalIntereses: number // Resultado del cálculo
  totalPagar: number // Resultado del cálculo
  fechaSimulacion: string // Fecha de la simulación
  // Datos del convenio empresarial (opcionales)
  tieneConvenio?: boolean // Si el trabajador tiene convenio
  convenioVerificado?: boolean // Si se verificó el convenio
  nitEmpresa?: string // NIT de la empresa
  cedulaTrabajador?: string // Cédula del trabajador
}

export interface ConvenioValidationResponse {
  success: boolean
  data: {
    elegible: boolean
    convenio: {
      nit: number
      razon_social: string
      representante_nombre: string
      representante_documento: string
      correo: string
      telefono: string
      estado: string
      fecha_convenio: string
      fecha_vencimiento: string
    }
    trabajador: {
      cedula: string
      nombre_completo: string
      estado: string
      meses_servicio: number
      fecha_afiliacion: string
      salario: number
      cargo: string
      email: string
    }
    mensaje: string
  }
  message: string
}

export interface ConvenioValidationError {
  success: false
  error_type: string
  message: string
  details?: Record<string, string>
}
