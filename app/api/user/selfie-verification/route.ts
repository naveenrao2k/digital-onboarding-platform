// app/api/user/selfie-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadSelfieVerification } from '@/lib/kyc-service';
import { dojahService } from '@/lib/dojah-service';
import { 
  handleApiError, 
  AuthenticationError, 
  ValidationError,
  ServiceUnavailableError,
  validateRequired,
  validateFileSize,
  validateFileType,
  externalServiceCircuitBreaker
} from '@/lib/error-handler';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

// Helper to get the current user ID from cookies with enhanced validation
const getCurrentUserId = (): string | null => {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;
    
    const session = JSON.parse(sessionCookie);
    const userId = session.userId;
    
    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return null;
    }
    
    return userId;
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
};

// Helper function to convert file to base64 with error handling
async function fileToBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binary);
  } catch (error: any) {
    throw new ValidationError('Failed to process image file');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      throw new AuthenticationError('Valid session required to upload selfie');
    }
    
    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      throw new ValidationError('Invalid form data provided');
    }
    
    const file = formData.get('file') as File;
    
    // Validate required fields
    validateRequired(file, 'file');
    
    // Additional file validation
    if (!file || !(file instanceof File)) {
      throw new ValidationError('Valid image file is required');
    }
    
    // Validate file for selfie (stricter validation)
    validateFileSize(file, 5); // 5MB limit for selfies
    validateFileType(file, ['image/jpeg', 'image/png', 'image/jpg']);
    
    // Log the selfie upload attempt
    console.log('SELFIE_UPLOAD_ATTEMPT', {
      userId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      timestamp: new Date().toISOString()
    });
    
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
    
    // Perform liveness check with circuit breaker
    try {
      console.log('Performing liveness check on selfie image');
      
      livenessResult = await externalServiceCircuitBreaker.call(async () => {
        return await dojahService.checkLiveness(base64Image);
      });
      
      console.log('Liveness check result:', {
        userId,
        isLive: livenessResult.isLive,
        livenessProbability: livenessResult.livenessProbability,
        faceDetected: livenessResult.faceDetected,
        timestamp: new Date().toISOString()
      });
      
      // Fail if no face detected or multiple faces detected
      if (!livenessResult.faceDetected) {
        throw new ValidationError('No face detected in the image. Please try again with a clear view of your face.');
      }
      
      if (livenessResult.multiFaceDetected) {
        throw new ValidationError('Multiple faces detected in the image. Please ensure only your face is visible.');
      }
      
      // Check if the image passes the liveness check (probability > 50)
      if (!livenessResult.isLive) {
        throw new ValidationError(
          `Liveness check failed (${livenessResult.livenessProbability}% confidence). Please ensure you are in good lighting and try again.`
        );
      }
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      console.error('Liveness check service error:', error);
      throw new ServiceUnavailableError(
        'Liveness verification service is temporarily unavailable. Please try again later.'
      );
    }
    
    // Upload the selfie document
    const selfieDocument = await uploadSelfieVerification(userId, file);
    
    // Log successful selfie upload
    console.log('SELFIE_UPLOAD_SUCCESS', {
      userId,
      documentId: selfieDocument.id,
      fileName: file.name,
      livenessScore: livenessResult.livenessProbability,
      timestamp: new Date().toISOString()
    });
      // Return success response with liveness check results
    return NextResponse.json({
      id: selfieDocument.id,
      fileName: selfieDocument.fileName,
      status: selfieDocument.status,
      capturedAt: selfieDocument.capturedAt, // Use capturedAt instead of uploadedAt for SelfieVerification
      livenessCheck: {
        passed: livenessResult.isLive,
        confidence: livenessResult.livenessProbability,
        faceDetected: livenessResult.faceDetected
      },
      message: 'Selfie uploaded and verified successfully'
    });
    
  } catch (error: any) {
    // Enhanced error logging
    console.error('SELFIE_VERIFICATION_ERROR', {
      userId: getCurrentUserId(),
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return handleApiError(error);
  }
}
