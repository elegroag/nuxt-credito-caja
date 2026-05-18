import type { TipoInversion } from "./credito";
import type { Ciudades, Ocupacion, TipoContrato } from "./parametros";
import type { Conyuge, Deuda, InformacionLaboral, IngresosDescuentos, Propiedad } from "./payload";
import type { SolicitanteBasic } from "./solicitante";
import type { Solicitud } from "./solicitud";

export interface CiudadOption {
  codciu: string;
  detciu: string;
}

export interface SolicitudProps {
  form: {
    solicitud: Solicitud;
    solicitante: SolicitanteBasic;
  };
  tiposInversion?: readonly TipoInversion[];
}

export interface RevisionProps {
  prettyPayload: string;
  xmlText?: string;
  savedFilename?: string;
  errorMsg?: string;
  mensajeProgreso?: string;
  loadingPdf?: boolean;
  pdfGenerado?: boolean;
  pdfFilename?: string | null;
}

export interface PropiedadesProps {
  form: {
    propiedades: Propiedad[];
  };
  addPropiedad: () => void;
  removePropiedad: (index: number) => void;
  ciudades?: readonly Ciudades[];
}

export interface LaboralProps {
  form: {
    informacion_laboral: InformacionLaboral;
  };
  ciudades?: readonly Ciudades[];
  tiposContrato?: readonly TipoContrato[];
  ocupaciones?: readonly Ocupacion[];
  errors?: Record<string, string>;
  disabled?: boolean;
}

export interface IngresosProps {
  form: {
    ingresos_descuentos: IngresosDescuentos;
  };
  autocalcularIngresos: () => void;
}

export interface DeudasProps {
  form: {
    deudas: Deuda[];
  };
  addDeuda: () => void;
  removeDeuda: (index: number) => void;
}

export interface ConyugeProps {
  form: {
    conyuge?: Conyuge;
    informacion_laboral?: InformacionLaboral;
  };
  toggleConyuge: (checked: boolean) => void;
  toggleEmpresaConyuge: (checked: boolean) => void;
}

export interface InEstadoSolicitud {
  id: string;
  nombre: string;
  descripcion: string;
  orden: number;
  color: string;
  activo: boolean;
}

export interface AccionData {
  estado: string;
  descripcion?: string;
}

export interface GuardarSolicitudResponse {
  data: {
    numero_solicitud: string;
  };
  _data: string;
}
