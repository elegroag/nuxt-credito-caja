import prisma from "~~/lib/prisma";

/**
 * Servicio para el CMS dinámico de páginas públicas.
 *
 * Estrategia: reutilizamos la tabla `configurations` con:
 *   - categoria = "cms"
 *   - clave = "cms.<slug>.<seccion>.<campo>"   (slug = "productos" | "nosotros" | "contacto")
 *   - tipo     = "text" | "html" | "image" | "json"
 *
 * Esto evita migraciones y reutiliza el endpoint PUT existente
 * (`/api/configurations/:clave`) que ya valida rol administrador.
 */

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

const CMS_CATEGORY = "cms"
const KEY_PREFIX = "cms."
const SEPARATOR = "."

interface PrismaConfiguration {
  id: bigint
  clave: string
  valor: string
  descripcion: string | null
  tipo: string
  categoria: string
  editable: boolean
  required: boolean
  created_at: Date | null
  updated_at: Date | null
}

const sanitizeSlug = (slug: string): string => {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, "")
}

const parseKey = (key: string): { slug: string; seccion: string; campo: string } | null => {
  if (!key.startsWith(KEY_PREFIX)) return null
  const rest = key.slice(KEY_PREFIX.length)
  const parts = rest.split(SEPARATOR)
  if (parts.length < 3) return null
  const slug = parts[0]
  const seccion = parts[1]
  const campo = parts.slice(2).join(SEPARATOR)
  if (!slug || !seccion || !campo) return null
  return { slug, seccion, campo }
}

const cmsPaginasService = () => {
  const fetchBySlug = async (slug: string): Promise<PrismaConfiguration[]> => {
    const safeSlug = sanitizeSlug(slug)
    if (!safeSlug) return []
    const rows = await prisma.configurations.findMany({
      where: {
        categoria: CMS_CATEGORY,
        clave: { startsWith: `${KEY_PREFIX}${safeSlug}${SEPARATOR}` }
      },
      orderBy: [{ clave: "asc" }]
    })
    return rows as unknown as PrismaConfiguration[]
  }

  const fetchAll = async (): Promise<PrismaConfiguration[]> => {
    const rows = await prisma.configurations.findMany({
      where: { categoria: CMS_CATEGORY },
      orderBy: [{ clave: "asc" }]
    })
    return rows as unknown as PrismaConfiguration[]
  }

  const mapFields = (rows: PrismaConfiguration[]): {
    fields: Record<string, CmsField>
    sections: Record<string, Record<string, CmsField>>
    updatedAt: string | null
  } => {
    const fields: Record<string, CmsField> = {}
    const sections: Record<string, Record<string, CmsField>> = {}
    let latest: number | null = null

    rows.forEach((row, idx) => {
      const parsed = parseKey(row.clave)
      if (!parsed) return
      const field: CmsField = {
        clave: row.clave,
        valor: row.valor,
        tipo: row.tipo,
        descripcion: row.descripcion,
        orden: idx
      }
      fields[`${parsed.seccion}.${parsed.campo}`] = field
      const seccionActual = sections[parsed.seccion] ?? {}
      seccionActual[parsed.campo] = field
      sections[parsed.seccion] = seccionActual

      const ts = row.updated_at ? row.updated_at.getTime() : null
      if (ts !== null && (latest === null || ts > latest)) {
        latest = ts
      }
    })

    return {
      fields,
      sections,
      updatedAt: latest ? new Date(latest).toISOString() : null
    }
  }

  const getPageContent = async (slug: string): Promise<CmsPageContent> => {
    const safeSlug = sanitizeSlug(slug)
    const rows = await fetchBySlug(safeSlug)
    const mapped = mapFields(rows)
    return {
      slug: safeSlug,
      ...mapped
    }
  }

  const listSlugs = async (): Promise<string[]> => {
    const rows = await fetchAll()
    const set = new Set<string>()
    rows.forEach((row) => {
      const parsed = parseKey(row.clave)
      if (parsed) set.add(parsed.slug)
    })
    return Array.from(set).sort()
  }

  const listAllPages = async (): Promise<CmsPageContent[]> => {
    const rows = await fetchAll()
    const bySlug = new Map<string, PrismaConfiguration[]>()
    rows.forEach((row) => {
      const parsed = parseKey(row.clave)
      if (!parsed) return
      const arr = bySlug.get(parsed.slug) ?? []
      arr.push(row)
      bySlug.set(parsed.slug, arr)
    })

    return Array.from(bySlug.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, items]) => {
        const mapped = mapFields(items)
        return { slug, ...mapped }
      })
  }

  return {
    getPageContent,
    listSlugs,
    listAllPages,
    parseKey,
    sanitizeSlug
  }
}

export default cmsPaginasService