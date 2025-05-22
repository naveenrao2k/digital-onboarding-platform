'use client';

import React, { useState } from 'react';
import { Shield, User, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const UserLayout = ({ children }: { children: React.ReactNode }) => {

    return (
        <div className="min-h-screen bg-slate-50">
                {/* Main Content */}
                <div className="bg-white">
                    {children}
                </div>
        </div>
    );
};

export default UserLayout;