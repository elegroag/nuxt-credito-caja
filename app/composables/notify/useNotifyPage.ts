import { ref, computed } from "vue";
import { useNotifications } from "~/composables/useNotifications";

export type FilterType = "all" | "unread" | "read";

interface FilterOption {
  value: FilterType;
  label: string;
}

export function useNotifyPage() {
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
    stopPolling,
  } = useNotifications();

  const currentFilter = ref<FilterType>("all");

  const filters: FilterOption[] = [
    { value: "all", label: "Todas" },
    { value: "unread", label: "No leídas" },
    { value: "read", label: "Leídas" },
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

  const handleFilterChange = (filter: FilterType) => {
    currentFilter.value = filter;
  };

  const getEmptyStateMessage = () => {
    return currentFilter.value === "unread"
      ? "No tienes notificaciones sin leer"
      : "Todas tus notificaciones aparecerán aquí";
  };

  return {
    // Estado
    currentFilter,
    filters,
    filteredNotifications,

    // Propiedades del composable de notificaciones
    notifications,
    unreadCount,
    loading,
    error,
    hasUnread,
    unreadNotifications,
    readNotifications,

    // Métodos
    handleRefresh,
    handleMarkAsRead,
    handleMarkAllRead,
    handleDelete,
    handleFilterChange,
    getEmptyStateMessage,
    loadNotifications,
    startPolling,
    stopPolling,
  };
}
