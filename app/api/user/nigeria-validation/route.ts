// app/api/user/nigeria-validation/route.ts
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
    const { 
      bvn, 
      nin, 
      passportNumber, 
      surname, 
      driversLicense,
      firstName,
      lastName,
      dateOfBirth 
    } = body;
    
    const results: any = {};
    
    // Perform multiple validations if data is provided
    if (bvn) {
      try {
        results.bvn = await dojahService.lookupBVN(bvn, true);
      } catch (error) {
        results.bvn = { isMatch: false, error: 'BVN lookup failed' };
      }
    }
    
    if (nin) {
      try {
        results.nin = await dojahService.lookupNIN(nin);
      } catch (error) {
        results.nin = { isMatch: false, error: 'NIN lookup failed' };
      }
    }
    
    if (passportNumber && surname) {
      try {
        results.passport = await dojahService.lookupPassport(passportNumber, surname);
      } catch (error) {
        results.passport = { isMatch: false, error: 'Passport lookup failed' };
      }
    }
    
    if (driversLicense) {
      try {
        results.driversLicense = await dojahService.lookupDriversLicense(driversLicense);
      } catch (error) {
        results.driversLicense = { isMatch: false, error: 'Drivers license lookup failed' };
      }
    }
    
    // Perform AML screening if personal info is provided
    if (firstName && lastName) {
      try {
        results.aml = await dojahService.performAMLScreening({
          firstName,
          lastName,
          dateOfBirth,
          nationality: 'NG'
        });
      } catch (error) {
        results.aml = { error: 'AML screening failed' };
      }
    }
    
    // Calculate overall validation score
    const validations = Object.values(results).filter((r: any) => r.isMatch);
    const totalValidations = Object.keys(results).length;
    const validationScore = totalValidations > 0 ? (validations.length / totalValidations) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      validationScore,
      results,
      summary: {
        totalChecks: totalValidations,
        passedChecks: validations.length,
        failedChecks: totalValidations - validations.length
      }
    });
  } catch (error: any) {
    console.error('NIGERIA_VALIDATION_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during Nigeria validation',
      }),
      { status: 500 }
    );
  }
}