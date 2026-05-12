<template>
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Notificaciones
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Gestiona todas tus notificaciones
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            v-if="hasUnread"
            variant="outline"
            :disabled="loading"
            @click="handleMarkAllRead"
          >
            <Icon
              name="lucide:check-check"
              class="h-4 w-4 mr-2"
            />
            Marcar todas como leídas
          </UButton>
          <UButton
            variant="outline"
            :disabled="loading"
            @click="handleRefresh"
          >
            <Icon
              :name="loading ? 'lucide:loader-2' : 'lucide:refresh-cw'"
              :class="loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
            />
          </UButton>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <Icon
                name="lucide:bell"
                class="h-5 w-5 text-blue-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ notifications.length }}
              </p>
              <p class="text-sm text-gray-500">
                Total
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <Icon
                name="lucide:mail"
                class="h-5 w-5 text-yellow-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ unreadCount }}
              </p>
              <p class="text-sm text-gray-500">
                No leídas
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <Icon
                name="lucide:mail-open"
                class="h-5 w-5 text-green-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ readNotifications.length }}
              </p>
              <p class="text-sm text-gray-500">
                Leídas
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Filtros -->
    <UCard class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Icon
            name="lucide:filter"
            class="h-4 w-4 text-gray-500"
          />
          <span class="text-sm font-medium text-gray-700">Filtrar:</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
              currentFilter === filter.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]"
            @click="handleFilterChange(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div
      v-if="loading && notifications.length === 0"
      class="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <Icon
        name="lucide:loader-2"
        class="h-12 w-12 animate-spin text-blue-600"
      />
      <p class="text-gray-600">
        Cargando notificaciones...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 border border-red-200 p-4"
    >
      <div class="flex items-center gap-2 text-red-800">
        <Icon
          name="lucide:alert-circle"
          class="h-5 w-5"
        />
        <p class="font-medium">
          {{ error }}
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredNotifications.length === 0"
      class="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <Icon
        name="lucide:inbox"
        class="h-16 w-16 text-gray-400"
      />
      <p class="text-gray-600 text-lg">
        No hay notificaciones
      </p>
      <p class="text-gray-500 text-sm">
        {{ getEmptyStateMessage() }}
      </p>
    </div>

    <!-- Lista de Notificaciones -->
    <div
      v-else
      class="space-y-3"
    >
      <UCard
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="shadow-sm hover:shadow-md transition-shadow p-0"
      >
        <NotificationItem
          :notification="notification"
          @mark-as-read="handleMarkAsRead"
          @delete="handleDelete"
        />
      </UCard>
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
  unreadNotifications,
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
