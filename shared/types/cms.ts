export type CmsFieldType = "text" | "html" | "image" | "json"

export interface CmsField {
  clave: string
  valor: string
  tipo: string
  descripcion: string | null
  orden: number
}

export interface CmsPageContent {
  slug: string
  fields: Record<string, CmsField>
  sections: Record<string, Record<string, CmsField>>
  updatedAt: string | null
}

export interface CmsPageSummary {
  slug: string
  fields: Record<string, CmsField>
  sections: Record<string, Record<string, CmsField>>
  updatedAt: string | null
}

export interface CmsPagesListResponse {
  success: boolean
  data: {
    pages: CmsPageSummary[]
  }
  message: string
}

export interface CmsPageResponse {
  success: boolean
  data: CmsPageContent
  message: string
}

export interface CmsUploadResult {
  url: string
  filename: string
  mime: string
  size: number
  slug: string
}

export interface CmsUploadResponse {
  success: boolean
  data: CmsUploadResult
  message: string
}

export interface CmsFieldInput {
  clave: string
  valor: string
  tipo: CmsFieldType
  descripcion?: string | null
}

export interface CmsSavePayload {
  fields: CmsFieldInput[]
}

export const CMS_FIELD_TYPES: CmsFieldType[] = ["text", "html", "image", "json"]