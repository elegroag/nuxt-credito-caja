<template>
  <div class="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
          <UIcon name="i-lucide-bell" class="w-5 h-5 text-primary" />
          Notificaciones
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">Gestiona todas tus notificaciones</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="hasUnread"
          variant="outline"
          color="primary"
          icon="i-lucide-check-check"
          :disabled="loading"
          @click="handleMarkAllRead"
        >
          Marcar todas como leídas
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'"
          :loading="loading"
          :disabled="loading"
          @click="handleRefresh"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UPageCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-100 rounded-lg">
            <UIcon name="i-lucide-bell" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">
              {{ notifications.length }}
            </p>
            <p class="text-sm text-muted-foreground">
              Total
            </p>
          </div>
        </div>
      </UPageCard>

      <UPageCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-warning-100 rounded-lg">
            <UIcon name="i-lucide-mail" class="w-5 h-5 text-warning" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">
              {{ unreadCount }}
            </p>
            <p class="text-sm text-muted-foreground">
              No leídas
            </p>
          </div>
        </div>
      </UPageCard>

      <UPageCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 rounded-lg">
            <UIcon name="i-lucide-mail-open" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-foreground">
              {{ readNotifications.length }}
            </p>
            <p class="text-sm text-muted-foreground">
              Leídas
            </p>
          </div>
        </div>
      </UPageCard>
    </div>

    <UPageCard>
      <div class="flex flex-wrap items-center gap-4">
        <span class="text-sm font-medium text-foreground">Filtrar:</span>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="filter in filters"
            :key="filter.value"
            :variant="currentFilter === filter.value ? 'solid' : 'outline'"
            :color="currentFilter === filter.value ? 'primary' : 'neutral'"
            size="sm"
            @click="handleFilterChange(filter.value)"
          >
            {{ filter.label }}
          </UButton>
        </div>
      </div>
    </UPageCard>

    <div v-if="loading && notifications.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando notificaciones…</p>
    </div>

    <UAlert v-else-if="error" color="destructive" variant="subtle" icon="i-lucide-triangle-alert" :title="error" />

    <div v-else-if="filteredNotifications.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <UIcon name="i-lucide-inbox" class="w-10 h-10 opacity-30" />
      <p class="text-sm">No hay notificaciones</p>
      <p class="text-xs text-muted-foreground">{{ getEmptyStateMessage() }}</p>
    </div>

    <div v-else class="space-y-3">
      <UPageCard
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="hover:shadow-md transition-shadow"
      >
        <NotificationItem
          :notification="notification"
          @mark-as-read="handleMarkAsRead"
          @delete="handleDelete"
        />
      </UPageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import NotificationItem from "@/components/notifications/NotificationItem.vue";
import { useNotifyPage } from "~/composables/notify/useNotifyPage";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  currentFilter,
  filters,
  filteredNotifications,
  notifications,
  unreadCount,
  loading,
  error,
  hasUnread,
  readNotifications,
  handleRefresh,
  handleMarkAsRead,
  handleMarkAllRead,
  handleDelete,
  handleFilterChange,
  getEmptyStateMessage,
  loadNotifications,
  startPolling
} = useNotifyPage();

onMounted(async () => {
  await loadNotifications();
  startPolling();
});
</script>