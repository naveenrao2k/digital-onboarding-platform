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
  Menu,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useHeader } from '../hooks';

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
  const { updateHeader } = useHeader();
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
  const [error, setError] = useState(''); const [successMessage, setSuccessMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // Set the header title
    updateHeader('Settings', 'Manage your account preferences and profile');
  }, [user, loading, router, updateHeader]);

  // Close sidebar on mobile when a tab is selected
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [activeTab]);
  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/settings');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load profile data');
      }

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role
      }));
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile data');
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
      }      // Prepare request data
      const requestData = {
        updateType: activeTab,
        ...(activeTab === 'profile' ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email
        } : activeTab === 'security' ? {
          currentPassword: profile.currentPassword,
          newPassword: profile.newPassword
        } : {})
      };

      console.log('Sending request:', {
        type: requestData.updateType,
        hasCurrentPassword: !!profile.currentPassword,
        hasNewPassword: !!profile.newPassword
      });

      // Call API endpoint
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }); if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', {
          status: response.status,
          error: errorData.error
        });
        throw new Error(errorData.error || `Failed to update ${activeTab} settings`);
      }

      const data = await response.json();

      // Update profile data with response
      setProfile(prev => ({
        ...prev,
        ...data,
        ...(activeTab === 'security' && {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }));

      const successMessages: Record<TabType, string> = {
        profile: 'Profile updated successfully!',
        security: 'Security settings updated successfully!',
        notifications: 'Notification settings updated successfully!',
        appearance: 'Appearance settings updated successfully!'
      };

      setSuccessMessage(successMessages[activeTab]);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div className="sr-only">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="mt-4 sm:hidden flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Menu className="h-5 w-5 mr-2" />
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation - Mobile Dropdown */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} sm:block w-full md:w-64 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4 md:mb-0`}>
            <nav className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium ${activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </div>
                <ChevronRight className={`h-4 w-4 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium ${activeTab === 'security'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3" />
                  Security
                </div>
                <ChevronRight className={`h-4 w-4 ${activeTab === 'security' ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>

            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 sm:p-6">
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
                    <div className="flex flex-row items-center gap-4">
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

                    </div>
                  </div>                    {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
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
                <div className="p-4 sm:p-6">
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


                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Security Settings'}
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