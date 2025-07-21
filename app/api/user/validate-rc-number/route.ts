import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dojahService from '@/lib/dojah-service';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rcNumber } = await request.json();

    if (!rcNumber) {
      return NextResponse.json({ 
        error: 'RC Number is required',
        isValid: false 
      }, { status: 400 });
    }

    // Validate RC Number format (basic validation)
    const rcPattern = /^[RC]*[0-9]+$/i;
    if (!rcPattern.test(rcNumber.replace(/\s/g, ''))) {
      return NextResponse.json({
        error: 'Invalid RC Number format',
        isValid: false
      }, { status: 400 });
    }

    // Call Dojah CAC lookup service
    try {
      const cacResult = await dojahService.lookupCAC(rcNumber);

      if (cacResult.isValid && cacResult.companyData) {
        return NextResponse.json({
          isValid: true,
          companyData: cacResult.companyData,
          message: 'RC Number validated successfully'
        });
      } else {
        return NextResponse.json({
          isValid: false,
          error: 'RC Number not found in CAC database'
        }, { status: 404 });
      }
    } catch (error: any) {
      console.error('CAC validation error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return NextResponse.json({
          isValid: false,
          error: 'RC Number not found in CAC database'
        }, { status: 404 });
      }

      return NextResponse.json({
        isValid: false,
        error: 'Failed to validate RC Number. Please try again.'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('RC Number validation API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      isValid: false
    }, { status: 500 });
  }
}
