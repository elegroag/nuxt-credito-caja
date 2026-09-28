export const TIPOS_ANEXO = ["PAGARE", "CARTA_INSTRUCCIONES", "OFICIO", "OTRO"] as const;

export type TipoAnexo = (typeof TIPOS_ANEXO)[number];

export const TIPO_ANEXO_LABELS: Record<TipoAnexo, string> = {
  PAGARE: "Pagaré",
  CARTA_INSTRUCCIONES: "Carta de instrucciones",
  OFICIO: "Oficio",
  OTRO: "Otro"
};

export const ANEXO_MAX_BYTES = 10 * 1024 * 1024;

export interface FirmarAnexo {
  id: string
  solicitud_id: string
  tipo_anexo: string
  nombre_original: string
  tamano_bytes: number | null
  orden: number
  username: string
  created_at: string | null
}
