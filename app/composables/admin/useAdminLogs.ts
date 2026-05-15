import { ref, computed } from "vue";
import { $fetch } from "ofetch";

export interface ParsedLogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  context?: string;
  raw: string;
}

export interface LogsResponse {
  success: boolean;
  data: {
    logs: ParsedLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

const levelColors: Record<string, "primary" | "secondary" | "accent" | "destructive" | "muted" | "neutral"> = {
  DEBUG: "neutral",
  INFO: "primary",
  WARN: "muted",
  ERROR: "destructive"
};

const levelIcons: Record<string, string> = {
  DEBUG: "i-lucide-bug",
  INFO: "i-lucide-info",
  WARN: "i-lucide-alert-triangle",
  ERROR: "i-lucide-alert-octagon"
};

export function useAdminLogs() {
  const logs = ref<ParsedLogEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalLogs = ref(0);
  const totalPages = ref(0);

  const filtros = ref({
    level: null as string | null,
    search: ""
  });

  const paginacion = ref({
    page: 1,
    limit: 20
  });

  const paginaActual = computed(() => paginacion.value.page);
  const conteoPorNivel = computed(() => {
    const counts: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0
    };
    return counts;
  });

  const cargarLogs = async () => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({
        page: paginacion.value.page.toString(),
        limit: paginacion.value.limit.toString()
      });

      if (filtros.value.level) {
        params.append("level", filtros.value.level);
      }

      if (filtros.value.search) {
        params.append("search", filtros.value.search);
      }

      const response = await $fetch<LogsResponse>(
        `/api/admin/logs?${params.toString()}`
      );

      if (response.success && response.data) {
        logs.value = response.data.logs || [];
        totalLogs.value = response.data.total || 0;
        totalPages.value = response.data.totalPages || 0;
      } else {
        error.value = response.message || "No se pudieron cargar los logs";
        logs.value = [];
        totalLogs.value = 0;
      }
    } catch (err: any) {
      console.error("Error al cargar logs:", err);
      error.value = err.data?.message || err.message || "Error al cargar los logs";
      logs.value = [];
      totalLogs.value = 0;
    } finally {
      loading.value = false;
    }
  };

  const recargarLogs = () => {
    paginacion.value.page = 1;
    cargarLogs();
  };

  const vaciarLogs = async (): Promise<boolean> => {
    try {
      const response = await $fetch<{ success: boolean; message?: string }>(
        "/api/admin/logs/clear",
        { method: "DELETE" }
      );
      if (response.success) {
        logs.value = [];
        totalLogs.value = 0;
        totalPages.value = 0;
        return true;
      }
      error.value = response.message || "No se pudieron vaciar los logs";
      return false;
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Error al vaciar los logs";
      return false;
    }
  };

  const descargarLogs = () => {
    window.open("/api/admin/logs/download", "_blank");
  };

  const irAPagina = (pagina: number) => {
    paginacion.value.page = pagina;
    cargarLogs();
  };

  const cambiarLimite = (nuevoLimite: number) => {
    paginacion.value.limit = nuevoLimite;
    paginacion.value.page = 1;
    cargarLogs();
  };

  const aplicarFiltros = () => {
    paginacion.value.page = 1;
    cargarLogs();
  };

  const limpiarFiltros = () => {
    filtros.value = { level: null, search: "" };
    paginacion.value.page = 1;
    cargarLogs();
  };

  const debounceSearch = ref<NodeJS.Timeout | null>(null);

  const onSearchInput = () => {
    if (debounceSearch.value) clearTimeout(debounceSearch.value);
    debounceSearch.value = setTimeout(() => {
      paginacion.value.page = 1;
      cargarLogs();
    }, 400);
  };

  const getLevelColor = (level: string): "primary" | "secondary" | "accent" | "destructive" | "muted" | "neutral" => {
    return levelColors[level] || "neutral";
  };

  const getLevelIcon = (level: string): string => {
    return levelIcons[level] || "i-lucide-circle";
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return timestamp;
    }
  };

  const parseContext = (contextStr: string | undefined): Record<string, unknown> | null => {
    if (!contextStr) return null;
    try {
      return JSON.parse(contextStr);
    } catch {
      return null;
    }
  };

  return {
    logs,
    loading,
    error,
    totalLogs,
    totalPages,
    paginaActual,
    filtros,
    paginacion,
    conteoPorNivel,
    cargarLogs,
    recargarLogs,
    vaciarLogs,
    descargarLogs,
    irAPagina,
    cambiarLimite,
    aplicarFiltros,
    limpiarFiltros,
    onSearchInput,
    getLevelColor,
    getLevelIcon,
    formatTimestamp,
    parseContext
  };
}