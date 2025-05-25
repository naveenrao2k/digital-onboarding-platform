'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  AlertCircle,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Mail,
  Users,
  Database,
  Lock,
  RefreshCw,
  CheckCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SystemSettings {
  emailNotifications: boolean;
  autoApproval: boolean;
  maintenanceMode: boolean;
  securityLevel: 'standard' | 'high' | 'maximum';
  sessionTimeout: number; // in minutes
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  documentRetentionPeriod: number; // in days
  maxFileSize: number; // in MB
}

const AdminSettingsPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    emailNotifications: true,
    autoApproval: false,
    maintenanceMode: false,
    securityLevel: 'high',
    sessionTimeout: 30,
    backupFrequency: 'daily',
    documentRetentionPeriod: 90,
    maxFileSize: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // router.push('/access');
      } else if (user.role !== 'ADMIN') {
        // Redirect non-admin users
        router.push('/user/dashboard');
      } else {
        // Fetch settings data
        fetchSettings();
      }
    }
  }, [user, loading, router]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch this data from API
      // For demo purposes, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock settings data (already set in useState default)
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate settings
      if (settings.sessionTimeout < 5 || settings.sessionTimeout > 120) {
        throw new Error('Session timeout must be between 5-120 minutes');
      }
      if (settings.documentRetentionPeriod < 1 || settings.documentRetentionPeriod > 3650) {
        throw new Error('Document retention period must be between 1-3650 days');
      }
      if (settings.maxFileSize < 1 || settings.maxFileSize > 50) {
        throw new Error('Maximum file size must be between 1-50 MB');
      }

      // Call API endpoint
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (setting: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleChange = (setting: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-gray-600">Configure system behavior and preferences</p>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="mt-2 text-gray-800 font-medium">{error}</p>
          <button
            onClick={() => fetchSettings()}
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings}>
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Notification Settings */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-medium">Notification Settings</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Send email notifications for verification status changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.emailNotifications}
                        onChange={() => handleToggle('emailNotifications')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-medium">Security Settings</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Level</label>
                  <select
                    value={settings.securityLevel}
                    onChange={(e) => handleChange('securityLevel', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="maximum">Maximum</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Determines the strictness of security checks</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Backup Settings */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-medium">Backup Settings</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleChange('backupFrequency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Document Retention */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-medium">Document Retention</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.documentRetentionPeriod}
                    onChange={(e) => handleChange('documentRetentionPeriod', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* System Settings */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <SettingsIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-medium">System Settings</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Maintenance Mode</h3>
                      <p className="text-sm text-gray-500">Temporarily disable user access for maintenance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.maintenanceMode}
                        onChange={() => handleToggle('maintenanceMode')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Auto-Approval</h3>
                      <p className="text-sm text-gray-500">Automatically approve certain document types</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.autoApproval}
                        onChange={() => handleToggle('autoApproval')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxFileSize}
                    onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>