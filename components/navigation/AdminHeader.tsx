'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    if (user?.id) {
      router.push(`/admin/settings`);
    } else {
      console.error("User ID not available");
    }
    setDropdownOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Page title - dynamic based on props */}
          <div className="">
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>          <div className="flex items-center">
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium cursor-pointer">
                  {user?.firstName?.charAt(0) || 'A'}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
                {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  {/* User details section */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center mb-2">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium mr-3">
                        {user?.firstName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    <div className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded inline-block">
                      {user?.role || 'ADMIN'}
                    </div>
                  </div>
                  
                  {/* Menu options */}
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left border-t border-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
