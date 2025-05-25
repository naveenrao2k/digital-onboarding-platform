// app/api/user/verification-status/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getVerificationStatus } from '@/lib/kyc-service';

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

export async function GET(request: Request) {
  try {
    // Get userId from query param or from session
    const url = new URL(request.url);
    let userId = url.searchParams.get('userId');
    
    // If no userId in query, fall back to session
    if (!userId) {
      userId = getCurrentUserId();
    }
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No user ID provided' }),
        { status: 401 }
      );
    }
    
    const status = await getVerificationStatus(userId);
    
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('VERIFICATION_STATUS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching verification status',
      }),
      { status: 500 }
    );
  }
}
