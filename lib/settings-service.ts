// lib/settings-service.ts

export interface AdminSettings {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  browserNotifications?: boolean;
  notifyOnSubmissions?: boolean;
  notifyOnApprovals?: boolean;
  theme?: 'light' | 'dark' | 'system';
  compactMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Default admin settings
export const defaultAdminSettings = {
  twoFactorEnabled: false,
  emailNotifications: true,
  browserNotifications: true,
  notifyOnSubmissions: true,
  notifyOnApprovals: true,
  theme: 'system',
  compactMode: false,
  fontSize: 'medium'
};

/**
 * Fetches the admin user profile and settings
 */
export const fetchAdminSettings = async (): Promise<AdminSettings> => {
  try {
    const response = await fetch('/api/admin/settings');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch admin settings');
    }

    const data = await response.json();
    
    // Combine user profile with settings
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      ...data.settings
    };
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    throw error;
  }
};

/**
 * Updates admin profile and settings
 */
export const updateAdminSettings = async (settings: Partial<AdminSettings>): Promise<{ message: string; user: AdminSettings }> => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update admin settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating admin settings:', error);
    throw error;
  }
};

// Server-side functions to work with SystemSettings model
import { prisma } from '@/lib/prisma';

/**
 * Gets admin settings from SystemSettings table
 */
export async function getSystemAdminSettings(userId: string): Promise<any> {
  try {
    // Try to get from system settings with user-specific key
    const settingsRecord = await prisma.systemSettings.findUnique({
      where: { key: `admin_settings:${userId}` }
    });
    
    if (settingsRecord) {
      return JSON.parse(settingsRecord.value);
    }
    
    // Create default settings if not found
    await prisma.systemSettings.create({
      data: {
        key: `admin_settings:${userId}`,
        value: JSON.stringify(defaultAdminSettings),
        description: `Admin settings for user ${userId}`
      }
    });
    
    return defaultAdminSettings;
  } catch (error) {
    console.error('Error getting admin settings:', error);
    return defaultAdminSettings;
  }
}

/**
 * Updates admin settings in SystemSettings table
 */
export async function updateSystemAdminSettings(
  userId: string, 
  settings: any
): Promise<any> {
  try {
    // Get current settings
    const currentSettings = await getSystemAdminSettings(userId);
    
    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Update in database
    await prisma.systemSettings.upsert({
      where: { key: `admin_settings:${userId}` },
      update: {
        value: JSON.stringify(updatedSettings),
        updatedBy: userId,
        updatedAt: new Date()
      },
      create: {
        key: `admin_settings:${userId}`,
        value: JSON.stringify(updatedSettings),
        description: `Admin settings for user ${userId}`,
        updatedBy: userId
      }
    });
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating admin settings:', error);
    throw error;
  }
}
