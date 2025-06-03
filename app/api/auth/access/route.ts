// app/api/auth/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Use types from our local schema
type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
type AccountType = 'INDIVIDUAL' | 'PARTNERSHIP' | 'ENTERPRISE' | 'LLC';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

// Define types for external portal data
interface ExternalPortalData {
  id: string;
  name?: string;
  phone_number?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Extract data from URL query parameters - only supporting id, name, and phone_number fields
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    const name = searchParams.get('name') || undefined;
    const phone_number = searchParams.get('phone_number') || undefined;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log incoming external portal request
    console.log(`Incoming access request`, { id });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id },
      include: {
        kycDocuments: true,
        verificationStatus: true,
        account: true
      }
    });

    let isNewUser = false;
    let hasSubmittedKyc = false;
    let portalData = {};

    // If user doesn't exist, create a profile with all available data
    if (!user) {
      isNewUser = true;
      
      // Generate a unique placeholder email using the ID
      const placeholderEmail = `user_${id}@placeholder.com`;
      
      // Create user with basic information
      user = await prisma.user.create({
        data: {
          id,
          firstName: name ? name.split(' ')[0] : '',
          lastName: name ? name.split(' ').slice(1).join(' ') : '',
          phone: phone_number || '',
          email: placeholderEmail, // Use placeholder email that's unique based on the ID
          role: 'USER' as UserRole,
          accountType: 'INDIVIDUAL' as AccountType,
          accountStatus: 'PENDING',
        },
        include: {
          kycDocuments: true,
          verificationStatus: true,
          account: true
        }
      });

      // Create verification status
      await prisma.verificationStatus.create({
        data: {
          userId: user.id,
          kycStatus: 'PENDING',
          selfieStatus: 'PENDING',
          overallStatus: 'PENDING',
          progress: 0,
        }
      });
      
      // Refresh user to get the related data
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          kycDocuments: true,
          verificationStatus: true,
          account: true
        }
      });
      
      // Save audit log for user creation
      if (user) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_CREATED',
            details: JSON.stringify({
              timestamp: new Date().toISOString()
            })
          }
        });
      }
    } else {
      // Check if user has submitted KYC documents
      hasSubmittedKyc = user.kycDocuments.length > 0;
      
      // Update user with any new phone information if it's empty
      if (!user.phone && phone_number) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phone: phone_number },
          include: {
            kycDocuments: true,
            verificationStatus: true,
            account: true
          }
        });
      }
      
      // Log portal access
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PORTAL_ACCESS',
          details: JSON.stringify({
            timestamp: new Date().toISOString()
          })
        }
      });
    }

    // Check if user is still null after all operations
    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Set session cookie
    const sessionData = {
      userId: user.id,
      role: user.role
    };

    cookies().set({
      name: 'session',
      value: JSON.stringify(sessionData),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Determine the redirect URL based on user status
    const redirectUrl = isNewUser ? '/user/upload-kyc-documents' : '/user/dashboard';
    
    // Always set autoRedirect to true to enforce redirect behavior
    const autoRedirect = true;
    
    if (autoRedirect) {
      // Send a redirect response with the user data
      const response = NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));
      
      // Add the user data as a header (encoded)
      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        isNewUser,
        hasSubmittedKyc,
      };
      
      response.headers.set('X-User-Data', Buffer.from(JSON.stringify(userData)).toString('base64'));
      return response;
    }
    
    // Otherwise, return JSON response as before
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      isNewUser,
      hasSubmittedKyc,
      redirectUrl
    });

  } catch (error: any) {
    console.error('ERROR_USER_ACCESS:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error accessing system' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
