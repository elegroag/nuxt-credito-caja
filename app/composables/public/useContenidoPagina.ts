import type {
  CmsField,
  CmsPageContent,
  CmsPageResponse
} from "~~/shared/types/cms";

export interface ContenidoPaginaState {
  data: CmsPageContent | null
  loading: boolean
  error: string | null
}

const CACHE_TTL_MS = 60 * 1000
const cache = new Map<string, { data: CmsPageContent; timestamp: number }>()

export const useContenidoPagina = async (slug: string) => {
  const state = useState<ContenidoPaginaState>(
    `cms-${slug}`,
    () => ({ data: null, loading: false, error: null })
  )
  const requestFetch = useRequestFetch()

  const fetchContent = async (force = false): Promise<CmsPageContent | null> => {
    if (!force) {
      const cached = cache.get(slug)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        state.value.data = cached.data
        return cached.data
      }
    }

    state.value.loading = true
    state.value.error = null
    try {
      const response = await requestFetch<CmsPageResponse>(
        `/api/public/cms/${encodeURIComponent(slug)}`
      )
      if (response?.success && response.data) {
        state.value.data = response.data
        cache.set(slug, { data: response.data, timestamp: Date.now() })
        return response.data
      }
      state.value.data = null
      return null
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      state.value.error = message
      return null
    } finally {
      state.value.loading = false
    }
  }

  // Carga inicial: si no hay datos en cache ni en estado, dispara la petición.
  // Se hace dentro de un Promise.resolve().then para no devolver la promesa
  // rechazada al composable (la función devuelve ya los datos cuando estén listos).
  if (!state.value.data && !state.value.loading) {
    await fetchContent()
  }

  const clearCache = () => {
    cache.delete(slug)
  }

  return {
    state,
    fetchContent,
    clearCache,
    section: (name: string): Record<string, CmsField> => state.value.data?.sections?.[name] ?? {},
    field: (section: string, key: string): CmsField | undefined =>
      state.value.data?.sections?.[section]?.[key]
  }
}

export const invalidateCmsCache = (slug?: string) => {
  if (slug) {
    cache.delete(slug)
    return
  }
  cache.clear()
}