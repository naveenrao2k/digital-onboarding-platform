// admin-auth.ts
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Types
export interface AdminSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  }
}

// Get admin session from cookies
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('adminSession')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    // For simplicity, assuming the token is the user ID
    // In a real app, you would decode and verify a JWT or other token format
    const userId = sessionToken;
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return null;
    }
    
    return { user };
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

// Check if user is authenticated as an admin
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }
  
  return session;
}