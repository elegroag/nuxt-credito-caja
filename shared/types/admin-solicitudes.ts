/**
 * Tipos para la administración de solicitudes
 */

import type { ComputedRef, Ref } from "vue";
import type { InformacionLaboral, IngresosDescuentos, InformacionEconomica } from "./payload";
import type { LineaCreditoSimulador } from "./simulador";

export interface FiltrosSolicitudes {
  // Filtros de fecha
  fecha_desde?: string
  fecha_hasta?: string
  rango_fechas?: {
    inicio: string
    fin: string
  }

  // Filtros de usuario
  numero_documento?: string
  nombre_usuario?: string
  owner_username?: string

  // Filtros de estado
  estados?: string[]

  // Filtros de solicitud
  numero_solicitud?: string
  monto_minimo?: number
  monto_maximo?: number

  // Paginación
  skip?: number
  limit?: number

  // Ordenamiento
  ordenar_por?: string
  orden_direccion?: "asc" | "desc"
}

export interface SolicitudAdmin {
  id: string
  created_at: string
  updated_at: string
  estado: string
  valor_solicitud?: number
  plazo_meses?: number
  numero_solicitud?: string
  tipcre?: string
  tipo_credito?: string
  detalle_modalidad?: string
  owner_username: string
  payload?: {
    informacion_laboral?: InformacionLaboral
    ingresos_descuentos?: IngresosDescuentos
    informacion_economica?: InformacionEconomica
    linea_credito?: LineaCreditoSimulador
  }
  timeline: Array<{
    estado: string
    fecha: string
    detalle?: string
    descripcion?: string
  }>
  documentos?: Array<{
    id: string
    documento_requerido_id: string
    nombre_original: string
    saved_filename: string
    tipo_mime: string
    tamano_bytes: number
    created_at: string
  }>
  solicitante?: {
    email: string
    nombres: string
    apellidos: string
    numero_documento: string
    telefono_movil: string
    tipo_documento: string
  }
}

export interface SolicitudesResponse {
  data: {
    collection: SolicitudAdmin[]
    pagination: {
      page: number
      page_size: number
      total: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
  }
  message: string
  success: boolean
  timestamp: string
}

export interface EstadosCount {
  [estado: string]: number
}

export interface OpcionesFiltro {
  estados: string[]
  usuarios: Array<{
    username: string
    nombre_completo: string
    numero_documento: string
  }>
}

// Opciones de ordenamiento
export const OPCIONES_ORDENAMIENTO = [
  { value: "created_at", label: "Fecha de creación" },
  { value: "updated_at", label: "Fecha de actualización" },
  { value: "monto_solicitado", label: "Monto solicitado" },
  { value: "numero_solicitud", label: "Número de solicitud" },
  { value: "owner_username", label: "Usuario" },
  { value: "estado", label: "Estado" }
] as const;

// Estados disponibles
export const ESTADOS_DISPONIBLES = [
  "Postulado",
  "Documentos cargados",
  "Firmado",
  "Aprobado",
  "Rechazado",
  "Enviado (pendiente de aprobación)",
  "Enviado",
  "Desiste"
] as const;

export interface UseSolicitudesBuscar {
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  solicitudes: Readonly<ComputedRef<SolicitudAdmin[]>>
  totalItems: Readonly<Ref<number>>
  tieneFiltrosActivos: ComputedRef<boolean>
  aplicarFiltros: (nuevosFiltros: Partial<FiltrosSolicitudes>) => void
  limpiarFiltros: () => void
}
