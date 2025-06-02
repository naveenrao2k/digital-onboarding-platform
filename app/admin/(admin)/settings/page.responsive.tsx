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
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useHeader } from '../layout';

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { updateHeader } = useHeader();
  
  useEffect(() => {
    updateHeader('Admin Settings', 'Configure admin account and application settings');
  }, [updateHeader]);

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Mobile Navigation Toggle */}
          <div className="lg:hidden flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
            <h2 className="text-lg font-medium">Settings</h2>
            <button 
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Sidebar Navigation */}
          <div className={`${mobileNavOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden`}>
            <nav className="p-2 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5 mr-3 flex-shrink-0" />
                Profile
              </button>
              <button
                onClick={() => {
                  setActiveTab('security');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'security' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="h-5 w-5 mr-3 flex-shrink-0" />
                Security
              </button>
              <button
                onClick={() => {
                  setActiveTab('notifications');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-5 w-5 mr-3 flex-shrink-0" />
                Notifications
              </button>
              <button
                onClick={() => {
                  setActiveTab('appearance');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'appearance' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Monitor className="h-5 w-5 mr-3 flex-shrink-0" />
                Appearance
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
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
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-semibold text-blue-600 flex-shrink-0 mx-auto sm:mx-0">
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
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-center"
                        >
                          Change Picture
                        </button>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="First Name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Last Name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={profile.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Email Address"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          id="role"
                          value={profile.role}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">User role cannot be changed from the admin interface.</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 ${
                          isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto`}
                      >
                        {isSaving ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
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
                    <div className="space-y-6">
                      {/* Password Change Section */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Change Password</h3>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              id="currentPassword"
                              value={profile.currentPassword || ''}
                              onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter current password"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              value={profile.newPassword || ''}
                              onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter new password"
                            />
                            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long.</p>
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={profile.confirmPassword || ''}
                              onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={profile.twoFactorEnabled}
                              onChange={(e) => handleProfileChange('twoFactorEnabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {profile.twoFactorEnabled && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                            Two-factor authentication is enabled. You will receive a verification code via email when signing in from a new device.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 ${
                          isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto`}
                      >
                        {isSaving ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  
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
                    <div className="space-y-6">
                      {/* Notification Channels */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Channels</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Mail className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={profile.emailNotifications}
                                onChange={(e) => handleProfileChange('emailNotifications', e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Bell className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="text-sm font-medium text-gray-700">Browser Notifications</span>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={profile.browserNotifications}
                                onChange={(e) => handleProfileChange('browserNotifications', e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Notification Events */}
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Events</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">New Submissions</span>
                              <p className="text-xs text-gray-500">Notify when a new document is submitted for review</p>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={profile.notifyOnSubmissions}
                                onChange={(e) => handleProfileChange('notifyOnSubmissions', e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Approvals</span>
                              <p className="text-xs text-gray-500">Notify when a document is approved by another admin</p>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={profile.notifyOnApprovals}
                                onChange={(e) => handleProfileChange('notifyOnApprovals', e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 ${
                          isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto`}
                      >
                        {isSaving ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>
                  
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
                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Theme</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['light', 'dark', 'system'].map((theme) => (
                            <div key={theme} className="relative">
                              <input
                                type="radio"
                                id={`theme-${theme}`}
                                name="theme"
                                className="sr-only peer"
                                checked={profile.theme === theme}
                                onChange={() => handleProfileChange('theme', theme)}
                              />
                              <label
                                htmlFor={`theme-${theme}`}
                                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer shadow-sm ${
                                  profile.theme === theme
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="text-center">
                                  {theme === 'light' && <Sun className="h-6 w-6 mx-auto mb-1 text-gray-900" />}
                                  {theme === 'dark' && <Moon className="h-6 w-6 mx-auto mb-1 text-gray-900" />}
                                  {theme === 'system' && <Monitor className="h-6 w-6 mx-auto mb-1 text-gray-900" />}
                                  <span className="capitalize text-sm font-medium">{theme}</span>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compact Mode */}
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Compact Mode</h3>
                            <p className="text-sm text-gray-500">Uses less space to fit more information on screen</p>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={profile.compactMode}
                              onChange={(e) => handleProfileChange('compactMode', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Font Size */}
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Font Size</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['small', 'medium', 'large'].map((size) => (
                            <div key={size} className="relative">
                              <input
                                type="radio"
                                id={`size-${size}`}
                                name="fontSize"
                                className="sr-only peer"
                                checked={profile.fontSize === size}
                                onChange={() => handleProfileChange('fontSize', size)}
                              />
                              <label
                                htmlFor={`size-${size}`}
                                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer shadow-sm ${
                                  profile.fontSize === size
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <span className={`
                                  capitalize font-medium
                                  ${size === 'small' ? 'text-xs' : ''}
                                  ${size === 'medium' ? 'text-sm' : ''}
                                  ${size === 'large' ? 'text-base' : ''}
                                `}>
                                  {size}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 ${
                          isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto`}
                      >
                        {isSaving ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
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

// Missing Sun and Moon components
const Sun = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const Moon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

export default AdminSettingsPage;
