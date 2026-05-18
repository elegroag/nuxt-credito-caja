<template>
  <UCard
    class="flex flex-col max-h-[600px]"
    :ui="{ body: 'p-0' }"
  >
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between p-4">
        <h3 class="text-lg font-semibold text-foreground">
          Notificaciones
        </h3>
        <div class="flex items-center gap-2">
          <UButton
            v-if="unreadCount > 0"
            variant="ghost"
            color="primary"
            size="xs"
            @click="$emit('mark-all-read')"
          >
            Marcar todas como leídas
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-x"
            @click="$emit('close')"
          />
        </div>
      </div>
    </template>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 animate-spin text-primary"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="notifications.length === 0"
      class="flex flex-col items-center justify-center py-12 px-4"
    >
      <UIcon
        name="i-lucide-inbox"
        class="w-16 h-16 text-muted-foreground/50 mb-3"
      />
      <p class="text-muted-foreground text-center">
        No tienes notificaciones
      </p>
    </div>

    <!-- Lista de Notificaciones -->
    <div
      v-else
      class="overflow-y-auto"
    >
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @mark-as-read="$emit('mark-as-read', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

    <!-- Footer -->
    <template #footer>
      <UButton
        variant="ghost"
        color="primary"
        block
        @click="$emit('view-all')"
      >
        Ver todas las notificaciones
      </UButton>
    </template>
  </UCard>
</template>

<script setup lang="ts">
interface NotificationData {
    titulo: string
    mensaje: string
    [key: string]: unknown
  }

interface Notification {
    id: string
    type: string
    data: NotificationData
    read_at: string | null
    created_at: string
  }

interface Props {
  notifications: Notification[]
  loading: boolean
  unreadCount: number
}

defineProps<Props>();

defineEmits<{
  "mark-as-read": [notificationId: string]
  "mark-all-read": []
  "delete": [notificationId: string]
  "view-all": []
  "close": []
}>();
</script>
