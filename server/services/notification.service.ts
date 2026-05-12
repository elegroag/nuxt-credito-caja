import prisma from "~~/lib/prisma";

const notificationService = () => {
  const generateId = () => {
    return crypto.randomUUID();
  };

  const getNotifications = async (username: string) => {
    const notifications = await prisma.notifications.findMany({
      where: {
        owner_username: username
      },
      orderBy: {
        created_at: "desc"
      },
      take: 50
    });

    return notifications.map((notification: any) => ({
      id: String(notification.id),
      type: notification.type,
      data: notification.data,
      read_at: notification.read_at?.toISOString() || null,
      created_at: notification.created_at?.toISOString() || null
    }));
  };

  const getUnreadCount = async (username: string) => {
    const count = await prisma.notifications.count({
      where: {
        owner_username: username,
        read_at: null
      }
    });

    return String(count);
  };

  const markAsRead = async (id: string, username: string) => {
    const notification = await prisma.notifications.findUnique({
      where: { id }
    });

    if (!notification || notification.owner_username !== username) {
      throw new Error("Notification not found or unauthorized");
    }

    const updated = await prisma.notifications.update({
      where: { id },
      data: {
        read_at: new Date()
      }
    });

    return {
      id: String(updated.id),
      read_at: updated.read_at?.toISOString() || null
    };
  };

  const markAllAsRead = async (username: string) => {
    const result = await prisma.notifications.updateMany({
      where: {
        owner_username: username,
        read_at: null
      },
      data: {
        read_at: new Date()
      }
    });

    return {
      count: String(result.count)
    };
  };

  const createNotification = async (data: {
    owner_username: string
    type: string
    data: any
  }) => {
    const notification = await prisma.notifications.create({
      data: {
        id: generateId(),
        owner_username: data.owner_username,
        type: data.type,
        data: data.data as any,
        notifiable_type: "User",
        notifiable_id: "1",
        read_at: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return {
      id: String(notification.id),
      type: notification.type,
      data: notification.data,
      read_at: notification.read_at?.toISOString() || null,
      created_at: notification.created_at?.toISOString() || null
    };
  };

  return {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification
  };
};

export default notificationService;
