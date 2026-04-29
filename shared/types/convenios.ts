export interface EmpresaConvenio {
    id: string;
    nit: string;
    razon_social: string;
    fecha_convenio: string;
    fecha_vencimiento: string;
    estado: string;
    representante_documento: string;
    representante_nombre: string;
    telefono: string;
    correo: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface ConveniosResponse {
    empresas: EmpresaConvenio[];
    pagination: PaginationInfo;
    conteo_estados: Record<string, number>;
}
