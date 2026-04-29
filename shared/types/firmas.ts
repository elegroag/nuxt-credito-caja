// Types para FirmaPlus API (no generación XML local)

export interface FirmanteData {
    nombre_apellidos: string;
    tipo_identificacion: string;
    numero_identificacion: string;
    email: string;
    rol: string;
}

export interface FirmaPlusRequest {
    solicitud_id: string;
    firmantes: FirmanteData[];
}

export interface FirmaPlusResponse {
    success: boolean;
    transaccion_id: string;
    url_firmantes: string[];
    message: string;
}

export interface EstadoFirmadoResponse {
    success: boolean;
    estado: string;
    firmantes_completados: number;
    firmantes_pendientes: number;
    fecha_consulta: string;
}