// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  accountType?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessWithId: (id: string, name?: string, phoneNumber?: string, autoRedirect?: boolean) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Clear the session if user not found
        if (response.status === 401 || response.status === 500) {
          // Try to sign out to clear any invalid session
          try {
            await fetch('/api/auth/signout', { method: 'POST' });
          } catch (e) {
            console.error('Failed to sign out:', e);
          }
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);  const accessWithId = async (id: string, name?: string, phoneNumber?: string, autoRedirect: boolean = false) => {
    setLoading(true);
    
    try {
      // Build URL with query parameters
      let url = `/api/auth/access?id=${encodeURIComponent(id)}`;
      if (name) url += `&name=${encodeURIComponent(name)}`;
      if (phoneNumber) url += `&phone_number=${encodeURIComponent(phoneNumber)}`;
      if (autoRedirect) url += '&autoRedirect=true';
      
      // Check if the user exists or create a minimal profile with the provided ID
      const response = await fetch(url, {
        method: 'GET',
        redirect: autoRedirect ? 'follow' : 'manual', // Allow fetch to follow redirects if autoRedirect is true
      });

      if (autoRedirect && response.redirected) {
        // For auto-redirect, extract the encoded user data and then navigate to the redirect URL
        const encodedUserData = response.headers.get('X-User-Data');
        if (encodedUserData) {
          try {
            const userData = JSON.parse(atob(encodedUserData));
            setUser(userData);
          } catch (error) {
            console.error('Error parsing encoded user data', error);
          }
        }
        
        // Allow the browser to handle the redirect
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Access failed');
      }

      const userData = await response.json();
      setUser(userData);
      
      // Manual redirect based on user's KYC status
      if (userData.isNewUser || !userData.hasSubmittedKyc) {
        router.push('/user/upload-kyc-documents');
      } else {
        router.push('/user/dashboard');
      }
      } catch (error: any) {
      console.error('Access error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessWithId, adminLogin: async (email: string, password: string) => {
      // Implement adminLogin logic here or throw error if not implemented
      throw new Error('adminLogin not implemented');
    }, signOut }}>
      {children}
    </AuthContext.Provider>
  );

};
