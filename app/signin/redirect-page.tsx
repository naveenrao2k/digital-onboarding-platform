'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect users to the new access page
    router.replace('/access');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">Redirecting to access page...</p>
      </div>
    </div>
  );
}
