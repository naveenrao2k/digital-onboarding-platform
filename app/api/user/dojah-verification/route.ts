// app/api/user/dojah-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dojahService from '@/lib/dojah-service';

export const dynamic = 'force-dynamic';

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
    
    const body = await request.json();
    const { verificationType, documentId, selfieBase64, idDocumentBase64, personalInfo } = body;
    
    let verificationId: string;
    
    switch (verificationType) {
      case 'SELFIE_VERIFICATION':
        if (!documentId || !selfieBase64) {
          return new NextResponse(
            JSON.stringify({ error: 'Missing selfie data' }),
            { status: 400 }
          );
        }
        verificationId = await dojahService.verifySelfie(
          userId,
          documentId,
          selfieBase64,
          idDocumentBase64
        );
        break;
        
      case 'BVN_LOOKUP':
        if (!personalInfo?.bvn) {
          return new NextResponse(
            JSON.stringify({ error: 'BVN is required' }),
            { status: 400 }
          );
        }
        const bvnResult = await dojahService.lookupBVN(personalInfo.bvn, true);
        return NextResponse.json({ success: true, result: bvnResult });
        
      case 'NIN_LOOKUP':
        if (!personalInfo?.nin) {
          return new NextResponse(
            JSON.stringify({ error: 'NIN is required' }),
            { status: 400 }
          );
        }
        const ninResult = await dojahService.lookupNIN(personalInfo.nin);
        return NextResponse.json({ success: true, result: ninResult });
        
      case 'PASSPORT_LOOKUP':
        if (!personalInfo?.passportNumber || !personalInfo?.surname) {
          return new NextResponse(
            JSON.stringify({ error: 'Passport number and surname are required' }),
            { status: 400 }
          );
        }
        const passportResult = await dojahService.lookupPassport(
          personalInfo.passportNumber,
          personalInfo.surname
        );
        return NextResponse.json({ success: true, result: passportResult });
        
      case 'DRIVERS_LICENSE_LOOKUP':
        if (!personalInfo?.licenseNumber) {
          return new NextResponse(
            JSON.stringify({ error: 'License number is required' }),
            { status: 400 }
          );
        }
        const dlResult = await dojahService.lookupDriversLicense(personalInfo.licenseNumber);
        return NextResponse.json({ success: true, result: dlResult });
        
      default:
        return new NextResponse(
          JSON.stringify({ error: 'Invalid verification type' }),
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      verificationId,
      message: 'Verification initiated successfully' 
    });
  } catch (error: any) {
    console.error('DOJAH_VERIFICATION_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during verification',
      }),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const verificationId = url.searchParams.get('verificationId');
    
    if (verificationId) {
      // Get specific verification
      const verification = await dojahService.getVerificationStatus(verificationId);
      return NextResponse.json(verification);
    } else {
      // Get all user verifications
      const verifications = await dojahService.getUserVerifications(userId);
      return NextResponse.json(verifications);
    }
  } catch (error: any) {
    console.error('GET_VERIFICATION_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching verification data',
      }),
      { status: 500 }
    );
  }
}