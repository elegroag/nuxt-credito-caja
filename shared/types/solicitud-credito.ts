export type Moneda = "COP";

export type RolEnSolicitud = "T" | "S" | "C" | "E";

export type TipoIdentificacion = "CC" | "CE";

export type ProductoTipo = string;

export type Sexo = "M" | "F";

export type NivelEducativo
  = | "primaria"
    | "bachillerato"
    | "tecnico"
    | "universitario"
    | "posgrado"
    | "ninguno";

export type TipoVivienda = string | "N" | "F" | "P" | "A" | "H";

export type TiempoServicioUnidad = "meses" | "anios";

export type TipoBien = "vivienda" | "vehiculo";

export interface WizardStep {
  key: string
  title: string
  short: string
}

export interface WizardState {
  step: number
  successModalOpen: boolean
}

export interface Solicitante {
  tipo_persona: string
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  razon_social: string
  nit: string
  fecha_nacimiento: string
  genero: string
  estado_civil: string
  nivel_educativo: string
  profesion: string
  email: string
  telefono?: string
  celular: string
  direccion: string
  barrio: string
  ciudad: string
  departamento: string
  pais_residencia?: string
  tipo_vivienda?: string
  vive_con_nucleo_familiar?: boolean
  personas_a_cargo?: number
  fecha_vinculacion?: string
  cargo: string
  salario: number
  antiguedad_meses?: number
  tipo_contrato?: string
  sector_economico?: string
  codigo_categoria: string
}

// Tipo específico para datos del solicitante del backend (API response)
export interface SolicitanteBackend {
  id: number
  solicitud_id: string
  tipo_persona: string
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  razon_social: string
  nit: string
  fecha_nacimiento: string
  pais_nacimiento?: string
  fecha_expedicion?: string
  genero: string
  estado_civil: string
  nivel_educativo: string
  profesion: string
  email: string
  telefono_fijo?: string
  telefono_movil?: string
  direccion: string
  barrio: string
  ciudad: string
  departamento: string
  pais_residencia?: string
  tipo_vivienda?: string
  vive_con_nucleo_familiar?: boolean
  personas_a_cargo?: number
  fecha_vinculacion?: string
  cargo: string
  salario: number
  antiguedad_meses?: number
  tipo_contrato?: string
  sector_economico?: string
  codigo_categoria: string
}

export interface LineaCredito {
  tipcre: string
  pagseg: string
  modxml4: number
  numero_cuotas: number
  estado: string
  detalle_modalidad: string
  codser?: string
  auxest?: string
  codigo_cap?: string
  codigo_cen?: string
  codigo_con?: string
  codigo_cre?: string
  codigo_int?: string
  codigo_mor?: string
  codigo_ser?: string
  estcre?: number
  repdcr?: string
  tipfin?: string
  tasa_interes: number
  total_intereses: number
  total_pagar: number
}

export interface Solicitud {
  numero_solicitud: string
  numero_comprobante: string
  valor_solicitud: number
  categoria: string
  rol_en_solicitud: RolEnSolicitud
  valor_solicitado: number
  cuota_mensual: number
  plazo_meses: number
  moneda: Moneda
  tipcre?: string
  modxml4?: number
  detalle_modalidad?: string
  fecha_radicado: string
  producto_tipo: ProductoTipo
  ha_tenido_credito: boolean
}

export interface Conyuge {
  identificacion: string
  nombres_apellidos: string
  ingresos_laborales: number
  trabaja: boolean
  moneda?: Moneda
  telefono_movil: string
  empresa?: {
    nombre: string
    direccion: string
    telefono: string
    email: string
  }
}

export interface InformacionLaboral {
  empresa_razon_social: string
  empresa_nit: string
  empresa_telefono: string
  empresa_direccion: string
  empresa_ciudad: string
  cargo: string
  fecha_ingreso: string
  tipo_contrato: string
  nombramiento_o_pagador: string
  tiempo_servicio: number
  tiempo_servicio_unidad?: TiempoServicioUnidad
}

export interface IngresosDescuentos {
  moneda: Moneda
  salario_basico_mensual: number
  subsidio_transporte: number
  horas_extras: number
  comisiones: number
  otros_ingresos: number
  total_ingresos: number
  salud_pension: number
  libranzas_comfaca: number
  otras_libranzas: number
  judiciales: number
  otras_deducciones: number
  total_descuentos: number
  total_neto_recibido: number
}

export interface Deuda {
  acreedor_nombre: string
  concepto: string
  valor_cuota: number
  saldo_obligacion: number
}

export interface Propiedad {
  tipo_bien: TipoBien
  descripcion: string
  ciudad: string
  matricula_inmobiliaria?: string
  modelo_o_matricula?: string
  valor_comercial: number
}

export interface InformacionEconomica {
  moneda: Moneda
  arrendamientos: number
  otros: number
  descripcion: string
  total_gastos: number
  gastos_descripcion: string
  total_activos: number
  total_pasivos: number
}

