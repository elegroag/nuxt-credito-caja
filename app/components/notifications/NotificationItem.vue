<template>
  <div
    :class="[
      'flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer',
      !notification.read_at ? 'bg-primary/5' : ''
    ]"
    @click="handleClick"
  >
    <!-- Icono -->
    <div
      :class="[
        'shrink-0 p-2 rounded-full',
        !notification.read_at ? 'bg-primary/20' : 'bg-muted'
      ]"
    >
      <UIcon
        :name="getNotificationIcon(notification.type)"
        :class="['w-5 h-5', getNotificationColor(notification.type)]"
      />
    </div>

    <!-- Contenido -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-foreground mb-1">
            {{ notification.data.titulo }}
          </h4>
          <p class="text-sm text-muted-foreground line-clamp-2">
            {{ notification.data.mensaje }}
          </p>
        </div>

        <!-- Indicador de no leída -->
        <div
          v-if="!notification.read_at"
          class="shrink-0"
        >
          <div class="w-2 h-2 bg-primary rounded-full" />
        </div>
      </div>

      <!-- Metadata -->
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-muted-foreground">
          {{ formatRelativeTime(notification.created_at) }}
        </span>

        <!-- Acciones -->
        <div class="flex items-center gap-1">
          <UButton
            v-if="!notification.read_at"
            variant="ghost"
            color="primary"
            size="xs"
            icon="i-lucide-check"
            title="Marcar como leída"
            @click.stop="$emit('mark-as-read', notification.id)"
          />
          <UButton
            variant="ghost"
            color="destructive"
            size="xs"
            icon="i-lucide-trash-2"
            title="Eliminar"
            @click.stop="handleDelete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useNotifications } from "~/composables/useNotifications";

interface NotificationData {
    titulo: string
    mensaje: string
    url?: string
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
  notification: Notification
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "mark-as-read": [notificationId: string]
  "delete": [notificationId: string]
}>();

const router = useRouter();
const { formatRelativeTime, getNotificationIcon, getNotificationColor }
  = useNotifications();

const handleClick = () => {
  if (!props.notification.read_at) {
    emit("mark-as-read", props.notification.id);
  }
  if (props.notification.data.url) {
    router.push(props.notification.data.url);
  }
};

const handleDelete = () => {
  if (confirm("¿Estás seguro de que deseas eliminar esta notificación?")) {
    emit("delete", props.notification.id);
  }
};
</script>
