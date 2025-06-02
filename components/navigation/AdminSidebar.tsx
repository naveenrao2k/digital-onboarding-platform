'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Flag, 
  CheckCircle, 
  XCircle, 
  History, 
  Settings,
  Shield
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { 
    name: 'All Submissions', 
    href: '/admin/submissions', 
    icon: FileText,
    subItems: [
      { name: 'Flagged', href: '/admin/submissions/flagged', icon: Flag },
      { name: 'Approved', href: '/admin/submissions/approved', icon: CheckCircle },
      { name: 'Rejected', href: '/admin/submissions/rejected', icon: XCircle },
    ]
  },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 min-h-screen bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-blue-600">KYC Admin</h1>
            <p className="text-xs text-slate-500">Verification Portal</p>
          </div>
        </Link>
      </div>
        <div className="flex-1 p-5">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                            (pathname?.startsWith(item.href) && item.href !== '/admin/dashboard');
            
            return (
              <div key={item.name} className="mb-1">
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm rounded-lg ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-200 transition-colors'
                  }`}
                >
                  <item.icon size={18} className={`mr-3 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  {item.name}
                </Link>
                
                {item.subItems && (
                  <div className="mt-1 ml-7">
                    {item.subItems.map((subItem) => {
                      const isSubItemActive = pathname === subItem.href;
                      
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`flex items-center pl-4 pr-2 py-2 text-sm rounded-lg mb-1 ${
                            isSubItemActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-100 transition-colors'
                          }`}
                        >
                          <subItem.icon size={15} className={`mr-2 ${isSubItemActive ? 'text-blue-700' : 'text-slate-500'}`} />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;