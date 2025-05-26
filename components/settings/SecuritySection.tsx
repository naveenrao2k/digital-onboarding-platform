import React from 'react';
import { Key } from 'lucide-react';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  sessionTimeout: number;
}

interface SecuritySectionProps {
  settings: SecuritySettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string;
  successMessage: string;
  onSave: (e: React.FormEvent) => Promise<void>;
  onChange: (field: keyof SecuritySettings, value: any) => void;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  settings,
  isLoading,
  isSaving,
  error,
  successMessage,
  onSave,
  onChange,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
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

        <form onSubmit={onSave}>
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorEnabled}
                    onChange={() => onChange('twoFactorEnabled', !settings.twoFactorEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Session Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => onChange('sessionTimeout', parseInt(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            {/* Password Last Changed */}
            <div>
              <h3 className="text-sm font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">
                Last changed: {new Date(settings.lastPasswordChange).toLocaleDateString()}
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </button>
            </div>

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
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecuritySection;
