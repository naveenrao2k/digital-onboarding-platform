// app/api/user/selfie-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadSelfieVerification } from '@/lib/kyc-service';

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

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing file' }),
        { status: 400 }
      );
    }
    
    const selfie = await uploadSelfieVerification(userId, file);
    
    return NextResponse.json(selfie);
  } catch (error: any) {
    console.error('SELFIE_VERIFICATION_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during selfie verification',
      }),
      { status: 500 }
    );
  }
}
