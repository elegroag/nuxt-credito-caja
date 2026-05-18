import { ref, computed, onUnmounted } from "vue";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown> & {
    titulo: string;
    mensaje: string;
    solicitud_id?: string;
    url?: string;
  };
  read_at: string | null;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  total: number;
}

export function useNotifications() {
  const { getJson, putJson, deleteJson } = useApi();
  const { ready } = useSession();

  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Polling
  const pollingEnabled = ref(true);
  const pollingInterval = ref(100000); // 30 segundos
  let pollingTimer: NodeJS.Timeout | null = null;

  /**
   * Cargar notificaciones del usuario
   */
  const loadNotifications = async (onlyUnread = false, limit = 50): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      await ready;

      const params = new URLSearchParams();
      if (onlyUnread) params.append("unread", "true");
      params.append("limit", limit.toString());

      const response = await getJson<{
        success: boolean;
        data: NotificationsResponse;
        message: string;
      }>(`/api/notifications?${params.toString()}`, { auth: true });

      if (response.success && response.data) {
        notifications.value = response.data.notifications;
        unreadCount.value = response.data.unread_count;
      } else {
        throw new Error(response.message || "Error al cargar notificaciones");
      }
    } catch (e: unknown) {
      console.error("Error al cargar notificaciones:", e);
      error.value = e instanceof Error ? e.message : "Error al cargar notificaciones";
      notifications.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Actualizar solo el contador de no leídas
   */
  const updateUnreadCount = async (): Promise<void> => {
    try {
      await ready;

      const response = await getJson<{
        success: boolean;
        data: { unread_count: number };
      }>("/api/notifications/unread-count", { auth: true });

      if (response.success && response.data) {
        unreadCount.value = response.data.unread_count;
      }
    } catch (e: unknown) {
      console.error("Error al actualizar contador:", e);
    }
  };

  /**
   * Marcar notificación como leída
   */
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      await ready;

      const response = await putJson<{
        success: boolean;
        message: string;
      }>(`/api/notifications/${notificationId}/read`, {}, { auth: true });

      if (response.success) {
        // Actualizar localmente
        const notification = notifications.value.find((n) => n.id === notificationId);
        if (notification) {
          notification.read_at = new Date().toISOString();
        }

        // Decrementar contador
        if (unreadCount.value > 0) {
          unreadCount.value--;
        }

        return true;
      }

      return false;
    } catch (e: unknown) {
      console.error("Error al marcar como leída:", e);
      return false;
    }
  };

  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      await ready;

      const response = await putJson<{
        success: boolean;
        data: { marked_count: number };
        message: string;
      }>("/api/notifications/mark-all-read", {}, { auth: true });

      if (response.success) {
        // Actualizar localmente
        notifications.value.forEach((n) => {
          n.read_at = new Date().toISOString();
        });

        unreadCount.value = 0;
        return true;
      }

      return false;
    } catch (e: unknown) {
      console.error("Error al marcar todas como leídas:", e);
      return false;
    }
  };

  /**
   * Eliminar notificación
   */
  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
      await ready;

      const response = await deleteJson<{
        success: boolean;
        message: string;
      }>(`/api/notifications/${notificationId}`, { auth: true });

      if (response.success) {
        // Remover localmente
        const index = notifications.value.findIndex((n) => n.id === notificationId);
        const notification = notifications.value[index];
        if (index !== -1 && notification) {
          const wasUnread = !notification.read_at;
          notifications.value.splice(index, 1);

          if (wasUnread && unreadCount.value > 0) {
            unreadCount.value--;
          }
        }

        return true;
      }

      return false;
    } catch (e: unknown) {
      console.error("Error al eliminar notificación:", e);
      return false;
    }
  };

  /**
   * Iniciar polling automático
   */
  const startPolling = (): void => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }

    pollingEnabled.value = true;
    pollingTimer = setInterval(() => {
      if (pollingEnabled.value) {
        updateUnreadCount();
      }
    }, pollingInterval.value);
  };

  /**
   * Detener polling
   */
  const stopPolling = (): void => {
    pollingEnabled.value = false;
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  /**
   * Toggle polling
   */
  const togglePolling = (): void => {
    if (pollingEnabled.value) {
      stopPolling();
    } else {
      startPolling();
    }
  };

  // Computadas
  const hasUnread = computed(() => unreadCount.value > 0);
  const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read_at));
  const readNotifications = computed(() => notifications.value.filter((n) => n.read_at));

  /**
   * Formatear fecha relativa
   */
  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Hace unos segundos";
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (days < 7) return `Hace ${days} día${days > 1 ? "s" : ""}`;

    return notificationDate.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  /**
   * Obtener icono según tipo de notificación
   */
  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      firma_completada: "lucide:check-circle",
      firma_rechazada: "lucide:x-circle",
      firma_expirada: "lucide:alert-circle",
      solicitud_aprobada: "lucide:thumbs-up",
      solicitud_rechazada: "lucide:thumbs-down",
      documento_requerido: "lucide:file-text",
      estado_actualizado: "lucide:refresh-cw",
      comentario_nuevo: "lucide:message-circle",
      recordatorio: "lucide:bell"
    };
    return icons[type] || "lucide:bell";
  };

  /**
   * Obtener color según tipo de notificación
   */
  const getNotificationColor = (type: string): string => {
    const colors: Record<string, string> = {
      firma_completada: "text-green-600",
      firma_rechazada: "text-red-600",
      firma_expirada: "text-orange-600",
      solicitud_aprobada: "text-green-600",
      solicitud_rechazada: "text-red-600",
      documento_requerido: "text-blue-600",
      estado_actualizado: "text-blue-600",
      comentario_nuevo: "text-purple-600",
      recordatorio: "text-yellow-600"
    };
    return colors[type] || "text-gray-600";
  };

  // Cleanup al desmontar
  onUnmounted(() => {
    stopPolling();
  });

  return {
    // Estado
    notifications,
    unreadCount,
    loading,
    error,
    pollingEnabled,

    // Computadas
    hasUnread,
    unreadNotifications,
    readNotifications,

    // Métodos
    loadNotifications,
    updateUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
    togglePolling,
    formatRelativeTime,
    getNotificationIcon,
    getNotificationColor
  };
}
