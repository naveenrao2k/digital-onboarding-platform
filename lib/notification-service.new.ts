import { prisma } from './prisma';
import { fetchUserNotificationsAction } from '@/app/api/user/notifications/actions';

/**
 * Fetch the user's notifications
 * This function now delegates to a server action to avoid Prisma in the browser
 * @param userId The user's ID
 * @param limit Maximum number of notifications to fetch
 * @returns Array of notifications
 */
export async function fetchUserNotifications(userId: string, limit: number = 10) {
  try {
    // Use a server action to get notifications
    const response = await fetchUserNotificationsAction(userId, limit);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch notifications');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Mark a notification as read
 * @param notificationId The ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    // If it's a system-generated notification, just return success
    if (notificationId.startsWith('system-')) {
      return { success: true };
    }
    
    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Delete a notification
 * @param notificationId The ID of the notification to delete
 */
export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}
