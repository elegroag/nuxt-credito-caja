export interface DocumentoRequerido {
  id: string;
  nombre: string;
  tipo: string;
  obligatorio: boolean;
  descripcion?: string;
}

export interface DocumentoCargado {
  id: string;
  nombre_original: string;
  created_at: string;
  documento_requerido_id?: string;
  saved_filename: string;
  tamano_bytes: number;
  tipo_mime?: string;
  ruta_archivo: string;
  documento_uuid: string;
}

export interface Firmante {
  nombre_completo: string;
  email: string;
  numero_documento: string;
  tipo_documento?: string;
  rol?: string;
  telefono?: string;
}
