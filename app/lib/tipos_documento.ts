/**
 * Helper para tipos de documento del sistema
 * Basado en el helper del backend: app/Helpers/types_helper.php
 */

export interface TipoDocumento {
    value: string;
    label: string;
}

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
    { value: '1', label: 'CEDULA DE CIUDADANIA' },
    { value: '3', label: 'NIT' },
    { value: '4', label: 'CEDULA EXTRANJERIA' },
    { value: '6', label: 'PASAPORTE' },
    { value: '8', label: 'PERMISO ESPECIAL DE PERMANENCIA' },
    { value: '9', label: 'CERTIFICADO CABILDO' },
    { value: '10', label: 'TARJETA DE MOVILIDAD FRONTERIZA' },
    { value: '11', label: 'CARNE DIPLOMATICO' },
    { value: '12', label: 'IDENTIFICACION DADA POR LA SECRETARIA DE EDUCACION' },
    { value: '13', label: 'VISA' },
    { value: '14', label: 'PERMISO PROTECCION TEMPORAL' }
];

export const TIPOS_DOCUMENTO_ARRAY: Record<string, string> = {
    '1': 'CEDULA DE CIUDADANIA',
    '3': 'NIT',
    '4': 'CEDULA EXTRANJERIA',
    '6': 'PASAPORTE',
    '8': 'PERMISO ESPECIAL DE PERMANENCIA',
    '9': 'CERTIFICADO CABILDO',
    '10': 'TARJETA DE MOVILIDAD FRONTERIZA',
    '11': 'CARNE DIPLOMATICO',
    '12': 'IDENTIFICACION DADA POR LA SECRETARIA DE EDUCACION',
    '13': 'VISA',
    '14': 'PERMISO PROTECCION TEMPORAL'
};

/**
 * Obtiene el label de un tipo de documento por su valor
 */
export function getTipoDocumentoLabel(value: string): string {
    return TIPOS_DOCUMENTO_ARRAY[value] || 'Desconocido';
}

/**
 * Obtiene los tipos de documento para select options
 */
export function getTiposDocumentoOptions(): TipoDocumento[] {
    return TIPOS_DOCUMENTO;
}

/**
 * Valida si un tipo de documento es válido
 */
export function isValidTipoDocumento(value: string): boolean {
    return value in TIPOS_DOCUMENTO_ARRAY;
}

/**
 * Obtiene el tipo de documento por defecto (Cédula de Ciudadanía)
 */
export function getDefaultTipoDocumento(): string {
    return '1';
}
