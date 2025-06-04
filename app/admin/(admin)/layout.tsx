'use client';

import { AuthProvider } from '@/lib/auth-context';
import AdminSidebar from '@/components/navigation/AdminSidebar';
import AdminHeader from '@/components/navigation/AdminHeader';
import { usePathname } from 'next/navigation';

// This context allows child pages to set the header information
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

// Create a sidebar context to manage mobile sidebar state
interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only run this on mobile when sidebar is open
      if (window.innerWidth < 1024 && sidebarOpen) {
        // Check if the click is outside the sidebar
        const sidebar = document.getElementById('admin-sidebar');
        const toggleButton = document.getElementById('sidebar-toggle');
        
        if (sidebar && 
            !sidebar.contains(event.target as Node) && 
            toggleButton && 
            !toggleButton.contains(event.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  const updateHeader = (title: string, subtitle?: string) => {
    setHeaderTitle(title);
    setHeaderSubtitle(subtitle || '');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <AuthProvider>
      <HeaderContext.Provider value={{ updateHeader }}>
        <SidebarContext.Provider value={{ isOpen: sidebarOpen, toggle: toggleSidebar, close: closeSidebar }}>
          <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            {/* Mobile overlay for sidebar */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                onClick={closeSidebar}
              />
            )}
            
            {/* Sidebar */}
            <div 
              id="admin-sidebar"
              className={`fixed inset-y-0 left-0 z-30 transform lg:relative lg:translate-x-0 transition duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } lg:w-64 w-64 lg:block`}
            >
              <AdminSidebar />
            </div>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col">
              <AdminHeader title={headerTitle} subtitle={headerSubtitle} />
              <main className="flex-1 p-4  overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        </SidebarContext.Provider>
      </HeaderContext.Provider>
    </AuthProvider>
  );
}