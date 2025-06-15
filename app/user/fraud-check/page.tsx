'use client';

import { useAuth } from '@/lib/auth-context';
import FraudCheckTool from '@/components/user/FraudCheckTool';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FraudCheckPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/access');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex justify-center py-10">Loading...</div>;
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Fraud Detection Test</h1>
            <p className="text-gray-600 mb-6">
                Use this tool to test the Dojah fraud detection APIs. For demonstration purposes only.
            </p>
            <FraudCheckTool />
        </div>
    );
}
