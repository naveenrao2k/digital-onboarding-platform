// app/api/auth/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { id, name, phoneNumber } = await req.json();

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id },
      include: {
        kycDocuments: true,
        verificationStatus: true
      }
    });

    let isNewUser = false;
    let hasSubmittedKyc = false;

    // If user doesn't exist, create a minimal profile
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          id,
          firstName: name ? name.split(' ')[0] : 'Guest',
          lastName: name ? name.split(' ').slice(1).join(' ') : String(Date.now()),
          phone: phoneNumber || '',
          email: `${id}@example.com`, // Placeholder email using ID
          role: 'USER',
          accountType: 'INDIVIDUAL',
          accountStatus: 'PENDING',
        },
        include: {
          kycDocuments: true,
          verificationStatus: true
        }
      });
    } else {
      // Check if user has submitted KYC documents
      hasSubmittedKyc = user.kycDocuments.length > 0;
    }

    // Set session cookie
    const sessionData = {
      userId: user.id,
      role: user.role,
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

    // Return user data with flags for frontend
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      accountType: user.accountType,
      isNewUser,
      hasSubmittedKyc
    });

  } catch (error: any) {
    console.error('ERROR_USER_ACCESS:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error accessing system' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
