'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User,
  Shield,
  Bell,
  Monitor,
  Camera,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  // Security settings
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  twoFactorEnabled: boolean;
  // Notification settings
  emailNotifications: boolean;
  browserNotifications: boolean;
  notifyOnSubmissions: boolean;
  notifyOnApprovals: boolean;
  // Appearance settings
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

type TabType = 'profile' | 'security' | 'notifications' | 'appearance';

const AdminSettingsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'ADMIN',
    twoFactorEnabled: false,
    emailNotifications: true,
    browserNotifications: true,
    notifyOnSubmissions: true,
    notifyOnApprovals: true,
    theme: 'system',
    compactMode: false,
    fontSize: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is authenticated and has admin role
  useEffect(() => {
    fetchProfile();
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // router.push('/user/dashboard');
      } else {
        fetchProfile();
      }
    }
  }, [user, loading, router]);
  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800));
        // Mock data using the user context data
      setProfile({
        firstName: user?.firstName || 'John',
        lastName: user?.lastName || 'Doe',
        email: user?.email || 'john.doe@example.com',
        role: 'ADMIN',
        twoFactorEnabled: false,
        emailNotifications: true,
        browserNotifications: true,
        notifyOnSubmissions: true,
        notifyOnApprovals: true,
        theme: 'system',
        compactMode: false,
        fontSize: 'medium'
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      switch (activeTab) {
        case 'profile':
          // Validate profile fields
          if (!profile.firstName || !profile.lastName || !profile.email) {
            throw new Error('All fields are required');
          }
          break;

        case 'security':
          // Validate password change if attempted
          if (profile.currentPassword || profile.newPassword || profile.confirmPassword) {
            if (!profile.currentPassword) {
              throw new Error('Current password is required');
            }
            if (!profile.newPassword) {
              throw new Error('New password is required');
            }
            if (!profile.confirmPassword) {
              throw new Error('Please confirm your new password');
            }
            if (profile.newPassword !== profile.confirmPassword) {
              throw new Error('New passwords do not match');
            }
            if (profile.newPassword.length < 8) {
              throw new Error('New password must be at least 8 characters long');
            }
          }
          break;

        case 'notifications':
          // No validation needed for notifications
          break;

        case 'appearance':
          // Validate theme and font size
          if (!['light', 'dark', 'system'].includes(profile.theme)) {
            throw new Error('Invalid theme selection');
          }
          if (!['small', 'medium', 'large'].includes(profile.fontSize)) {
            throw new Error('Invalid font size selection');
          }
          break;
      }

      // Call API endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const successMessages = {
        profile: 'Profile updated successfully!',
        security: 'Security settings updated successfully!',
        notifications: 'Notification preferences saved!',
        appearance: 'Appearance settings updated!'
      };
      
      setSuccessMessage(successMessages[activeTab]);
      
      // Clear sensitive data after successful password change
      if (activeTab === 'security' && (profile.currentPassword || profile.newPassword)) {
        setProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || `Failed to update ${activeTab} settings`);
    } finally {
      setIsSaving(false);
    }
  };
  const handleProfileChange = (field: keyof UserProfile, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className=" mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <nav className="p-2 space-y-3">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'security' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="h-5 w-5 mr-3" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-5 w-5 mr-3" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'appearance' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Monitor className="h-5 w-5 mr-3" />
                Appearance
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                  
                  {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg text-green-800">
                      {successMessage}
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg text-red-800">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile}>
                    {/* Avatar */}
                    <div className="mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-semibold text-blue-600">
                          {profile.avatarUrl ? (
                            <img 
                              src={profile.avatarUrl} 
                              alt="Profile" 
                              className="h-20 w-20 rounded-full object-cover"
                            />
                          ) : (
                            profile.firstName.charAt(0) + profile.lastName.charAt(0)
                          )}
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Change Picture
                        </button>
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Role */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={profile.role}
                        disabled
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 cursor-not-allowed"
                      >
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}            {activeTab === 'security' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                  
                  {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg text-green-800">
                      {successMessage}
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg text-red-800">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile}>
                    {/* Password Change */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={profile.currentPassword || ''}
                          onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={profile.newPassword || ''}
                          onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={profile.confirmPassword || ''}
                          onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.twoFactorEnabled}
                            onChange={() => handleProfileChange('twoFactorEnabled', !profile.twoFactorEnabled)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Security Settings'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

                  {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg text-green-800">
                      {successMessage}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile}>
                    <div className="space-y-6">
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.emailNotifications}
                            onChange={() => handleProfileChange('emailNotifications', !profile.emailNotifications)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Browser Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Browser Notifications</h3>
                          <p className="text-sm text-gray-500">Show desktop notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.browserNotifications}
                            onChange={() => handleProfileChange('browserNotifications', !profile.browserNotifications)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Notify on Submissions */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">New Submissions</h3>
                          <p className="text-sm text-gray-500">Get notified when new documents are submitted</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.notifyOnSubmissions}
                            onChange={() => handleProfileChange('notifyOnSubmissions', !profile.notifyOnSubmissions)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Notify on Approvals */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Document Approvals</h3>
                          <p className="text-sm text-gray-500">Get notified when documents are approved</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.notifyOnApprovals}
                            onChange={() => handleProfileChange('notifyOnApprovals', !profile.notifyOnApprovals)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Notification Settings'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>

                  {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg text-green-800">
                      {successMessage}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile}>
                    {/* Theme Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Theme
                      </label>
                      <select
                        value={profile.theme}
                        onChange={(e) => handleProfileChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">Choose your preferred color theme</p>
                    </div>

                    {/* Compact Mode */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Compact Mode</h3>
                          <p className="text-sm text-gray-500">Use a more compact layout</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.compactMode}
                            onChange={() => handleProfileChange('compactMode', !profile.compactMode)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size
                      </label>
                      <select
                        value={profile.fontSize}
                        onChange={(e) => handleProfileChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">Adjust the text size throughout the application</p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Appearance Settings'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;