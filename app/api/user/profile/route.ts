// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile } from '@/lib/auth-service';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

// Helper to get the current user ID from cookies
const getCurrentUserId = (): string | null => {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const session = JSON.parse(sessionCookie);
    return session.userId || null;
  } catch {
    return null;
  }
};

export async function GET() {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No valid session found' }),
        { status: 401 }
      );
    }
    
    try {
      const profile = await getUserProfile(userId);
      return NextResponse.json(profile);
    } catch (error: any) {
      console.error('USER_PROFILE_ERROR', error);
      
      // If user not found, return 401 instead of 500
      if (error.message.includes('User not found')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized - Invalid user ID' }),
          { status: 401 }
        );
      }
      
      return new NextResponse(
        JSON.stringify({
          error: error.message || 'An error occurred while fetching user profile',
        }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('USER_PROFILE_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching user profile',
      }),
      { status: 500 }
    );
  }
}
