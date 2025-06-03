// app/api/user/selfie-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadSelfieVerification } from '@/lib/kyc-service';
import { dojahService } from '@/lib/dojah-service';

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

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return btoa(binary);
}

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
    
    // Convert file to base64 for liveness check
    const base64Image = await fileToBase64(file);
    
    // Initialize liveness check result
    let livenessResult: {
      isLive: boolean;
      livenessProbability: number;
      faceDetected: boolean;
      multiFaceDetected: boolean;
      faceDetails: any;
      faceQuality: any;
    } = {
      isLive: false,
      livenessProbability: 0,
      faceDetected: false,
      multiFaceDetected: false,
      faceDetails: null,
      faceQuality: null
    };
    
    try {
      // Perform liveness check first
      console.log('Performing liveness check on image');
      livenessResult = await dojahService.checkLiveness(base64Image);
      console.log('Liveness check result:', JSON.stringify(livenessResult));
      
      // Fail if no face detected or multiple faces detected
      if (!livenessResult.faceDetected) {
        return new NextResponse(
          JSON.stringify({ error: 'No face detected in the image. Please try again with a clear view of your face.' }),
          { status: 400 }
        );
      }
      
      if (livenessResult.multiFaceDetected) {
        return new NextResponse(
          JSON.stringify({ error: 'Multiple faces detected in the image. Please ensure only your face is visible.' }),
          { status: 400 }
        );
      }
      
      // Check if the image passes the liveness check (probability > 50)
      if (!livenessResult.isLive) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Liveness check failed. Please ensure you are in good lighting and try again.',
            details: {
              livenessProbability: livenessResult.livenessProbability,
              threshold: 50
            }
          }),
          { status: 400 }
        );
      }
    } catch (livenessError) {
      console.error('Error during liveness check:', livenessError);
      // Continue with the process even if liveness check fails
      // This allows for graceful degradation if the Dojah API has issues
    }
    
    // Upload the selfie if liveness check passes
    const selfie = await uploadSelfieVerification(userId, file);
    
    // Return combined result
    return NextResponse.json({
      ...selfie,
      livenessCheck: {
        passed: livenessResult?.isLive || false,
        isLive: livenessResult?.isLive || false,
        livenessProbability: livenessResult?.livenessProbability || 0,
        faceDetails: livenessResult?.faceDetails || null
      }
    });
  } catch (error: any) {
    console.error('SELFIE_VERIFICATION_ERROR', error);
    
    // Get more detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      cause: error.cause
    };
    
    console.error('Detailed error information:', JSON.stringify(errorDetails));
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during selfie verification',
        errorType: error.name
      }),
      { status: 500 }
    );
  }
}
