'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Upload, Camera, FileCheck, Shield } from 'lucide-react';

export default function UserNavigation() {
    const pathname = usePathname();    const navItems = [
        { name: 'Dashboard', href: '/user/dashboard', icon: Home },
        { name: 'Upload Documents', href: '/user/upload-kyc-documents', icon: Upload },
        { name: 'Selfie Verification', href: '/user/selfie-verification', icon: Camera },
        { name: 'Verification Status', href: '/user/verification-status', icon: FileCheck }
    ];

    return (
        <div className="bg-white shadow mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/user/dashboard">
                                <Shield className="h-8 w-8 text-blue-600" />
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                                ? 'border-blue-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4 mr-1" /> {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
