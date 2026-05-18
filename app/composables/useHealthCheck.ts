import { ref, computed } from "vue";
import { useApi } from "~/composables/useApi";

export function useHealthCheck() {
  const { baseUrl } = useApi();
  const isConnected = ref(false);
  const connectionError = ref("");
  const checkingConnection = ref(true);

  const connectionMessage = computed(() => {
    if (checkingConnection.value)
      return "Verificando conexión con el servidor...";
    if (connectionError.value)
      return `Error de conexión: ${connectionError.value}`;
    if (isConnected.value) return "Conectado";
    return "Sin conexión";
  });

  const connectionStatusClass = computed(() => {
    if (checkingConnection.value)
      return "bg-primary/10 text-primary border-primary/20";
    if (connectionError.value)
      return "bg-destructive/10 text-destructive border-destructive/20";
    if (isConnected.value)
      return "bg-secondary/10 text-secondary border-secondary/20";
    return "bg-muted text-muted-foreground border-border";
  });

  const checkConnection = async () => {
    try {
      checkingConnection.value = true;
      connectionError.value = "";

      const response = await fetch(`${baseUrl.value}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();
      isConnected.value = true;
    } catch (error: unknown) {
      isConnected.value = false;
      connectionError.value
        = error instanceof Error ? error.message : "No se puede conectar al servidor";
    } finally {
      checkingConnection.value = false;
    }
  };

  return {
    isConnected,
    connectionError,
    checkingConnection,
    connectionMessage,
    connectionStatusClass,
    checkConnection
  };
}
