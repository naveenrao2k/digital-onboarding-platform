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
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      console.log('No session cookie found');
      return null;
    }

    // Parse the session data from the JSON string in the cookie
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
      console.log('Session data parsed:', JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to parse session cookie:', e);
      return null;
    }

    if (!sessionData.userId || !sessionData.isAdmin) {
      console.log('Session data is invalid or not for an admin user');
      return null;
    }

    const userId = sessionData.userId;

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