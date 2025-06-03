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
