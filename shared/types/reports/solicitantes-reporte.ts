export interface ReporteSolicitantesFiltros {
  fecha_desde?: string
  fecha_hasta?: string
  tipo_documento?: string
  estado_solicitud?: string
}

export interface ReporteSolicitanteRow {
  numero_solicitud: string
  fecha_radicado: string
  estado_solicitud: string
  tipo_persona: string
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  fecha_expedicion: string
  genero: string
  estado_civil: string
  nivel_educativo: string
  profesion: string
  email: string
  telefono_fijo: string
  telefono_movil: string
  direccion: string
  barrio: string
  ciudad: string
  departamento: string
  salario: number | null
  antiguedad_meses: number | null
  tipo_contrato: string
  empresa_sector: string
}

export interface ReporteSolicitantesPreview {
  collection: ReporteSolicitanteRow[]
  total: number
  limit: number
}

export interface ReporteArchivoItem {
  filename: string
  size_bytes: number
  created_at: string
}

export const REPORTE_SOLICITANTES_MAX_ROWS = 5000;
export const REPORTE_SOLICITANTES_PREVIEW_LIMIT = 50;
