'use client';

import React from 'react';

const UserLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pb-12">
                {children}
            </main>
        </div>
    );
};

export default UserLayout;