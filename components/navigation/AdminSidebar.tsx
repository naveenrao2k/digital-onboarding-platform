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
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '@/app/admin/(admin)/layout';

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
  const { close: closeSidebar } = useSidebar();

  return (
    <div className="w-full h-full bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-slate-200">
        <Link href="/admin/dashboard" 
          className="flex items-center space-x-2"
          onClick={() => closeSidebar()}
        >
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-blue-600">KYC Admin</h1>
            <p className="text-xs text-slate-500">Verification Portal</p>
          </div>
        </Link>
      </div>
      <div className="flex-1 p-4">        <nav className="space-y-1">
          {navItems.map((item) => {
            const isParentActive = pathname === item.href || 
                          (item.subItems && pathname?.startsWith(item.href) && item.href !== '/admin/dashboard');
            
            return (
              <div key={item.name} className="mb-1">
                <div className="flex flex-col">                  {item.subItems ? (
                    <Link
                      href={item.href}
                      onClick={() => closeSidebar()}
                      className={`flex items-center justify-between px-4 py-3 text-sm rounded-lg ${
                        isParentActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-200 transition-colors'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon size={18} className={`mr-3 ${isParentActive ? 'text-blue-700' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown size={16} className="text-gray-500" />
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => closeSidebar()}
                      className={`flex items-center px-4 py-3 text-sm rounded-lg ${
                        isParentActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-200 transition-colors'
                      }`}
                    >
                      <item.icon size={18} className={`mr-3 ${isParentActive ? 'text-blue-700' : 'text-slate-500'}`} />
                      {item.name}
                    </Link>
                  )}
                  {item.subItems && (
                    <div className="mt-1 ml-7">
                      {item.subItems.map((subItem) => {
                        const isSubItemActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => closeSidebar()}
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
              </div>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500 text-center">
        KYC Admin Portal v1.0
      </div>
    </div>
  );
};

export default AdminSidebar;