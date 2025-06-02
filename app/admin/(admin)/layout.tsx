'use client';

import { AuthProvider } from '@/lib/auth-context';
import AdminSidebar from '@/components/navigation/AdminSidebar';
import AdminHeader from '@/components/navigation/AdminHeader';
import { usePathname } from 'next/navigation';

// This context allows child pages to set the header information
import { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextType {
  updateHeader: (title: string, subtitle?: string) => void;
}

export const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerTitle, setHeaderTitle] = useState('Admin Dashboard');
  const [headerSubtitle, setHeaderSubtitle] = useState('Manage user verification and documents');

  const updateHeader = (title: string, subtitle?: string) => {
    setHeaderTitle(title);
    setHeaderSubtitle(subtitle || '');
  };

  return (
    <AuthProvider>
      <HeaderContext.Provider value={{ updateHeader }}>
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1 min-h-screen bg-gray-50">
            <AdminHeader title={headerTitle} subtitle={headerSubtitle} />
            {children}
          </div>
        </div>
      </HeaderContext.Provider>
    </AuthProvider>
  );
}