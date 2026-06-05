/**
 * Helpers de formato y presentación para notificaciones.
 *
 * Se mantienen fuera de useNotifications() para que componentes
 * presentacionales (NotificationItem) puedan consumirlos sin
 * instanciar el composable entero y disparar efectos como polling
 * u onUnmounted.
 */

const icons: Record<string, string> = {
  firma_completada: "lucide:check-circle",
  firma_rechazada: "lucide:x-circle",
  firma_expirada: "lucide:alert-circle",
  solicitud_aprobada: "lucide:thumbs-up",
  solicitud_rechazada: "lucide:thumbs-down",
  documento_requerido: "lucide:file-text",
  estado_actualizado: "lucide:refresh-cw",
  solicitud_estado_actualizado: "lucide:refresh-cw",
  comentario_nuevo: "lucide:message-circle",
  recordatorio: "lucide:bell"
};

const colors: Record<string, string> = {
  firma_completada: "text-green-600",
  firma_rechazada: "text-red-600",
  firma_expirada: "text-orange-600",
  solicitud_aprobada: "text-green-600",
  solicitud_rechazada: "text-red-600",
  documento_requerido: "text-blue-600",
  estado_actualizado: "text-blue-600",
  solicitud_estado_actualizado: "text-blue-600",
  comentario_nuevo: "text-purple-600",
  recordatorio: "text-yellow-600"
};

/**
 * Formatea una fecha ISO como tiempo relativo en español.
 */
export function formatRelativeTime(date: string): string {
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
}

/**
 * Devuelve el nombre del icono Iconify según el tipo de notificación.
 */
export function getNotificationIcon(type: string): string {
  return icons[type] || "lucide:bell";
}

/**
 * Devuelve la clase de color de Tailwind según el tipo de notificación.
 */
export function getNotificationColor(type: string): string {
  return colors[type] || "text-gray-600";
}
