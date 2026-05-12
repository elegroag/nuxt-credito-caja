<template>
  <UPopover
    v-model:open="isOpen"
    arrow
    :ui="{ content: 'w-[350px] p-4' }"
  >
    <UButton
      variant="ghost"
      color="neutral"
      :aria-label="`Notificaciones${hasUnread ? ` (${unreadCount} no leídas)` : ''}`"
      @click="toggleDropdown"
    >
      <template #leading>
        <UIcon
          name="i-lucide-bell"
          class="w-5 h-5"
        />
      </template>
      <template
        v-if="hasUnread"
        #trailing
      >
        <UBadge
          color="destructive"
          variant="solid"
          size="xs"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1"
        >
          {{ unreadCount > 99 ? "99+" : unreadCount }}
        </UBadge>
      </template>
    </UButton>

    <template #content>
      <NotificationDropdown
        :notifications="notifications"
        :loading="loading"
        :unread-count="unreadCount"
        @mark-as-read="handleMarkAsRead"
        @mark-all-read="handleMarkAllRead"
        @delete="handleDelete"
        @view-all="handleViewAll"
        @close="closeDropdown"
      />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useNotifications } from "~/composables/useNotifications";
import NotificationDropdown from "./NotificationDropdown.vue";

const router = useRouter();
const isOpen = ref(false);

const {
  notifications,
  unreadCount,
  loading,
  hasUnread,
  loadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  startPolling,
  stopPolling,
  updateUnreadCount
} = useNotifications();

const toggleDropdown = async () => {
  if (!isOpen.value) {
    await loadNotifications(false, 10);
  }
};

const closeDropdown = () => {
  isOpen.value = false;
};

const handleMarkAsRead = async (notificationId: string) => {
  await markAsRead(notificationId);
};

const handleMarkAllRead = async () => {
  await markAllAsRead();
  await loadNotifications(false, 10);
};

const handleDelete = async (notificationId: string) => {
  await deleteNotification(notificationId);
};

const handleViewAll = () => {
  closeDropdown();
  router.push("/dash/notify");
};

onMounted(() => {
  updateUnreadCount();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>
