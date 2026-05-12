import { ref, computed, onMounted, onUnmounted } from "vue";
import { useNotifications } from "~/composables/useNotifications";

export const useNotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasUnread,
    unreadNotifications,
    readNotifications,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling
  } = useNotifications();

  const currentFilter = ref<"all" | "unread" | "read">("all");

  const filters = [
    { value: "all", label: "Todas" },
    { value: "unread", label: "No leídas" },
    { value: "read", label: "Leídas" }
  ];

  const filteredNotifications = computed(() => {
    switch (currentFilter.value) {
      case "unread":
        return unreadNotifications.value;
      case "read":
        return readNotifications.value;
      default:
        return notifications.value;
    }
  });

  const handleRefresh = async () => {
    await loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllRead = async () => {
    const confirmed = confirm("¿Marcar todas las notificaciones como leídas?");
    if (confirmed) {
      await markAllAsRead();
      await loadNotifications();
    }
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  // Cargar datos y iniciar polling al montar el componente
  onMounted(async () => {
    await loadNotifications();
    startPolling();
  });

  // Detener polling al desmontar el componente
  onUnmounted(() => {
    stopPolling();
  });

  return {
    // Estado del composable base
    notifications,
    unreadCount,
    loading,
    error,
    hasUnread,
    unreadNotifications,
    readNotifications,

    // Estado específico de la página
    currentFilter,
    filters,
    filteredNotifications,

    // Funciones de manejo
    handleRefresh,
    handleMarkAsRead,
    handleMarkAllRead,
    handleDelete,

    // Funciones del composable base
    loadNotifications,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    deleteNotification: deleteNotification
  };
};