export interface SolicitudCreditoPayload {
  solicitud: Solicitud
  linea_credito: LineaCredito
  solicitante: Solicitante
  conyuge?: Conyuge
  informacion_laboral: InformacionLaboral
  ingresos_descuentos: IngresosDescuentos
  informacion_economica: InformacionEconomica
  propiedades: Array<Propiedad>
  deudas: Array<Deuda>
  referencias: {
    familiares: Array<{
      nombre_apellidos: string
      celular: string
    }>
    personales: Array<{
      nombre_apellidos: string
      celular: string
    }>
  }
}

export interface DocumentoRequerido {
  id: string
  nombre: string
  tipo: string
  obligatorio: boolean
  descripcion?: string
}

export interface DocumentoCargado {
  id: string
  nombre_original: string
  created_at: string
  documento_requerido_id?: string // Para relacionar con el documento requerido (snake_case como en el backend)
  saved_filename: string
  tamano_bytes: number
  tipo_mime?: string
  ruta_archivo: string
  documento_uuid: string
}

export type EstadoSolicitud
  = | "POSTULADO"
    | "DOCUMENTOS_CARGADOS"
    | "ENVIADO_VALIDACION"
    | "PENDIENTE_FIRMADO"
    | "FIRMADO"
    | "ENVIADO_PENDIENTE_APROBACION"
    | "APROBADO"
    | "DESEMBOLSADO"
    | "FINALIZADO"
    | "RECHAZADO"
    | "DESISTE";

export interface Firmante {
  nombre_completo: string
  email: string
  numero_documento: string
  tipo_documento?: string
  rol?: string
  telefono?: string
}

export interface SolicitanteBasic {
  email: string
  nombres_apellidos: string
  numero_documento: string
  telefono_movil: string
  tipo_documento: string
  fecha_nacimiento?: string
  genero?: string
  codigo_categoria?: string
  cargo?: string
  nivel_educativo?: string
  nombres?: string
  apellidos?: string
  nit?: string
  razon_social?: string
  direccion?: string
  pais_residencia?: string
  personas_a_cargo?: number
  tipo_vivienda?: string
  ciudad?: string
}

export interface SolicitudCredito {
  id: string
  created_at: string
  updated_at: string
  cuota_mensual: number
  valor_solicitud: number
  detalle_modalidad: string
  tipo_credito: string
  estado: EstadoSolicitud
  monto_solicitado: number
  plazo_meses: number
  numero_solicitud: string
  fecha_postulacion?: string
  fecha_radicado?: string
  tasa_interes?: number
  descripcion_solicitud?: string
  solicitante: SolicitanteBasic
  documentos: DocumentoCargado[]
  firmantes?: Firmante[]
  payload: SolicitudCreditoPayload
  timeline: Array<{
    estado: EstadoSolicitud
    fecha: string
    detalle: string
  }>
  pdfs_generados?: {
    filename: string
    path: string
    generado_en: string
  }
}

// Tipo para respuesta del API de consulta de solicitudes
export interface SolicitudCreditoResponse extends Omit<
  SolicitudCredito,
  "solicitante"
> {
  solicitante: SolicitanteBackend
}

export interface SelectOption {
  label: string
  value: string | number | boolean
  description?: string
}

export interface CiudadOption {
  codciu: string
  detciu: string
}

export interface SolocitanteProps {
  form: any
  ciudades?: CiudadOption[]
  tiposDocumento?: any[]
  sexos?: any[]
  nivelesEducativos?: any[]
  tiposVivienda?: any[]
  ocupaciones?: any[]
  estadoCiviles?: any[]
}

export interface SolicitudProps {
  form: any
  tiposInversion?: Array<{ tipinv: string, detalle: string }>
}

export interface RevisionProps {
  prettyPayload: string
  xmlText?: string
  savedFilename?: string
  errorMsg?: string
  mensajeProgreso?: string
  loadingPdf?: boolean
  pdfGenerado?: boolean
  pdfFilename?: string | null
}

export interface PropiedadesProps {
  form: any
  addPropiedad: () => void
  removePropiedad: (index: number) => void
  ciudades?: any[]
}

export interface LaboralProps {
  form: any
  ciudades?: any[]
  tiposContrato?: any[]
  ocupaciones?: any[]
}

export interface IngrresosProps {
  form: any
  autocalcularIngresos: () => void
}

export interface DeudasProps {
  form: any
  addDeuda: () => void
  removeDeuda: (index: number) => void
}

export interface ConyugeProps {
  form: any
  toggleConyuge: (checked: boolean) => void
  toggleEmpresaConyuge: (checked: boolean) => void
}

export interface WizardProps {
  parametros?: any
  initialStep?: string
}

export interface InEstadoSolicitud {
  id: string
  nombre: string
  descripcion: string
  orden: number
  color: string
  activo: boolean
}

export interface AccionData {
  estado: string
  descripcion?: string
}

export interface GuardarSolicitudResponse {
  data: {
    numero_solicitud: string
  }
  _data: string // XML response
}
