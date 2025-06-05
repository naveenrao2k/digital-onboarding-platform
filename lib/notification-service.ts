/**
 * Client-side notification service
 */

import { 
  fetchUserNotificationsAction, 
  markAsRead, 
  dismissNotification 
} from '@/app/api/user/notifications/actions';

/**
 * Fetch the user's notifications
 * @param userId The user's ID
 * @param limit Maximum number of notifications to fetch
 * @returns Array of notifications
 */
export async function fetchUserNotifications(userId: string, limit: number = 10) {
  try {
    // Use the server action to fetch notifications
    const response = await fetchUserNotificationsAction(userId, limit);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch notifications');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return an empty array instead of throwing to prevent UI breaks
    return [];
  }
}

/**
 * Mark a notification as read (client-side wrapper)
 * @param notificationId The ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const result = await markAsRead(notificationId);
    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Delete a notification (client-side wrapper)
 * @param notificationId The ID of the notification to delete
 */
export async function deleteNotification(notificationId: string) {
  try {
    const result = await dismissNotification(notificationId);
    return result;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}
