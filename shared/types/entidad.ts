export type TipoIdentificacionExtendido = '1' | '3' | '4' | '6' | '8' | '9' | '10' | '11' | '12' | '13' | '14';

export interface EntidadDigitalBasicData {
    tipoIdentificacion: TipoIdentificacionExtendido;
    numeroIdentificacion: string;
}

export interface EntidadDigitalCompleta {
    username: string;
    tipo_identificacion: TipoIdentificacionExtendido;
    numero_identificacion: string;
    clave: string;
    documentos: Record<string, string>;
    selfie: string;
}

export interface EntidadDigitalVerificationData {
    tipoIdentificacion: string;
    numeroIdentificacion: string;
    documents: {
        front: string;
        back: string;
    };
    selfie: string;
}

export interface QrTokenResponse {
    success: boolean;
    data: {
        qr_token: string,
        expires_at: number,
        user: {
            username: string;
        };
    },
    timestamp?: string,
    error?: string;
}

export interface SocketConfirmaCapturasResponse {
    success: boolean;
    data: EntidadDigitalVerificationData;
    error?: string;
}

export interface DocumentosPostulante {
    front: string;
    back: string;
}

export interface DocumentosRequestPayload {
    postulante_id: string;
    tipo_identificacion: string;
    numero_identificacion: string;
    documentos: Record<string, string>;
}

export interface SelfieRequestPayload {
    postulante_id: string;
    tipo_identificacion: string;
    numero_identificacion: string;
    selfie: string;
}

export interface ProcesoCompletoRequestPayload extends DocumentosRequestPayload {
    selfie: string;
}
