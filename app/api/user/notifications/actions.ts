'use server';

import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { NotificationType } from '@/app/generated/prisma';

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse> {
  return await markNotificationAsRead(notificationId);
}

/**
 * Dismiss (delete) a notification
 */
export async function dismissNotification(notificationId: string): Promise<ApiResponse> {
  // If it's a system-generated notification (prefixed with 'system-'), just return success
  if (notificationId.startsWith('system-')) {
    return { success: true };
  }
  
  // For actual database notifications, delete them
  return await deleteNotification(notificationId);
}

/**
 * Fetch user notifications (server action)
 * @Server-only This action uses PrismaClient and must run on the server
 */
'use server';
export async function fetchUserNotificationsAction(userId: string, limit: number = 10): Promise<ApiResponse<any[]>> {
  try {
    // Get all notifications for the user from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Look for any rejected documents that may need resubmission
    const rejectedDocuments = await prisma.kYCDocument.findMany({
      where: {
        userId: userId,
        status: 'REJECTED',
      },
    });
    
    // Format notifications with proper links and context
    const formattedNotifications = notifications.map(notification => {
      // If this notification is related to document resubmission, add a link to the upload page
      if (notification.message.includes('resubmission') || notification.title.includes('Resubmission')) {
        return {
          ...notification,
          link: notification.link || '/user/upload-kyc-documents',
        };
      }
      return notification;
    });

    // Add notifications for rejected documents if they don't already have one
    const existingResubmissionNotificationIds = new Set(
      notifications
        .filter(n => n.message.includes('resubmission') || n.title.includes('Resubmission'))
        .map(n => n.id)
    );

    // If there are rejected documents but no corresponding notifications, generate them
    if (rejectedDocuments.length > 0 && existingResubmissionNotificationIds.size === 0) {
      // Create a system notification for each rejected document
      for (const doc of rejectedDocuments) {
        const documentType = doc.type.toString().replace(/_/g, ' ').toLowerCase();
        const notificationExists = notifications.some(
          n => n.message.includes(documentType) && 
               (n.message.includes('resubmission') || n.title.includes('Resubmission'))
        );
        
        if (!notificationExists) {
          // This is a client-side addition only - not stored in the database
          formattedNotifications.push({
            id: `system-${doc.id}`,
            userId: userId,
            title: 'Document Resubmission Required',
            message: `Your ${documentType} document was rejected. Please resubmit an updated document.`,
            type: 'WARNING',
            read: false,
            createdAt: new Date(),
            link: '/user/upload-kyc-documents'
          });
        }
      }
    }

    // For development purposes, if there are no notifications at all, add a test one
    if (process.env.NODE_ENV === 'development' && formattedNotifications.length === 0) {
      formattedNotifications.push({
        id: 'test-notification-1',
        userId: userId,
        title: 'Test: Document Resubmission Required',
        message: 'This is a test notification. Your identification document was rejected. Please resubmit a clearer image.',
        type: 'WARNING',
        read: false,
        createdAt: new Date(),
        link: '/user/upload-kyc-documents'
      });
    }

    return { success: true, data: formattedNotifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}
